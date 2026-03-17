from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


# ── Plan / Subscription ────────────────────────────────────────────
class Plan(models.Model):
    PLAN_CHOICES = [
        ('free',       'Free'),
        ('pro',        'Pro'),
        ('enterprise', 'Enterprise'),
    ]
    name         = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    display_name = models.CharField(max_length=50)
    monthly_limit = models.IntegerField(default=3)       # contracts/month; -1 = unlimited
    price_sar    = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    features     = models.JSONField(default=list)
    is_active    = models.BooleanField(default=True)

    def __str__(self):
        return self.display_name


class UserProfile(models.Model):
    user          = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    plan          = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    company       = models.CharField(max_length=255, blank=True)
    phone         = models.CharField(max_length=30, blank=True)
    avatar_color  = models.CharField(max_length=7, default='#3B82F6')
    is_admin      = models.BooleanField(default=False)
    contracts_this_month = models.IntegerField(default=0)
    month_reset_date     = models.DateField(default=timezone.now)
    total_contracts      = models.IntegerField(default=0)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.plan})"

    def reset_monthly_if_needed(self):
        today = timezone.now().date()
        if today.month != self.month_reset_date.month or today.year != self.month_reset_date.year:
            self.contracts_this_month = 0
            self.month_reset_date = today
            self.save(update_fields=['contracts_this_month', 'month_reset_date'])

    def can_analyze(self):
        self.reset_monthly_if_needed()
        if not self.plan:
            return self.contracts_this_month < 3   # default free limit
        if self.plan.monthly_limit == -1:
            return True
        return self.contracts_this_month < self.plan.monthly_limit

    def remaining_analyses(self):
        self.reset_monthly_if_needed()
        if not self.plan or self.plan.monthly_limit == -1:
            return 999
        limit = self.plan.monthly_limit
        return max(0, limit - self.contracts_this_month)


# ── Contract ───────────────────────────────────────────────────────
class Contract(models.Model):
    CONTRACT_TYPE_CHOICES = [
        ('employment_contract', 'Employment Contract'),
        ('offer_letter',        'Offer Letter'),
        ('addendum',            'Contract Addendum'),
        ('other',               'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('processing', 'Processing'),
        ('completed', 'Completed'), ('failed', 'Failed'),
    ]
    OVERALL_RISK_CHOICES = [
        ('valid', 'Valid'), ('attention', 'Requires Attention'), ('high_risk', 'High Risk'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contracts', null=True, blank=True)
    file             = models.FileField(upload_to='contracts/%Y/%m/', null=True, blank=True)
    file_name        = models.CharField(max_length=255, blank=True)
    file_type        = models.CharField(max_length=50, blank=True)
    contract_type    = models.CharField(max_length=50, choices=CONTRACT_TYPE_CHOICES, default='employment_contract')
    language         = models.CharField(max_length=10, default='ar')
    raw_text         = models.TextField(blank=True)
    employer_name    = models.CharField(max_length=255, blank=True)
    employee_name    = models.CharField(max_length=255, blank=True)
    job_title        = models.CharField(max_length=255, blank=True)
    basic_salary     = models.CharField(max_length=100, blank=True)
    gross_salary     = models.CharField(max_length=100, blank=True)
    contract_duration= models.CharField(max_length=100, blank=True)
    probation_period = models.CharField(max_length=100, blank=True)
    work_location    = models.CharField(max_length=255, blank=True)
    start_date       = models.CharField(max_length=100, blank=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    overall_risk     = models.CharField(max_length=20, choices=OVERALL_RISK_CHOICES, blank=True)
    compliance_score = models.IntegerField(null=True, blank=True)
    compliant_count  = models.IntegerField(default=0)
    attention_count  = models.IntegerField(default=0)
    non_compliant_count = models.IntegerField(default=0)
    missing_clauses_count = models.IntegerField(default=0)
    executive_summary = models.TextField(blank=True)
    is_shared        = models.BooleanField(default=False)   # public share link
    share_token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)
    analyzed_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} ({self.user})"


class ClauseAnalysis(models.Model):
    CATEGORY_CHOICES = [
        ('parties','Contract Parties'),('job_title','Job Title'),('workplace','Workplace'),
        ('salary','Salary & Allowances'),('duration','Contract Duration'),('probation','Probation Period'),
        ('working_hours','Working Hours'),('vacation','Vacation & Leave'),('overtime','Overtime'),
        ('termination','Contract Termination'),('compensation','End of Service'),('confidentiality','Confidentiality'),
        ('non_compete','Non-Competition'),('deductions','Deductions & Penalties'),('transfer','Employee Transfer'),
        ('medical_insurance','Medical Insurance'),('renewal','Contract Renewal'),('start_date','Start Date'),('other','Other'),
    ]
    ASSESSMENT_CHOICES = [
        ('compliant','Compliant'),('needs_clarification','Needs Clarification'),
        ('may_non_compliant','May Be Non-Compliant'),('missing','Missing Clause'),
        ('ambiguous','Ambiguous'),('unusual','Unusual Clause'),
    ]
    RISK_CHOICES = [
        ('low','Low Risk'),('medium','Medium Risk'),('high','High Risk'),('critical','Critical'),
    ]

    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract             = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='clauses')
    category             = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    clause_title         = models.CharField(max_length=255)
    clause_text          = models.TextField(blank=True)
    assessment           = models.CharField(max_length=30, choices=ASSESSMENT_CHOICES)
    risk_level           = models.CharField(max_length=20, choices=RISK_CHOICES, default='low')
    explanation          = models.TextField(blank=True)
    regulatory_reference = models.TextField(blank=True)
    recommendation       = models.TextField(blank=True)
    order                = models.IntegerField(default=0)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'category']


class MissingClause(models.Model):
    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract             = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='missing_clauses')
    clause_name          = models.CharField(max_length=255)
    importance           = models.CharField(max_length=20, choices=[
        ('required','Required by Law'),('recommended','Recommended'),('optional','Optional'),
    ])
    description          = models.TextField(blank=True)
    regulatory_reference = models.TextField(blank=True)


class SuggestedQuestion(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract      = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='suggested_questions')
    question      = models.TextField()
    related_clause= models.CharField(max_length=255, blank=True)
    priority      = models.CharField(max_length=10, choices=[
        ('high','High'),('medium','Medium'),('low','Low'),
    ], default='medium')
