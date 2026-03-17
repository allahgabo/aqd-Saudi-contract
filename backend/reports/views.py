from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from contracts.models import Contract
from .pdf_generator import generate_contract_pdf
import logging

logger = logging.getLogger(__name__)


class DownloadReportView(APIView):
    """
    Download PDF report. Accepts JWT via Authorization header OR ?token= query param
    (query param needed for window.open new-tab downloads).
    Only the contract owner, admins, or public shared contracts are accessible.
    """
    permission_classes = [AllowAny]

    def get_user_from_request(self, request):
        """Try header auth first, then query param token."""
        # Standard header auth
        auth = JWTAuthentication()
        try:
            result = auth.authenticate(request)
            if result:
                return result[0]
        except (InvalidToken, TokenError):
            pass

        # Query param token (for new-tab downloads)
        token_param = request.GET.get('token')
        if token_param:
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                validated = AccessToken(token_param)
                user_id = validated.get('user_id')
                if user_id:
                    return User.objects.get(id=user_id)
            except Exception:
                pass
        return None

    def get(self, request, id):
        contract = Contract.objects.filter(id=id, status='completed').first()
        if not contract:
            return Response({'error': 'Contract not found'}, status=status.HTTP_404_NOT_FOUND)

        user = self.get_user_from_request(request)
        profile = getattr(user, 'profile', None) if user else None
        is_admin = (profile.is_admin if profile else False) or (user.is_staff if user else False)

        # Allow if: owner, admin, or shared publicly
        if not contract.is_shared and (not user or (contract.user != user and not is_admin)):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            pdf_bytes = generate_contract_pdf(contract)
        except Exception as e:
            logger.error(f"PDF generation error for {id}: {e}")
            return Response({'error': 'PDF generation failed'}, status=500)

        filename = f"aqd_analysis_{contract.file_name.rsplit('.', 1)[0]}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
