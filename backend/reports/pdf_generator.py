"""
PDF Report Generator for contract analysis results.
Generates a professional bilingual report using ReportLab.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Color palette
COLOR_DARK = colors.HexColor('#0F172A')
COLOR_PRIMARY = colors.HexColor('#1E40AF')
COLOR_ACCENT = colors.HexColor('#3B82F6')
COLOR_GREEN = colors.HexColor('#16A34A')
COLOR_YELLOW = colors.HexColor('#D97706')
COLOR_RED = colors.HexColor('#DC2626')
COLOR_GRAY = colors.HexColor('#6B7280')
COLOR_LIGHT_GRAY = colors.HexColor('#F3F4F6')
COLOR_BORDER = colors.HexColor('#E5E7EB')
COLOR_WHITE = colors.white

RISK_COLORS = {
    'valid': COLOR_GREEN,
    'attention': COLOR_YELLOW,
    'high_risk': COLOR_RED,
}

ASSESSMENT_COLORS = {
    'compliant': COLOR_GREEN,
    'needs_clarification': COLOR_YELLOW,
    'may_non_compliant': COLOR_RED,
    'missing': COLOR_RED,
    'ambiguous': COLOR_YELLOW,
    'unusual': COLOR_YELLOW,
}

ASSESSMENT_LABELS = {
    'compliant': '✓ Compliant',
    'needs_clarification': '? Needs Clarification',
    'may_non_compliant': '✗ May Be Non-Compliant',
    'missing': '✗ Missing',
    'ambiguous': '~ Ambiguous',
    'unusual': '! Unusual',
}

RISK_LABELS = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical',
}


def build_styles():
    styles = getSampleStyleSheet()
    custom = {}

    custom['title'] = ParagraphStyle(
        'title', fontSize=22, textColor=COLOR_WHITE,
        fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=4
    )
    custom['subtitle'] = ParagraphStyle(
        'subtitle', fontSize=11, textColor=colors.HexColor('#BFDBFE'),
        fontName='Helvetica', alignment=TA_CENTER, spaceAfter=2
    )
    custom['section_header'] = ParagraphStyle(
        'section_header', fontSize=13, textColor=COLOR_PRIMARY,
        fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=8,
        borderPadding=(0, 0, 4, 0)
    )
    custom['body'] = ParagraphStyle(
        'body', fontSize=9, textColor=COLOR_DARK,
        fontName='Helvetica', leading=14, spaceAfter=4
    )
    custom['bold_body'] = ParagraphStyle(
        'bold_body', fontSize=9, textColor=COLOR_DARK,
        fontName='Helvetica-Bold', leading=14
    )
    custom['small'] = ParagraphStyle(
        'small', fontSize=8, textColor=COLOR_GRAY,
        fontName='Helvetica', leading=12
    )
    custom['clause_title'] = ParagraphStyle(
        'clause_title', fontSize=10, textColor=COLOR_DARK,
        fontName='Helvetica-Bold', leading=14
    )
    custom['label'] = ParagraphStyle(
        'label', fontSize=8, textColor=COLOR_GRAY,
        fontName='Helvetica-Bold', leading=12, spaceBefore=2
    )
    custom['disclaimer'] = ParagraphStyle(
        'disclaimer', fontSize=8, textColor=COLOR_GRAY,
        fontName='Helvetica-Oblique', leading=12,
        borderPadding=8, backColor=COLOR_LIGHT_GRAY
    )
    return custom


def generate_contract_pdf(contract) -> bytes:
    """Generate a PDF report for a contract analysis."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
        title=f"Contract Analysis - {contract.file_name}"
    )

    styles = build_styles()
    story = []

    # ── HEADER BANNER ──────────────────────────────────────────────
    header_data = [
        [Paragraph('عقد', ParagraphStyle('ar', fontSize=28, textColor=COLOR_WHITE,
                   fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph('AQD<br/><font size="10" color="#BFDBFE">Saudi Contract Analyzer</font>',
                   ParagraphStyle('hdr', fontSize=20, textColor=COLOR_WHITE,
                                  fontName='Helvetica-Bold', alignment=TA_CENTER)),
         Paragraph(f'<font size="9" color="#BFDBFE">Analysis Date</font><br/>'
                   f'<font size="11" color="white">{datetime.now().strftime("%d %b %Y")}</font>',
                   ParagraphStyle('date', fontSize=9, textColor=COLOR_WHITE,
                                  fontName='Helvetica', alignment=TA_RIGHT))],
    ]
    header_table = Table(header_data, colWidths=[40*mm, 100*mm, 45*mm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_PRIMARY),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [COLOR_PRIMARY]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('ROUNDEDCORNERS', [8]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # ── OVERALL STATUS BADGE ────────────────────────────────────────
    risk = contract.overall_risk or 'attention'
    risk_color = RISK_COLORS.get(risk, COLOR_YELLOW)
    risk_label = {'valid': 'VALID ✓', 'attention': 'REQUIRES ATTENTION ⚠', 'high_risk': 'HIGH RISK ✗'}.get(risk, risk.upper())
    score = contract.compliance_score or 0

    status_data = [[
        Paragraph(f'<font color="white"><b>{risk_label}</b></font>',
                  ParagraphStyle('s', fontSize=14, textColor=COLOR_WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(f'<font size="9" color="#6B7280">Compliance Score</font><br/>'
                  f'<font size="28" color="{risk_color.hexval() if hasattr(risk_color, "hexval") else "#1E40AF"}"><b>{score}%</b></font>',
                  ParagraphStyle('sc', fontSize=28, textColor=COLOR_PRIMARY, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph(
            f'<font size="9" color="#6B7280">✓ Compliant</font> <font size="12" color="#16A34A"><b>{contract.compliant_count}</b></font><br/>'
            f'<font size="9" color="#6B7280">⚠ Attention</font> <font size="12" color="#D97706"><b>{contract.attention_count}</b></font><br/>'
            f'<font size="9" color="#6B7280">✗ Issues</font> <font size="12" color="#DC2626"><b>{contract.non_compliant_count}</b></font>',
            ParagraphStyle('ct', fontSize=9, textColor=COLOR_DARK, fontName='Helvetica', leading=16)
        ),
    ]]
    status_table = Table(status_data, colWidths=[70*mm, 55*mm, 60*mm])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), risk_color),
        ('BACKGROUND', (1, 0), (-1, -1), COLOR_LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('LINEAFTER', (0, 0), (1, 0), 1, COLOR_BORDER),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 14))

    # ── SECTION 1: CONTRACT INFORMATION ────────────────────────────
    story.append(Paragraph('1. Basic Contract Information', styles['section_header']))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))

    info_fields = [
        ('File Name', contract.file_name),
        ('Contract Type', contract.get_contract_type_display()),
        ('Employer', contract.employer_name or '—'),
        ('Employee', contract.employee_name or '—'),
        ('Job Title', contract.job_title or '—'),
        ('Basic Salary', contract.basic_salary or '—'),
        ('Gross Salary', contract.gross_salary or '—'),
        ('Work Location', contract.work_location or '—'),
        ('Start Date', contract.start_date or '—'),
        ('Contract Duration', contract.contract_duration or '—'),
        ('Probation Period', contract.probation_period or '—'),
        ('Language', 'Arabic' if contract.language == 'ar' else 'English'),
    ]

    info_rows = []
    row = []
    for i, (label, value) in enumerate(info_fields):
        cell = [
            Paragraph(label, styles['label']),
            Paragraph(str(value), styles['bold_body'])
        ]
        row.append(Table([[cell[0]], [cell[1]]], colWidths=[80*mm]))
        if len(row) == 2:
            info_rows.append(row)
            row = []
    if row:
        row.append(Table([[Paragraph('', styles['label'])]], colWidths=[80*mm]))
        info_rows.append(row)

    info_table = Table(info_rows, colWidths=[85*mm, 85*mm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_GRAY),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [COLOR_LIGHT_GRAY, COLOR_WHITE]),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # ── SECTION 2: EXECUTIVE SUMMARY ───────────────────────────────
    story.append(Paragraph('2. Executive Summary', styles['section_header']))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))

    if contract.executive_summary:
        summary_table = Table(
            [[Paragraph(contract.executive_summary, styles['body'])]],
            colWidths=[170*mm]
        )
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
            ('BOX', (0, 0), (-1, -1), 1, COLOR_ACCENT),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 14))

    # ── SECTION 3: CLAUSE ANALYSIS ─────────────────────────────────
    story.append(Paragraph('3. Clause-by-Clause Analysis', styles['section_header']))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))

    clauses = contract.clauses.all().order_by('order')
    for clause in clauses:
        assessment_color = ASSESSMENT_COLORS.get(clause.assessment, COLOR_GRAY)
        assessment_label = ASSESSMENT_LABELS.get(clause.assessment, clause.assessment)
        risk_label = RISK_LABELS.get(clause.risk_level, clause.risk_level)

        # Header row
        header_row = [[
            Paragraph(f'<b>{clause.clause_title}</b>', styles['clause_title']),
            Paragraph(
                f'<font color="white"><b> {assessment_label} </b></font>',
                ParagraphStyle('badge', fontSize=8, textColor=COLOR_WHITE,
                               fontName='Helvetica-Bold', alignment=TA_CENTER)
            ),
            Paragraph(f'Risk: <b>{risk_label}</b>', styles['small']),
        ]]
        header_table = Table(header_row, colWidths=[90*mm, 55*mm, 25*mm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), COLOR_LIGHT_GRAY),
            ('BACKGROUND', (1, 0), (1, 0), assessment_color),
            ('BACKGROUND', (2, 0), (2, 0), COLOR_LIGHT_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ]))

        detail_rows = []
        if clause.clause_text:
            detail_rows.append([
                Paragraph('Contract Text:', styles['label']),
                Paragraph(f'<i>"{clause.clause_text[:250]}..."</i>' if len(clause.clause_text) > 250
                          else f'<i>"{clause.clause_text}"</i>', styles['small'])
            ])
        if clause.explanation:
            detail_rows.append([
                Paragraph('Assessment:', styles['label']),
                Paragraph(clause.explanation, styles['body'])
            ])
        if clause.regulatory_reference:
            detail_rows.append([
                Paragraph('Legal Reference:', styles['label']),
                Paragraph(clause.regulatory_reference, styles['small'])
            ])
        if clause.recommendation:
            detail_rows.append([
                Paragraph('Recommendation:', styles['label']),
                Paragraph(f'<b>{clause.recommendation}</b>', styles['body'])
            ])

        if detail_rows:
            detail_table = Table(detail_rows, colWidths=[32*mm, 138*mm])
            detail_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (0, -1), COLOR_LIGHT_GRAY),
                ('BACKGROUND', (1, 0), (1, -1), COLOR_WHITE),
                ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ]))
            story.append(KeepTogether([header_table, detail_table, Spacer(1, 8)]))
        else:
            story.append(KeepTogether([header_table, Spacer(1, 8)]))

    story.append(Spacer(1, 8))

    # ── SECTION 4: MISSING CLAUSES ─────────────────────────────────
    missing_clauses = contract.missing_clauses.all()
    if missing_clauses.exists():
        story.append(Paragraph('4. Missing Clauses', styles['section_header']))
        story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))

        missing_data = [
            [Paragraph('Clause', styles['bold_body']),
             Paragraph('Importance', styles['bold_body']),
             Paragraph('Description', styles['bold_body']),
             Paragraph('Legal Basis', styles['bold_body'])]
        ]
        for m in missing_clauses:
            imp_color = {'required': COLOR_RED, 'recommended': COLOR_YELLOW, 'optional': COLOR_GRAY}.get(m.importance, COLOR_GRAY)
            missing_data.append([
                Paragraph(m.clause_name, styles['body']),
                Paragraph(f'<font color="{imp_color.hexval() if hasattr(imp_color,"hexval") else "black"}"><b>{m.importance.title()}</b></font>',
                          styles['body']),
                Paragraph(m.description or '—', styles['small']),
                Paragraph(m.regulatory_reference or '—', styles['small']),
            ])

        missing_table = Table(missing_data, colWidths=[42*mm, 24*mm, 62*mm, 42*mm])
        missing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT_GRAY]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ]))
        story.append(missing_table)
        story.append(Spacer(1, 14))

    # ── SECTION 5: SUGGESTED QUESTIONS ─────────────────────────────
    questions = contract.suggested_questions.all().order_by('priority')
    if questions.exists():
        story.append(Paragraph('5. Suggested Questions for Your Employer', styles['section_header']))
        story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))

        q_rows = []
        for i, q in enumerate(questions, 1):
            pri_color = {'high': COLOR_RED, 'medium': COLOR_YELLOW, 'low': COLOR_GREEN}.get(q.priority, COLOR_GRAY)
            q_rows.append([
                Paragraph(f'<b>Q{i}.</b>', styles['bold_body']),
                Paragraph(q.question, styles['body']),
                Paragraph(f'<font color="{pri_color.hexval() if hasattr(pri_color,"hexval") else "black"}"><b>{q.priority.title()}</b></font>',
                          styles['small']),
            ])

        q_table = Table(q_rows, colWidths=[10*mm, 142*mm, 18*mm])
        q_table.setStyle(TableStyle([
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [COLOR_WHITE, COLOR_LIGHT_GRAY]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 14))

    # ── DISCLAIMER ─────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))
    story.append(Paragraph(
        '<b>⚠ DISCLAIMER:</b> This report is generated by an AI system for informational purposes only. '
        'It does not constitute a definitive legal opinion or professional legal advice. '
        'Language used such as "may conflict with", "requires review", and "potential risk" indicates areas '
        'that warrant further examination. For high-risk findings or before signing any contract, '
        'consult a qualified Saudi labor law attorney or the Ministry of Human Resources. '
        'This analysis is based on Saudi Labor Law as amended effective February 19, 2025.',
        styles['disclaimer']
    ))

    # ── FOOTER ─────────────────────────────────────────────────────
    story.append(Spacer(1, 8))
    footer_text = (f'Generated by AQD - Saudi Contract Analyzer | '
                   f'{datetime.now().strftime("%d %B %Y %H:%M")} | '
                   f'Contract: {contract.file_name}')
    story.append(Paragraph(footer_text, ParagraphStyle(
        'footer', fontSize=7, textColor=COLOR_GRAY,
        fontName='Helvetica', alignment=TA_CENTER
    )))

    doc.build(story)
    return buffer.getvalue()
