from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from contracts.models import Contract
from .pdf_generator import generate_contract_pdf


class DownloadReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        contract = get_object_or_404(Contract, id=id, status='completed')
        pdf_bytes = generate_contract_pdf(contract)
        filename = f"aqd_analysis_{contract.file_name.rsplit('.', 1)[0]}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
