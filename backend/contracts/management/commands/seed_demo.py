"""
Management command to seed the database with demo contracts.
Usage: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from contracts.models import Contract, ClauseAnalysis, MissingClause, SuggestedQuestion


DEMO_CONTRACTS = [
    {
        "contract": {
            "file_name": "software_engineer_offer.pdf",
            "file_type": "pdf",
            "contract_type": "offer_letter",
            "language": "en",
            "status": "completed",
            "overall_risk": "attention",
            "compliance_score": 74,
            "employer_name": "TechCorp Saudi Arabia",
            "employee_name": "Khalid Al-Mansouri",
            "job_title": "Senior Software Engineer",
            "basic_salary": "SAR 22,000/month",
            "gross_salary": "SAR 28,000/month",
            "work_location": "Riyadh, Saudi Arabia",
            "start_date": "March 1, 2025",
            "contract_duration": "Indefinite",
            "probation_period": "90 days",
            "compliant_count": 6,
            "attention_count": 3,
            "non_compliant_count": 1,
            "missing_clauses_count": 2,
            "executive_summary": (
                "This offer letter is generally acceptable but contains several areas that require "
                "clarification before signing. The non-compete clause is overly broad and the "
                "overtime compensation terms are not explicitly stated."
            ),
        },
        "clauses": [
            {
                "category": "salary", "clause_title": "Basic Salary & Allowances", "order": 0,
                "clause_text": "Employee shall receive a basic monthly salary of SAR 22,000, plus housing allowance of SAR 4,000 and transportation allowance of SAR 2,000.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "Salary is clearly specified in Saudi Riyals with breakdown of basic salary and allowances. Compliant with WPS requirements.",
                "regulatory_reference": "Saudi Labor Law Articles 89-97 — Wages must be paid in SAR via Wage Protection System.",
                "recommendation": "This clause appears fully compliant. Ensure payment is processed through the official WPS system.",
            },
            {
                "category": "probation", "clause_title": "Probationary Period", "order": 1,
                "clause_text": "The employee shall serve a probationary period of 90 days from the commencement date.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "90 days is exactly at the legal maximum for probation. Compliant with Saudi Labor Law.",
                "regulatory_reference": "Saudi Labor Law Article 53 — Probation may not exceed 90 days (extendable to 180 by written agreement).",
                "recommendation": "Compliant. Note that either party may terminate without notice or compensation during probation.",
            },
            {
                "category": "non_compete", "clause_title": "Non-Competition Agreement", "order": 2,
                "clause_text": "Employee agrees not to engage in any competitive business activities or join any competitor company worldwide for a period of 3 years following termination of employment.",
                "assessment": "may_non_compliant", "risk_level": "high",
                "explanation": "The non-compete clause has two serious problems: (1) 'worldwide' geographic scope is almost certainly unenforceable and disproportionate; (2) 3 years is at the outer edge of what courts would typically uphold.",
                "regulatory_reference": "Saudi Labor Law Article 83 — Non-compete must be limited in time, geographic area, and type of work. Must not prevent employee from earning a livelihood.",
                "recommendation": "Request modification: limit scope to Saudi Arabia (or specific cities), reduce duration to 1-2 years maximum, and specify the types of work/competitors covered.",
            },
            {
                "category": "overtime", "clause_title": "Working Hours & Overtime", "order": 3,
                "clause_text": "Standard working hours are 8 hours per day, 5 days per week. Overtime may be required as per business needs.",
                "assessment": "needs_clarification", "risk_level": "medium",
                "explanation": "While standard hours comply with the 48h/week limit, the overtime clause is vague. It does not specify the overtime premium rate (legally required to be minimum 50% above regular wage).",
                "regulatory_reference": "Saudi Labor Law Article 107 — Overtime must be compensated at no less than 150% of the regular hourly wage.",
                "recommendation": "Request explicit inclusion of: overtime premium rate (min 50% above regular wage), maximum overtime hours permitted, and Ramadan working hours (6h/day for Muslims).",
            },
            {
                "category": "vacation", "clause_title": "Annual Leave", "order": 4,
                "clause_text": "Employee is entitled to 21 days of paid annual leave per year.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "21 days annual leave meets the minimum statutory entitlement for employees with less than 5 years of service.",
                "regulatory_reference": "Saudi Labor Law Article 109 — Minimum 21 days/year (<5 years), 30 days/year (5+ years).",
                "recommendation": "Compliant for new employees. Confirm the contract specifies leave increases to 30 days after 5 years of service.",
            },
            {
                "category": "termination", "clause_title": "Notice Period & Termination", "order": 5,
                "clause_text": "Either party may terminate this agreement by providing 60 days written notice.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "60 days' notice for monthly-paid employees meets the legal minimum requirement.",
                "regulatory_reference": "Saudi Labor Law Article 75 — Minimum 60 days notice for monthly-paid employees.",
                "recommendation": "Compliant. Ensure the contract also covers end-of-service gratuity entitlements on termination.",
            },
            {
                "category": "compensation", "clause_title": "End of Service Gratuity", "order": 6,
                "clause_text": "Employee will receive end of service benefits as per applicable Saudi Labor Law.",
                "assessment": "needs_clarification", "risk_level": "medium",
                "explanation": "While referencing Saudi Labor Law is acceptable, the clause should explicitly state the gratuity calculation formula for clarity and to avoid disputes.",
                "regulatory_reference": "Saudi Labor Law Article 84 — 1/3 monthly wage per year (0-5 yrs), 2/3 per year (5-10 yrs), 1 month per year (10+ yrs) for resignation.",
                "recommendation": "Request a clause explicitly stating the gratuity formula, or at minimum confirming the calculation basis (last basic wage × years of service).",
            },
            {
                "category": "confidentiality", "clause_title": "Confidentiality", "order": 7,
                "clause_text": "Employee shall maintain strict confidentiality of all company information during and after employment.",
                "assessment": "needs_clarification", "risk_level": "medium",
                "explanation": "The confidentiality clause lacks a time limit for the post-employment period. Unlimited confidentiality obligations may be challenged. The types of protected information should also be specified.",
                "regulatory_reference": "Generally enforceable under Saudi contract law; should be proportionate and time-limited.",
                "recommendation": "Request specification of: (1) what constitutes 'company information', (2) a reasonable post-employment duration (2-5 years is typical), and (3) exclusions for publicly available information.",
            },
            {
                "category": "medical_insurance", "clause_title": "Medical Insurance", "order": 8,
                "clause_text": "The company will provide medical insurance coverage as per company policy.",
                "assessment": "needs_clarification", "risk_level": "medium",
                "explanation": "Medical insurance is legally required but the clause is vague. 'As per company policy' does not confirm minimum statutory coverage.",
                "regulatory_reference": "Council of Health Insurance Resolution — Employers must provide health insurance meeting minimum coverage standards.",
                "recommendation": "Request confirmation of the insurance provider, plan tier, coverage scope (inpatient/outpatient/dental/vision), and whether dependents are covered.",
            },
        ],
        "missing": [
            {
                "clause_name": "Deductions & Disciplinary Penalties",
                "importance": "required",
                "description": "The contract does not specify permissible salary deductions or disciplinary penalty limits.",
                "regulatory_reference": "Saudi Labor Law Article 95 — Disciplinary deductions capped at 5 days' wage per month.",
            },
            {
                "clause_name": "Transfer of Employment Location",
                "importance": "recommended",
                "description": "The contract does not address conditions under which the employer may transfer the employee to a different city or location.",
                "regulatory_reference": "Saudi Labor Law Article 58 — Transfer to different city requires employee consent unless contract provides otherwise.",
            },
        ],
        "questions": [
            {
                "question": "Can you modify the non-compete clause to limit the geographic scope to Saudi Arabia (or specific regions) and reduce the duration from 3 years to a maximum of 1-2 years?",
                "related_clause": "Non-Competition Agreement",
                "priority": "high",
            },
            {
                "question": "What is the exact overtime rate? The contract states overtime 'may be required' but does not specify the premium. Saudi Law requires a minimum 50% premium above regular wages.",
                "related_clause": "Working Hours & Overtime",
                "priority": "high",
            },
            {
                "question": "Can you confirm the medical insurance plan details — provider name, coverage tier (basic/enhanced), and whether dependents can be added?",
                "related_clause": "Medical Insurance",
                "priority": "medium",
            },
            {
                "question": "Does the annual leave increase to 30 days per year after 5 years of service, as required by Saudi Labor Law Article 109?",
                "related_clause": "Annual Leave",
                "priority": "medium",
            },
            {
                "question": "What salary deductions are permitted under the company's disciplinary policy? Are there written disciplinary procedures?",
                "related_clause": "Deductions & Penalties",
                "priority": "medium",
            },
        ],
    },
    {
        "contract": {
            "file_name": "marketing_manager_contract_ar.pdf",
            "file_type": "pdf",
            "contract_type": "employment_contract",
            "language": "ar",
            "status": "completed",
            "overall_risk": "high_risk",
            "compliance_score": 48,
            "employer_name": "شركة الإعلام المتقدم",
            "employee_name": "نورة العتيبي",
            "job_title": "مديرة التسويق",
            "basic_salary": "SAR 15,000/month",
            "work_location": "جدة، المملكة العربية السعودية",
            "start_date": "1 فبراير 2025",
            "contract_duration": "عقد لمدة سنة واحدة",
            "probation_period": "6 أشهر",
            "compliant_count": 2,
            "attention_count": 2,
            "non_compliant_count": 5,
            "missing_clauses_count": 3,
            "executive_summary": (
                "يحتوي هذا العقد على مخاطر عالية وعدة بنود تتعارض مع نظام العمل السعودي. "
                "فترة الاختبار تتجاوز الحد القانوني الأقصى، وبنود الاستقطاعات غير محددة، "
                "وغياب بند التأمين الصحي. يُنصح بشدة بمراجعة قانونية قبل التوقيع."
            ),
        },
        "clauses": [
            {
                "category": "probation", "clause_title": "فترة الاختبار", "order": 0,
                "clause_text": "تحدد فترة الاختبار بستة أشهر من تاريخ المباشرة بالعمل.",
                "assessment": "may_non_compliant", "risk_level": "critical",
                "explanation": "فترة الاختبار المحددة بستة أشهر تتجاوز الحد القانوني الأقصى البالغ ثلاثة أشهر (90 يومًا) وفقًا لنظام العمل السعودي. ولتمديدها إلى ستة أشهر يُشترط الحصول على اتفاق خطي مسبق بين الطرفين.",
                "regulatory_reference": "المادة 53 من نظام العمل السعودي — لا تتجاوز مدة الاختبار ثلاثة أشهر، وتمتد إلى ستة أشهر بموافقة مكتوبة.",
                "recommendation": "اطلبي تعديل هذا البند: إما تحديد فترة الاختبار بثلاثة أشهر، أو الحصول على اتفاق مكتوب مستقل لتمديدها إلى ستة أشهر مع بيان الأسباب.",
            },
            {
                "category": "deductions", "clause_title": "استقطاعات الرواتب والجزاءات", "order": 1,
                "clause_text": "يحق لصاحب العمل خصم مبالغ من الراتب في حالات الغياب والمخالفات وأي أسباب أخرى تراها الإدارة مناسبة.",
                "assessment": "may_non_compliant", "risk_level": "critical",
                "explanation": "عبارة 'أي أسباب أخرى تراها الإدارة مناسبة' تمنح صاحب العمل صلاحية استقطاع غير محدودة وغير واضحة، مما يتعارض مع حماية الأجر في نظام العمل. يجب تحديد الحالات المسموح بها والحد الأقصى للاستقطاع.",
                "regulatory_reference": "المادة 95 من نظام العمل — لا تتجاوز الجزاءات التأديبية ما يعادل أجر خمسة أيام في الشهر الواحد.",
                "recommendation": "رفض هذا البند بصيغته الحالية. اطلبي تحديد الحالات الجائزة للاستقطاع والحد الأقصى (5 أيام شهريًا) والإجراءات التأديبية المتبعة.",
            },
            {
                "category": "termination", "clause_title": "إنهاء العقد", "order": 2,
                "clause_text": "يحق لصاحب العمل إنهاء العقد في أي وقت دون إشعار مسبق إذا رأى ذلك مناسبًا.",
                "assessment": "may_non_compliant", "risk_level": "critical",
                "explanation": "هذا البند يمنح صاحب العمل حق الفسخ التعسفي دون التزام بمدة الإشعار القانونية أو الحالات المبررة للفصل. يتعارض مع حماية العمالة في النظام.",
                "regulatory_reference": "المادة 75 نظام العمل — إشعار 60 يومًا للعمال بأجر شهري. المواد 74-80 تحدد الأسباب المشروعة للإنهاء وضمانات التعويض.",
                "recommendation": "يجب تعديل هذا البند ليتضمن: مدة الإشعار القانونية (60 يومًا)، وتحديد الأسباب المشروعة للإنهاء، وحقوق التعويض عند الفصل التعسفي.",
            },
            {
                "category": "salary", "clause_title": "الراتب والمكافآت", "order": 3,
                "clause_text": "يتقاضى الموظف راتبًا أساسيًا قدره 15,000 ريال سعودي شهريًا.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "الراتب الأساسي محدد بوضوح بالريال السعودي. يتوافق مع متطلبات نظام حماية الأجور.",
                "regulatory_reference": "المواد 89-97 من نظام العمل السعودي.",
                "recommendation": "هذا البند مقبول. تأكدي من تضمين بدلات إضافية (السكن، المواصلات) إن وجدت في العقد.",
            },
            {
                "category": "working_hours", "clause_title": "ساعات العمل", "order": 4,
                "clause_text": "تكون ساعات العمل حسب متطلبات العمل وطبيعة المهام المكلف بها الموظف.",
                "assessment": "may_non_compliant", "risk_level": "high",
                "explanation": "عبارة 'حسب متطلبات العمل' مبهمة ولا تحدد عدد ساعات العمل اليومية أو الأسبوعية. يفتح هذا الباب أمام ساعات عمل مفرطة دون تعويض.",
                "regulatory_reference": "المواد 98-101 — الحد الأقصى 8 ساعات يوميًا / 48 ساعة أسبوعيًا. 6 ساعات يوميًا في رمضان للمسلمين.",
                "recommendation": "اطلبي تحديد ساعات العمل بـ 8 ساعات يوميًا وخمسة أيام أسبوعيًا، مع النص الصريح على أحكام العمل الإضافي وساعات رمضان.",
            },
            {
                "category": "non_compete", "clause_title": "عدم المنافسة", "order": 5,
                "clause_text": "يلتزم الموظف بعدم العمل في أي شركة منافسة في المملكة العربية السعودية لمدة سنتين بعد انتهاء العقد.",
                "assessment": "needs_clarification", "risk_level": "medium",
                "explanation": "المدة (سنتان) والنطاق الجغرافي (المملكة كاملة) معقولان نسبيًا، لكن يجب تحديد نوع الأعمال المقيدة بشكل أوضح.",
                "regulatory_reference": "المادة 83 من نظام العمل — يجب أن يكون محدودًا في المدة والمكان ونوع العمل.",
                "recommendation": "اطلبي توضيح 'الشركات المنافسة' بذكر مجال العمل المحدد أو قائمة المنافسين المقصودين لتجنب الغموض.",
            },
            {
                "category": "vacation", "clause_title": "الإجازة السنوية", "order": 6,
                "clause_text": "تستحق الموظفة إجازة سنوية مدتها 21 يومًا.",
                "assessment": "compliant", "risk_level": "low",
                "explanation": "21 يومًا تطابق الحد الأدنى القانوني للموظفين الجدد.",
                "regulatory_reference": "المادة 109 من نظام العمل — 21 يومًا لأقل من 5 سنوات، 30 يومًا لـ 5 سنوات فأكثر.",
                "recommendation": "يتوافق مع النظام للموظفين الجدد. تأكدي من وجود نص يشير إلى ارتفاع الإجازة إلى 30 يومًا بعد 5 سنوات.",
            },
        ],
        "missing": [
            {
                "clause_name": "التأمين الصحي",
                "importance": "required",
                "description": "العقد لا يتضمن أي ذكر للتأمين الصحي رغم أنه إلزامي قانونًا.",
                "regulatory_reference": "قرارات مجلس الضمان الصحي — يلزم أصحاب العمل بتوفير التأمين الصحي.",
            },
            {
                "clause_name": "العمل الإضافي والتعويض عنه",
                "importance": "required",
                "description": "لا يوجد نص صريح على مكافأة العمل الإضافي رغم أن ساعات العمل غير محددة.",
                "regulatory_reference": "المادة 107 من نظام العمل — يُكافأ العمل الإضافي بـ 150% من الأجر الساعي.",
            },
            {
                "clause_name": "مكافأة نهاية الخدمة",
                "importance": "required",
                "description": "العقد لا يذكر مكافأة نهاية الخدمة ولا آلية حسابها.",
                "regulatory_reference": "المادة 84 من نظام العمل — مكافأة إلزامية بناءً على الأجر الأساسي وسنوات الخدمة.",
            },
        ],
        "questions": [
            {
                "question": "هل يمكن تخفيض فترة الاختبار من ستة أشهر إلى ثلاثة أشهر؟ أو توقيع اتفاق منفصل لتمديدها مع تحديد السبب؟",
                "related_clause": "فترة الاختبار",
                "priority": "high",
            },
            {
                "question": "ما هي الحالات المحددة التي يُطبَّق فيها استقطاع الراتب؟ وما هو الحد الأقصى للاستقطاع شهريًا؟",
                "related_clause": "استقطاعات الرواتب والجزاءات",
                "priority": "high",
            },
            {
                "question": "كيف يمكن إنهاء العقد من قِبَل صاحب العمل؟ هل تُطبَّق مدة إشعار 60 يومًا؟ وما التعويض المستحق عند الإنهاء التعسفي؟",
                "related_clause": "إنهاء العقد",
                "priority": "high",
            },
            {
                "question": "ما هو التأمين الصحي المقدم؟ ما اسم شركة التأمين ومستوى التغطية؟",
                "related_clause": "التأمين الصحي",
                "priority": "high",
            },
            {
                "question": "ما هو نظام العمل الإضافي في الشركة؟ وهل يُدفع بنسبة 150% من الأجر الساعي؟",
                "related_clause": "ساعات العمل",
                "priority": "medium",
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with realistic demo contracts for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Clear existing demo contracts before seeding'
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = Contract.objects.filter(user=None).delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing contracts.'))

        created = 0
        for demo in DEMO_CONTRACTS:
            c_data = demo['contract']
            c = Contract.objects.create(
                analyzed_at=timezone.now(),
                **c_data
            )

            for i, cl in enumerate(demo['clauses']):
                ClauseAnalysis.objects.create(contract=c, **cl)

            for m in demo['missing']:
                MissingClause.objects.create(contract=c, **m)

            for q in demo['questions']:
                SuggestedQuestion.objects.create(contract=c, **q)

            created += 1
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Created: {c.file_name} (score: {c.compliance_score}%)')
            )

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully seeded {created} demo contracts.\n'
            f'Visit http://localhost:8000/api/contracts/ to see them.'
        ))
