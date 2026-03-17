"""
AI-powered contract analyzer — calls OpenAI API directly via requests.
No SDK dependency, no version conflicts.
"""
import json
import logging
import os
import re
from typing import Optional

logger = logging.getLogger(__name__)

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Model selection: gpt-4o-mini is fast and cheap; override with OPENAI_MODEL env var
DEFAULT_MODEL = "gpt-4o-mini"

SAUDI_LABOR_LAW_KNOWLEDGE = """
SAUDI LABOR LAW KEY PROVISIONS (Updated February 19, 2025):

1. EMPLOYMENT CONTRACT (Article 51): Written in Arabic, two copies.
   Must include: employer name/address, employee name/nationality/ID,
   agreed wage with allowances, work type and location, start date,
   contract duration if fixed-term.

2. PROBATION (Article 53): Maximum 90 days.
   Extension to 180 days only by separate written mutual agreement.
   Either party may terminate without notice during probation.

3. WORKING HOURS (Articles 98-101): Max 8h/day, 48h/week.
   Ramadan: 6h/day for Muslims. Overtime minimum: 50% premium (Article 107).

4. ANNUAL LEAVE (Article 109): Min 21 days/year (<5 years service).
   Min 30 days/year (5+ years). Employee cannot waive this right.

5. WAGES (Articles 89-97): Paid in Saudi Riyals via WPS system.
   Monthly employees paid at least monthly.
   Deductions capped at 50% of monthly wage (except court orders).

6. TERMINATION (Articles 74-80): Minimum 60-day notice for monthly employees.
   Dismissed employee entitled to notice pay + end-of-service gratuity.

7. END OF SERVICE GRATUITY (Article 84):
   Resigned <5yr: 1/3 month/year. Resigned 5-10yr: 2/3 month/year.
   Resigned >10yr or terminated: 1 full month/year. Based on last basic wage.

8. NON-COMPETE (Article 83): Must be limited in time (max ~2yr),
   geographic area, and type of work.

9. DISCIPLINARY DEDUCTIONS (Article 95): Max 5 days wage/month.

10. MEDICAL INSURANCE: Mandatory per Council of Health Insurance.

11. TRANSFER (Article 58): Different city requires employee consent
    unless contract states otherwise.
"""

SYSTEM_PROMPT = """You are a Saudi Labor Law compliance expert.
Analyze employment contracts against Saudi Labor Law (amended Feb 19, 2025).
Use cautious language: "may conflict with", "requires review", "potential risk".
Respond ONLY with raw valid JSON — no markdown fences, no commentary."""


def _call_api(api_key: str, system: str, user_prompt: str,
              max_tokens: int = 6000) -> tuple[Optional[str], Optional[str]]:
    """
    Call OpenAI Chat Completions API directly with requests.
    Returns (response_text, finish_reason) or (None, None) on failure.
    """
    try:
        import requests as req
    except ImportError:
        logger.error("requests library not installed")
        return None, None

    model = os.getenv("OPENAI_MODEL", DEFAULT_MODEL)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": 0.2,   # Low temperature = more consistent JSON output
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user_prompt},
        ],
    }

    try:
        resp = req.post(OPENAI_API_URL, headers=headers, json=payload, timeout=120)

        if resp.status_code == 401:
            logger.error("OpenAI: Invalid API key. Check OPENAI_API_KEY in .env")
            return None, None
        if resp.status_code == 429:
            logger.error("OpenAI: Rate limit or quota exceeded. Check your OpenAI billing.")
            return None, None
        if resp.status_code != 200:
            logger.error(f"OpenAI API error {resp.status_code}: {resp.text[:400]}")
            return None, None

        data = resp.json()
        choice = data["choices"][0]
        text = choice["message"]["content"]
        finish_reason = choice.get("finish_reason", "stop")

        # Log token usage for cost tracking
        usage = data.get("usage", {})
        logger.info(
            f"OpenAI tokens — prompt: {usage.get('prompt_tokens', '?')} "
            f"completion: {usage.get('completion_tokens', '?')} "
            f"total: {usage.get('total_tokens', '?')} "
            f"model: {model}"
        )
        return text, finish_reason

    except req.exceptions.Timeout:
        logger.error("OpenAI API timed out after 120s")
        return None, None
    except (KeyError, IndexError) as e:
        logger.error(f"Unexpected OpenAI response structure: {e}")
        return None, None
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return None, None


def _strip_fences(text: str) -> str:
    """Remove any accidental markdown code fences."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def _parse_json_robust(text: str) -> Optional[dict]:
    """
    Parse JSON with fallback for truncated responses.
    Tries several strategies before giving up.
    """
    cleaned = _strip_fences(text)

    # 1. Normal parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 2. Try appending common closing sequences
    for suffix in ['"}]}]}', '"]}}}', '"]}}', '"]}', '}}', '}']:
        try:
            return json.loads(cleaned + suffix)
        except json.JSONDecodeError:
            pass

    # 3. Find last complete object boundary and close arrays/braces
    last_boundary = max(
        cleaned.rfind('},\n    {'),
        cleaned.rfind('},\n  {'),
        cleaned.rfind('},\n{'),
        cleaned.rfind('}},'),
        cleaned.rfind('"}'),
    )
    if last_boundary > 100:
        truncated = cleaned[:last_boundary + 2]
        open_sq = truncated.count('[') - truncated.count(']')
        open_br = truncated.count('{') - truncated.count('}')
        closing = ']' * max(0, open_sq) + '}' * max(0, open_br)
        try:
            return json.loads(truncated + closing)
        except json.JSONDecodeError:
            pass

    logger.error(f"JSON salvage failed. Response start: {cleaned[:300]}")
    return None


def _build_prompt(raw_text: str, contract_label: str, lang_name: str,
                  short: bool = False) -> str:
    """Build analysis prompt. short=True uses smaller excerpt for retry."""
    max_chars = 4000 if short else 7000
    excerpt = raw_text[:max_chars]
    if len(raw_text) > max_chars:
        excerpt += "\n[... contract continues ...]"

    clause_count = "4-6" if short else "6-10"
    categories = ("parties, job_title, workplace, salary, duration, probation, "
                  "working_hours, vacation, overtime, termination, compensation, "
                  "confidentiality, non_compete, deductions, transfer, "
                  "medical_insurance, renewal, start_date, other")

    return f"""Analyze this {contract_label} written in {lang_name}.

SAUDI LABOR LAW:
{SAUDI_LABOR_LAW_KNOWLEDGE}

CONTRACT TEXT:
---
{excerpt}
---

Return ONLY this JSON (no markdown, no extra text):
{{
  "contract_info": {{
    "employer_name": "",
    "employee_name": "",
    "job_title": "",
    "basic_salary": "",
    "gross_salary": "",
    "contract_duration": "",
    "probation_period": "",
    "work_location": "",
    "start_date": "",
    "detected_language": "ar or en"
  }},
  "executive_summary": {{
    "overall_status": "valid or attention or high_risk",
    "compliance_score": 75,
    "summary_text": "2-3 sentence summary",
    "key_findings": ["finding 1", "finding 2"]
  }},
  "clauses": [
    {{
      "category": "salary",
      "clause_title": "title under 60 chars",
      "clause_text": "excerpt under 150 chars",
      "assessment": "compliant",
      "risk_level": "low",
      "explanation": "explanation under 150 chars",
      "regulatory_reference": "Article XX under 100 chars",
      "recommendation": "advice under 150 chars"
    }}
  ],
  "missing_clauses": [
    {{
      "clause_name": "name",
      "importance": "required",
      "description": "why important under 120 chars",
      "regulatory_reference": "reference"
    }}
  ],
  "suggested_questions": [
    {{
      "question": "question under 120 chars",
      "related_clause": "clause",
      "priority": "high"
    }}
  ]
}}

EXACT values only:
- category: {categories}
- assessment: compliant, needs_clarification, may_non_compliant, missing, ambiguous, unusual
- risk_level: low, medium, high, critical
- importance: required, recommended, optional
- priority: high, medium, low

Provide exactly {clause_count} clause analyses.
Provide 3-5 suggested questions.
Flag: probation >90 days = high risk, missing salary = critical, vague non-compete = high risk.
compliance_score: 85-100=valid, 65-84=attention, below 65=high_risk.
Respond in the same language as the contract."""


def analyze_contract(raw_text: str,
                     contract_type: str = "employment_contract",
                     language: str = "ar") -> Optional[dict]:
    """
    Analyze a contract using OpenAI.
    Tries full analysis first, automatically retries with shorter prompt on failure.
    """
    if not raw_text or len(raw_text.strip()) < 50:
        logger.warning("Contract text too short to analyze")
        return None

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable is not set")
        return None

    lang_name = "Arabic" if language == "ar" else "English"
    contract_label = contract_type.replace("_", " ")

    # Attempt 1: full analysis
    logger.info("Analyzing contract (attempt 1 — full)...")
    prompt = _build_prompt(raw_text, contract_label, lang_name, short=False)
    raw_resp, finish = _call_api(api_key, SYSTEM_PROMPT, prompt, max_tokens=6000)

    if raw_resp:
        if finish == "length":
            logger.warning("Response hit token limit — attempting JSON salvage")
        result = _parse_json_robust(raw_resp)
        if result:
            _log_result(result)
            return result
        logger.warning("JSON parse failed on attempt 1 — retrying with shorter prompt")

    # Attempt 2: shorter prompt
    logger.info("Analyzing contract (attempt 2 — short)...")
    prompt_short = _build_prompt(raw_text, contract_label, lang_name, short=True)
    raw_resp2, _ = _call_api(api_key, SYSTEM_PROMPT, prompt_short, max_tokens=4000)

    if raw_resp2:
        result2 = _parse_json_robust(raw_resp2)
        if result2:
            logger.info("Attempt 2 succeeded")
            _log_result(result2)
            return result2

    logger.error("Both analysis attempts failed")
    return None


def _log_result(result: dict) -> None:
    s = result.get("executive_summary", {})
    logger.info(
        f"Analysis complete — status={s.get('overall_status')} "
        f"score={s.get('compliance_score')} "
        f"clauses={len(result.get('clauses', []))}"
    )


def apply_rule_engine(analysis_result: dict, raw_text: str) -> dict:
    """
    Deterministic rule engine layered on top of AI output.
    Ensures critical issues are never missed.
    """
    if not analysis_result:
        return analysis_result

    text_lower = raw_text.lower()
    clauses = analysis_result.get("clauses", [])
    existing = {c["category"] for c in clauses}

    # Rule 1: Salary must exist
    if "salary" not in existing:
        has_salary = any(kw in text_lower for kw in
                         ["salary", "wage", "compensation", "remuneration",
                          "راتب", "أجر", "مرتب"])
        if not has_salary:
            clauses.append({
                "category": "salary",
                "clause_title": "Basic Salary — Not Found",
                "clause_text": "",
                "assessment": "missing",
                "risk_level": "critical",
                "explanation": "No salary clause detected. Required by Saudi Labor Law Article 51.",
                "regulatory_reference": "Saudi Labor Law Article 51.",
                "recommendation": "Do NOT sign without a clearly stated basic salary in Saudi Riyals.",
            })

    # Rule 2: Parties check
    if "parties" not in existing:
        clauses.append({
            "category": "parties",
            "clause_title": "Contract Parties — Verify Completeness",
            "clause_text": "",
            "assessment": "needs_clarification",
            "risk_level": "medium",
            "explanation": "Verify employer legal name, address, and employee name/nationality/ID.",
            "regulatory_reference": "Saudi Labor Law Article 51.",
            "recommendation": "Ensure both parties are fully identified with legal names and ID numbers.",
        })

    # Rule 3: Flag probation > 90 days
    prob = next((c for c in clauses if c["category"] == "probation"), None)
    if prob:
        search_text = prob.get("clause_text", "") + " " + raw_text[:3000]
        m_months = re.search(r"(\d+)\s*(?:month|months|شهر|أشهر)", search_text, re.IGNORECASE)
        m_days   = re.search(r"(\d+)\s*(?:day|days|يوم|أيام)", search_text, re.IGNORECASE)
        msg = None
        if m_months and int(m_months.group(1)) > 3:
            msg = (f"{m_months.group(1)}-month probation exceeds 90-day maximum. "
                   "Extension requires separate written agreement.")
        elif m_days and int(m_days.group(1)) > 90:
            msg = f"{m_days.group(1)}-day probation exceeds the 90-day legal maximum."
        if msg:
            prob["assessment"] = "may_non_compliant"
            prob["risk_level"] = "high"
            prob["explanation"] = msg
            prob["regulatory_reference"] = (
                "Saudi Labor Law Article 53 — Max 90 days; "
                "extension to 180 only by written mutual agreement.")
            prob["recommendation"] = (
                "Request reduction to 90 days or get a signed extension agreement.")

    analysis_result["clauses"] = clauses

    compliant    = sum(1 for c in clauses if c["assessment"] == "compliant")
    attention    = sum(1 for c in clauses if c["assessment"] in
                       ("needs_clarification", "ambiguous", "unusual"))
    non_compliant = sum(1 for c in clauses if c["assessment"] in
                        ("may_non_compliant", "missing"))
    analysis_result["_counts"] = {
        "compliant": compliant,
        "attention": attention,
        "non_compliant": non_compliant,
    }
    return analysis_result
