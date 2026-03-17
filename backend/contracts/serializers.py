from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Contract, ClauseAnalysis, MissingClause, SuggestedQuestion, UserProfile, Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ('name', 'display_name', 'monthly_limit', 'price_sar', 'features')


class UserProfileSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    remaining_analyses = serializers.SerializerMethodField()
    can_analyze = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('plan', 'company', 'phone', 'avatar_color', 'is_admin',
                  'contracts_this_month', 'total_contracts', 'remaining_analyses',
                  'can_analyze', 'created_at')

    def get_remaining_analyses(self, obj):
        return obj.remaining_analyses()

    def get_can_analyze(self, obj):
        return obj.can_analyze()


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email    = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        # Create profile and assign free plan
        free_plan = Plan.objects.filter(name='free').first()
        UserProfile.objects.create(user=user, plan=free_plan)
        return user


class ClauseAnalysisSerializer(serializers.ModelSerializer):
    category_display   = serializers.CharField(source='get_category_display',   read_only=True)
    assessment_display = serializers.CharField(source='get_assessment_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)

    class Meta:
        model = ClauseAnalysis
        fields = ('id','category','category_display','clause_title','clause_text',
                  'assessment','assessment_display','risk_level','risk_level_display',
                  'explanation','regulatory_reference','recommendation','order')


class MissingClauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissingClause
        fields = ('id','clause_name','importance','description','regulatory_reference')


class SuggestedQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuggestedQuestion
        fields = ('id','question','related_clause','priority')


class ContractListSerializer(serializers.ModelSerializer):
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)

    class Meta:
        model = Contract
        fields = ('id','file_name','file_type','contract_type','contract_type_display',
                  'language','status','overall_risk','compliance_score',
                  'compliant_count','attention_count','non_compliant_count',
                  'employer_name','employee_name','job_title','basic_salary',
                  'is_shared','created_at','analyzed_at')


class ContractDetailSerializer(serializers.ModelSerializer):
    clauses             = ClauseAnalysisSerializer(many=True, read_only=True)
    missing_clauses     = MissingClauseSerializer(many=True, read_only=True)
    suggested_questions = SuggestedQuestionSerializer(many=True, read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    overall_risk_display  = serializers.CharField(source='get_overall_risk_display',  read_only=True)
    owner_name          = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = ('id','file_name','file_type','contract_type','contract_type_display',
                  'language','status','overall_risk','overall_risk_display','compliance_score',
                  'compliant_count','attention_count','non_compliant_count','missing_clauses_count',
                  'employer_name','employee_name','job_title','basic_salary','gross_salary',
                  'contract_duration','probation_period','work_location','start_date',
                  'executive_summary','is_shared','share_token',
                  'clauses','missing_clauses','suggested_questions',
                  'owner_name','created_at','analyzed_at')

    def get_owner_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Anonymous'


class ContractUploadSerializer(serializers.Serializer):
    file          = serializers.FileField()
    contract_type = serializers.ChoiceField(choices=Contract.CONTRACT_TYPE_CHOICES, default='employment_contract')

    def validate_file(self, value):
        allowed = ['.pdf','.docx','.doc','.png','.jpg','.jpeg','.txt']
        if not any(value.name.lower().endswith(e) for e in allowed):
            raise serializers.ValidationError(f"Unsupported type. Use: {', '.join(allowed)}")
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError("Max file size is 20MB.")
        return value
