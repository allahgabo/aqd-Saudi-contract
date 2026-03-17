"""
Tests for AQD contract analyzer backend.
Run with: python manage.py test contracts --verbosity=2
"""
import json
from io import BytesIO
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from .models import Contract, ClauseAnalysis, MissingClause, SuggestedQuestion, Plan, UserProfile
from .services.extractor import detect_language
from .services.analyzer import apply_rule_engine


def make_user(username='testuser', password='testpass123'):
    user = User.objects.create_user(username=username, email=f'{username}@test.com', password=password)
    free_plan, _ = Plan.objects.get_or_create(
        name='free', defaults={'display_name':'Free','monthly_limit':3,'price_sar':0,'features':[]}
    )
    UserProfile.objects.get_or_create(user=user, defaults={'plan': free_plan})
    return user


@override_settings(USE_SQLITE=True)
class LanguageDetectionTests(TestCase):
    def test_detect_arabic(self):
        self.assertEqual(detect_language("هذا عقد عمل بين صاحب العمل والموظف في المملكة العربية السعودية"), 'ar')

    def test_detect_english(self):
        self.assertEqual(detect_language("This is an employment contract between the employer and the employee."), 'en')

    def test_detect_empty_text(self):
        self.assertEqual(detect_language(''), 'en')

    def test_detect_mixed_mostly_arabic(self):
        self.assertEqual(detect_language("العقد يتضمن salary of SAR 15,000 per month"), 'ar')


@override_settings(USE_SQLITE=True)
class RuleEngineTests(TestCase):
    def test_flags_missing_salary(self):
        result = {'clauses': [], 'missing_clauses': [], 'suggested_questions': [],
                  'executive_summary': {'overall_status': 'attention', 'compliance_score': 60, 'summary_text': ''}}
        out = apply_rule_engine(result, "This contract covers job title and working hours.")
        self.assertTrue(any(c['category'] == 'salary' and c['risk_level'] == 'critical' for c in out['clauses']))

    def test_does_not_flag_salary_if_present(self):
        result = {
            'clauses': [{'category': 'salary', 'clause_title': 'Salary', 'assessment': 'compliant',
                         'risk_level': 'low', 'clause_text': 'SAR 20,000', 'explanation': '',
                         'regulatory_reference': '', 'recommendation': ''}],
            'missing_clauses': [], 'suggested_questions': [],
            'executive_summary': {'overall_status': 'valid', 'compliance_score': 90, 'summary_text': ''}
        }
        out = apply_rule_engine(result, "The employee will receive a salary of SAR 20,000 per month.")
        self.assertEqual(len([c for c in out['clauses'] if c['category'] == 'salary']), 1)

    def test_flags_excessive_probation(self):
        result = {
            'clauses': [
                {'category': 'parties', 'assessment': 'compliant', 'risk_level': 'low',
                 'clause_title': 'Parties', 'clause_text': 'Employer and Employee',
                 'explanation': '', 'regulatory_reference': '', 'recommendation': ''},
                {'category': 'salary', 'assessment': 'compliant', 'risk_level': 'low',
                 'clause_title': 'Salary', 'clause_text': 'SAR 15,000',
                 'explanation': '', 'regulatory_reference': '', 'recommendation': ''},
                {'category': 'probation', 'assessment': 'compliant', 'risk_level': 'low',
                 'clause_title': 'Probation', 'clause_text': '6 months probation period',
                 'explanation': '', 'regulatory_reference': '', 'recommendation': ''},
            ],
            'missing_clauses': [], 'suggested_questions': [],
            'executive_summary': {'overall_status': 'attention', 'compliance_score': 70, 'summary_text': ''}
        }
        out = apply_rule_engine(result, "salary SAR 15000 probation 6 months employer employee")
        prob = next(c for c in out['clauses'] if c['category'] == 'probation')
        self.assertEqual(prob['assessment'], 'may_non_compliant')
        self.assertEqual(prob['risk_level'], 'high')


@override_settings(USE_SQLITE=True)
class ContractAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        # Get JWT token
        res = self.client.post('/api/auth/token/', {'username': 'testuser', 'password': 'testpass123'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {res.data["access"]}')

    def test_stats_returns_zeros_initially(self):
        response = self.client.get('/api/contracts/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['total_contracts'], 0)

    def test_list_contracts_empty(self):
        response = self.client.get('/api/contracts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_upload_rejects_missing_file(self):
        response = self.client.post('/api/contracts/upload/', {'contract_type': 'employment_contract'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_rejects_invalid_file_type(self):
        fake = BytesIO(b"not a valid file"); fake.name = "contract.exe"
        response = self.client.post('/api/contracts/upload/', {'file': fake, 'contract_type': 'employment_contract'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_nonexistent_contract(self):
        import uuid
        response = self.client.get(f'/api/contracts/{uuid.uuid4()}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_returns_401(self):
        unauth = APIClient()
        self.assertEqual(unauth.get('/api/contracts/').status_code, 401)
        self.assertEqual(unauth.get('/api/contracts/stats/').status_code, 401)

    @patch('contracts.views.analyze_contract')
    @patch('contracts.views.extract_text_from_file')
    def test_upload_pdf_triggers_analysis(self, mock_extract, mock_analyze):
        mock_extract.return_value = (
            "Employment contract between Acme Corp and John Doe. Salary SAR 15,000. Probation 90 days.", 'pdf'
        )
        mock_analyze.return_value = {
            'contract_info': {
                'employer_name': 'Acme Corp', 'employee_name': 'John Doe', 'job_title': 'Engineer',
                'basic_salary': 'SAR 15,000', 'gross_salary': '', 'contract_duration': 'Indefinite',
                'probation_period': '90 days', 'work_location': 'Riyadh', 'start_date': '2025-01-01',
                'detected_language': 'en',
            },
            'executive_summary': {'overall_status': 'valid', 'compliance_score': 88, 'summary_text': 'Compliant.', 'key_findings': []},
            'clauses': [{'category': 'salary', 'clause_title': 'Salary', 'clause_text': 'SAR 15,000',
                         'assessment': 'compliant', 'risk_level': 'low', 'explanation': 'Clear.',
                         'regulatory_reference': 'Article 89', 'recommendation': 'OK'}],
            'missing_clauses': [],
            'suggested_questions': [{'question': 'Confirm WPS?', 'related_clause': 'Salary', 'priority': 'low'}]
        }
        fake_pdf = BytesIO(b"%PDF-1.4 test"); fake_pdf.name = "test.pdf"
        response = self.client.post('/api/contracts/upload/', {'file': fake_pdf, 'contract_type': 'employment_contract'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['status'], 'completed')
        self.assertEqual(data['employer_name'], 'Acme Corp')
        self.assertEqual(data['overall_risk'], 'valid')

    @patch('contracts.views.analyze_contract')
    @patch('contracts.views.extract_text_from_file')
    def test_delete_contract(self, mock_extract, mock_analyze):
        mock_extract.return_value = (
            "This is an employment contract between Company A and Person B. "
            "The salary is SAR 10,000 per month payable via WPS. "
            "Probation period is 90 days. Work location is Riyadh, Saudi Arabia. "
            "Annual leave is 21 days per year.", 'pdf'
        )
        mock_analyze.return_value = {
            'contract_info': {'employer_name': 'A', 'employee_name': 'B', 'job_title': '', 'basic_salary': 'SAR 10,000',
                              'gross_salary': '', 'contract_duration': '', 'probation_period': '', 'work_location': '',
                              'start_date': '', 'detected_language': 'en'},
            'executive_summary': {'overall_status': 'valid', 'compliance_score': 85, 'summary_text': 'OK', 'key_findings': []},
            'clauses': [], 'missing_clauses': [], 'suggested_questions': []
        }
        fake = BytesIO(b"%PDF fake"); fake.name = "to_delete.pdf"
        create_resp = self.client.post('/api/contracts/upload/', {'file': fake, 'contract_type': 'employment_contract'}, format='multipart')
        self.assertEqual(create_resp.status_code, 201)
        contract_id = create_resp.json()['id']
        del_resp = self.client.delete(f'/api/contracts/{contract_id}/delete/')
        self.assertEqual(del_resp.status_code, 204)
        self.assertEqual(self.client.get(f'/api/contracts/{contract_id}/').status_code, 404)


@override_settings(USE_SQLITE=True)
class ContractModelTests(TestCase):
    def test_contract_str(self):
        c = Contract(file_name='test.pdf', status='pending')
        self.assertIn('test.pdf', str(c))

    def test_clause_ordering(self):
        user = make_user('modeltest')
        c = Contract.objects.create(file_name='order_test.pdf', status='completed', user=user)
        for order, cat in [(2, 'salary'), (0, 'probation'), (1, 'vacation')]:
            ClauseAnalysis.objects.create(contract=c, category=cat, clause_title=cat.title(),
                                          assessment='compliant', risk_level='low', order=order)
        clauses = list(c.clauses.all())
        self.assertEqual(clauses[0].category, 'probation')
        self.assertEqual(clauses[1].category, 'vacation')
        self.assertEqual(clauses[2].category, 'salary')

    def test_user_profile_can_analyze(self):
        user = make_user('profiletest')
        profile = user.profile
        self.assertTrue(profile.can_analyze())
        profile.contracts_this_month = 3
        profile.save()
        self.assertFalse(profile.can_analyze())
