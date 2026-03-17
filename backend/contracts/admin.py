from django.contrib import admin
from django.utils.html import format_html
from .models import Contract, ClauseAnalysis, MissingClause, SuggestedQuestion, Plan, UserProfile


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display  = ('name', 'display_name', 'monthly_limit', 'price_sar', 'is_active')
    list_editable = ('monthly_limit', 'price_sar', 'is_active')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'plan', 'total_contracts', 'contracts_this_month', 'is_admin', 'created_at')
    list_filter   = ('plan', 'is_admin')
    search_fields = ('user__username', 'user__email', 'company')
    list_editable = ('plan', 'is_admin')
    raw_id_fields = ('user',)


class ClauseInline(admin.TabularInline):
    model  = ClauseAnalysis
    extra  = 0
    fields = ('category','clause_title','assessment','risk_level','order')
    show_change_link = True


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display  = ('file_name','user','status','risk_badge','compliance_score','created_at')
    list_filter   = ('status','overall_risk','contract_type','language')
    search_fields = ('file_name','employer_name','employee_name','user__username')
    readonly_fields = ('id','created_at','updated_at','analyzed_at','raw_text','share_token')
    inlines       = [ClauseInline]

    def risk_badge(self, obj):
        colors = {'valid':'#16a34a','attention':'#d97706','high_risk':'#dc2626'}
        labels = {'valid':'✓ Valid','attention':'⚠ Attention','high_risk':'✗ High Risk'}
        c = colors.get(obj.overall_risk,'#6b7280')
        l = labels.get(obj.overall_risk,'—')
        return format_html('<span style="color:{};font-weight:bold">{}</span>', c, l)
    risk_badge.short_description = 'Risk'


admin.site.register(MissingClause)
admin.site.register(SuggestedQuestion)
admin.site.site_header = 'AQD · عقد — SaaS Admin'
admin.site.site_title  = 'AQD Admin'
