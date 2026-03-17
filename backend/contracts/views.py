from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Avg, Count
import logging, os

from .models import Contract, ClauseAnalysis, MissingClause, SuggestedQuestion, UserProfile, Plan
from .serializers import (
    ContractListSerializer, ContractDetailSerializer, ContractUploadSerializer,
    UserSerializer, PlanSerializer
)
from .services.extractor import extract_text_from_file, detect_language
from .services.analyzer import analyze_contract, apply_rule_engine

logger = logging.getLogger(__name__)


def get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'plan': Plan.objects.filter(name='free').first()}
    )
    return profile


def save_analysis_results(contract, analysis):
    info = analysis.get('contract_info', {})
    contract.employer_name    = info.get('employer_name', '')
    contract.employee_name    = info.get('employee_name', '')
    contract.job_title        = info.get('job_title', '')
    contract.basic_salary     = info.get('basic_salary', '')
    contract.gross_salary     = info.get('gross_salary', '')
    contract.contract_duration= info.get('contract_duration', '')
    contract.probation_period = info.get('probation_period', '')
    contract.work_location    = info.get('work_location', '')
    contract.start_date       = info.get('start_date', '')

    summary = analysis.get('executive_summary', {})
    contract.overall_risk     = summary.get('overall_status', 'attention')
    contract.compliance_score = summary.get('compliance_score', 50)
    contract.executive_summary= summary.get('summary_text', '')

    ClauseAnalysis.objects.filter(contract=contract).delete()
    compliant = attention = non_compliant = 0
    for i, c in enumerate(analysis.get('clauses', [])):
        a = c.get('assessment', 'needs_clarification')
        if a == 'compliant': compliant += 1
        elif a in ('needs_clarification','ambiguous','unusual'): attention += 1
        else: non_compliant += 1
        ClauseAnalysis.objects.create(
            contract=contract, category=c.get('category','other'),
            clause_title=c.get('clause_title','Clause'), clause_text=c.get('clause_text','')[:500],
            assessment=a, risk_level=c.get('risk_level','medium'),
            explanation=c.get('explanation',''), regulatory_reference=c.get('regulatory_reference',''),
            recommendation=c.get('recommendation',''), order=i
        )
    contract.compliant_count = compliant
    contract.attention_count = attention
    contract.non_compliant_count = non_compliant

    MissingClause.objects.filter(contract=contract).delete()
    missing = analysis.get('missing_clauses', [])
    contract.missing_clauses_count = len(missing)
    for m in missing:
        MissingClause.objects.create(
            contract=contract, clause_name=m.get('clause_name',''),
            importance=m.get('importance','recommended'),
            description=m.get('description',''), regulatory_reference=m.get('regulatory_reference','')
        )

    SuggestedQuestion.objects.filter(contract=contract).delete()
    for q in analysis.get('suggested_questions', []):
        SuggestedQuestion.objects.create(
            contract=contract, question=q.get('question',''),
            related_clause=q.get('related_clause',''), priority=q.get('priority','medium')
        )


class ContractUploadView(APIView):
    parser_classes  = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Plan limit check
        if request.user.is_authenticated:
            profile = get_or_create_profile(request.user)
            if not profile.can_analyze():
                plan_name = profile.plan.display_name if profile.plan else 'Free'
                limit = profile.plan.monthly_limit if profile.plan else 3
                return Response({
                    'error': f'Monthly limit reached ({limit} analyses on {plan_name} plan). Upgrade to continue.',
                    'limit_reached': True,
                    'current_plan': plan_name,
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

        serializer = ContractUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        file = serializer.validated_data['file']
        contract_type = serializer.validated_data['contract_type']

        contract = Contract.objects.create(
            user=request.user,
            file=file, file_name=file.name, file_type='',
            contract_type=contract_type, status='processing'
        )

        try:
            file.seek(0)
            raw_text, file_type = extract_text_from_file(file, file.name)
            contract.raw_text  = raw_text
            contract.file_type = file_type

            if not raw_text or len(raw_text.strip()) < 50:
                contract.status = 'failed'; contract.save()
                return Response({'error': 'Could not extract readable text from the file.'}, status=422)

            contract.language = detect_language(raw_text)
            result = analyze_contract(raw_text, contract_type, contract.language)
            if not result:
                contract.status = 'failed'; contract.save()
                return Response({'error': 'AI analysis failed. Check OPENAI_API_KEY.'}, status=500)

            result = apply_rule_engine(result, raw_text)
            save_analysis_results(contract, result)
            contract.status = 'completed'
            contract.analyzed_at = timezone.now()
            contract.save()

            # Increment usage counters
            if request.user.is_authenticated:
                profile = get_or_create_profile(request.user)
                profile.contracts_this_month += 1
                profile.total_contracts += 1
                profile.save(update_fields=['contracts_this_month', 'total_contracts'])

            return Response(ContractDetailSerializer(contract).data, status=201)

        except Exception as e:
            logger.error(f"Upload error: {e}", exc_info=True)
            contract.status = 'failed'; contract.save()
            return Response({'error': str(e)}, status=500)


class ContractListView(generics.ListAPIView):
    serializer_class   = ContractListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Contract.objects.filter(user=self.request.user)


class ContractDetailView(generics.RetrieveAPIView):
    serializer_class   = ContractDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field       = 'id'

    def get_object(self):
        contract = get_object_or_404(Contract, id=self.kwargs['id'])
        # Allow owner or admin or shared
        if contract.user == self.request.user:
            return contract
        profile = get_or_create_profile(self.request.user)
        if profile.is_admin or contract.is_shared:
            return contract
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You don't have access to this contract.")


class ContractDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        contract = get_object_or_404(Contract, id=id)
        if contract.user != request.user:
            profile = get_or_create_profile(request.user)
            if not profile.is_admin:
                return Response({'error': 'Permission denied.'}, status=403)
        contract.delete()
        return Response(status=204)


class ContractShareView(APIView):
    """Toggle public sharing of a contract."""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        contract = get_object_or_404(Contract, id=id, user=request.user)
        contract.is_shared = not contract.is_shared
        contract.save(update_fields=['is_shared'])
        return Response({'is_shared': contract.is_shared, 'share_token': str(contract.share_token)})


class SharedContractView(generics.RetrieveAPIView):
    """Public endpoint — view a shared contract by token."""
    serializer_class   = ContractDetailSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        token = self.kwargs['token']
        return get_object_or_404(Contract, share_token=token, is_shared=True, status='completed')


class ContractStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Contract.objects.filter(user=request.user, status='completed')
        total = qs.count()
        avg   = qs.aggregate(avg=Avg('compliance_score'))['avg'] or 0
        profile = get_or_create_profile(request.user)
        return Response({
            'total_contracts':        total,
            'valid_contracts':        qs.filter(overall_risk='valid').count(),
            'attention_contracts':    qs.filter(overall_risk='attention').count(),
            'high_risk_contracts':    qs.filter(overall_risk='high_risk').count(),
            'average_compliance_score': round(avg, 1),
            'contracts_this_month':   profile.contracts_this_month,
            'monthly_limit':          profile.plan.monthly_limit if profile.plan else 3,
            'remaining_analyses':     profile.remaining_analyses(),
            'plan_name':              profile.plan.display_name if profile.plan else 'Free',
        })


# ── Admin Views ────────────────────────────────────────────────────
class AdminRequiredMixin:
    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        profile = get_or_create_profile(request.user)
        if not profile.is_admin and not request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admin access required.")


class AdminUsersView(AdminRequiredMixin, APIView):
    def get(self, request):
        self.check_admin(request)
        users = User.objects.all().order_by('-date_joined').prefetch_related('profile', 'contracts')
        data = []
        for u in users:
            profile = getattr(u, 'profile', None)
            data.append({
                'id':            u.id,
                'username':      u.username,
                'email':         u.email,
                'full_name':     u.get_full_name(),
                'date_joined':   u.date_joined,
                'is_active':     u.is_active,
                'is_staff':      u.is_staff,
                'plan':          profile.plan.display_name if (profile and profile.plan) else 'Free',
                'plan_key':      profile.plan.name if (profile and profile.plan) else 'free',
                'total_contracts': profile.total_contracts if profile else 0,
                'contracts_this_month': profile.contracts_this_month if profile else 0,
                'company':       profile.company if profile else '',
                'is_admin':      profile.is_admin if profile else False,
            })
        return Response(data)


class AdminUserDetailView(AdminRequiredMixin, APIView):
    def patch(self, request, user_id):
        self.check_admin(request)
        user = get_object_or_404(User, id=user_id)
        profile = get_or_create_profile(user)

        if 'plan' in request.data:
            plan = Plan.objects.filter(name=request.data['plan']).first()
            if plan:
                profile.plan = plan
                profile.save(update_fields=['plan'])

        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
            user.save(update_fields=['is_active'])

        if 'is_admin' in request.data:
            profile.is_admin = request.data['is_admin']
            profile.save(update_fields=['is_admin'])

        return Response({'success': True})

    def delete(self, request, user_id):
        self.check_admin(request)
        if str(user_id) == str(request.user.id):
            return Response({'error': 'Cannot delete your own account.'}, status=400)
        user = get_object_or_404(User, id=user_id)
        user.delete()
        return Response(status=204)


class AdminStatsView(AdminRequiredMixin, APIView):
    def get(self, request):
        self.check_admin(request)  # raises PermissionDenied if not admin
        from django.utils import timezone
        from django.db.models import Count
        today = timezone.now().date()

        total_users      = User.objects.count()
        pro_users        = UserProfile.objects.filter(plan__name='pro').count()
        enterprise_users = UserProfile.objects.filter(plan__name='enterprise').count()
        total_contracts  = Contract.objects.count()
        contracts_today  = Contract.objects.filter(created_at__date=today).count()
        avg = Contract.objects.filter(status='completed').aggregate(a=Avg('compliance_score'))['a'] or 0

        return Response({
            'total_users':       total_users,
            'pro_users':         pro_users,
            'enterprise_users':  enterprise_users,
            'free_users':        total_users - pro_users - enterprise_users,
            'total_contracts':   total_contracts,
            'contracts_today':   contracts_today,
            'avg_compliance':    round(avg, 1),
        })


# ── Chat & Compare ──────────────────────────────────────────────────
class ContractChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        contract = get_object_or_404(Contract, id=id)
        if contract.user != request.user:
            profile = get_or_create_profile(request.user)
            if not profile.is_admin:
                return Response({'error': 'Permission denied.'}, status=403)

        question = request.data.get('question', '').strip()
        history  = request.data.get('history', [])
        if not question:
            return Response({'error': 'Question required'}, status=400)

        api_key = os.getenv('OPENAI_API_KEY', '').strip()
        if not api_key:
            return Response({'error': 'OPENAI_API_KEY not configured'}, status=500)

        ctx = f"""Contract: {contract.file_name}
Employer: {contract.employer_name or 'Unknown'} | Job: {contract.job_title or 'Unknown'}
Salary: {contract.basic_salary or 'N/A'} | Probation: {contract.probation_period or 'N/A'}
Score: {contract.compliance_score}% ({contract.overall_risk})
Summary: {contract.executive_summary}
Key findings: {'; '.join(f'{c.clause_title} ({c.assessment})' for c in contract.clauses.all()[:8])}"""

        msgs = [{"role":"system","content":f"You are a Saudi Labor Law expert. Answer questions about this contract concisely.\n\nContract context:\n{ctx}"}]
        for h in history[-6:]:
            if h.get('role') in ('user','assistant'):
                msgs.append({"role": h['role'], "content": h['content']})
        msgs.append({"role":"user","content": question})

        try:
            import requests as req
            resp = req.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": os.getenv("OPENAI_MODEL","gpt-4o-mini"), "max_tokens":600, "temperature":0.3, "messages": msgs},
                timeout=30)
            if resp.status_code != 200:
                return Response({'error': f'AI error {resp.status_code}'}, status=500)
            return Response({'answer': resp.json()["choices"][0]["message"]["content"]})
        except Exception as e:
            return Response({'error': 'Chat failed'}, status=500)


class ContractCompareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        id1, id2 = request.data.get('contract1'), request.data.get('contract2')
        if not id1 or not id2:
            return Response({'error': 'Both contract IDs required'}, status=400)

        c1 = get_object_or_404(Contract, id=id1, user=request.user)
        c2 = get_object_or_404(Contract, id=id2, user=request.user)
        api_key = os.getenv('OPENAI_API_KEY','').strip()
        if not api_key:
            return Response({'error': 'OPENAI_API_KEY not configured'}, status=500)

        def summary(c):
            return f"File: {c.file_name} | Score: {c.compliance_score}% ({c.overall_risk}) | Employer: {c.employer_name or 'N/A'} | Salary: {c.basic_salary or 'N/A'} | Probation: {c.probation_period or 'N/A'} | Summary: {c.executive_summary[:200]}"

        prompt = f"Compare these two Saudi employment contracts. Provide: 1) Overall winner for employee 2) Key differences 3) Red flags in each 4) Recommendation.\n\nCONTRACT A: {summary(c1)}\n\nCONTRACT B: {summary(c2)}"

        try:
            import requests as req
            resp = req.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": os.getenv("OPENAI_MODEL","gpt-4o-mini"), "max_tokens":1000, "temperature":0.3,
                      "messages":[{"role":"system","content":"You are a Saudi Labor Law expert."},{"role":"user","content":prompt}]},
                timeout=45)
            if resp.status_code != 200:
                return Response({'error': f'AI error {resp.status_code}'}, status=500)
            return Response({'comparison': resp.json()["choices"][0]["message"]["content"]})
        except Exception as e:
            return Response({'error': 'Comparison failed'}, status=500)


# ── Admin endpoints ──────────────────────────────────────────────────────────
class AdminUserPlanView(APIView):
    """Admin: change a user's plan."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        from .models import Plan, UserProfile
        from django.contrib.auth.models import User as DjangoUser
        # Only admins
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.is_admin) and not request.user.is_staff:
            return Response({'error': 'Admin required'}, status=403)

        target = get_object_or_404(DjangoUser, id=user_id)
        plan_name = request.data.get('plan', '').strip()
        plan = get_object_or_404(Plan, name=plan_name)

        user_profile, _ = UserProfile.objects.get_or_create(user=target)
        user_profile.plan = plan
        user_profile.save(update_fields=['plan'])
        return Response({'message': f'Plan updated to {plan.display_name}'})
