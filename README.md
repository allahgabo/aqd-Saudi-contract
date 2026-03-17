# AQD · عقد — Saudi Employment Contract Analyzer

> AI-powered employment contract review aligned with Saudi Labor Law (amended February 19, 2025).  
> Supports Arabic & English contracts. PDF, DOCX, and image input.

---

## Features

- **Contract Analysis** — Clause-by-clause review against Saudi Labor Law 2025
- **Risk Scoring** — Overall compliance score (0–100%) with color-coded risk levels
- **Rule Engine** — Deterministic checks on top of AI (probation limits, salary requirements, etc.)
- **Missing Clauses** — Detects legally required clauses that are absent
- **Suggested Questions** — Generates questions for the employee to ask their employer
- **PDF Report** — Downloadable professional report
- **Bilingual** — Arabic & English contract analysis
- **Multi-format** — PDF, DOCX, DOC, JPG, PNG, TXT

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · Django · Django REST Framework |
| Database | PostgreSQL |
| AI Engine | OpenAI gpt-4o-mini |
| PDF Generation | ReportLab |
| Text Extraction | pdfplumber · PyPDF2 · python-docx · pytesseract |
| Frontend | React · TypeScript · React Router |
| Charts | Recharts |
| Deployment | Docker · Docker Compose · Nginx · Gunicorn |

---

## Quick Start (Docker — Recommended)

### Prerequisites
- Docker & Docker Compose installed
- Anthropic API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Steps

```bash
# 1. Clone / extract the project
cd aqd

# 2. Create your environment file
cp .env.example .env

# 3. Edit .env — add your OPENAI_API_KEY and change passwords
nano .env

# 4. Start everything
docker compose up --build -d

# 5. Open in browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
# Django Admin: http://localhost:8000/admin
```

---

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install OCR support (Ubuntu/Debian)
sudo apt-get install tesseract-ocr tesseract-ocr-ara

# Create .env file
cp ../.env.example .env
# Edit .env — add OPENAI_API_KEY

# Run migrations (uses SQLite by default if no DB_NAME set)
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Set API URL
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env.local

# Start development server
npm start
# → Opens at http://localhost:3000
```

---

## API Reference

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contracts/upload/` | Upload & analyze a contract |
| `GET` | `/api/contracts/` | List all contracts |
| `GET` | `/api/contracts/{id}/` | Get full analysis |
| `DELETE` | `/api/contracts/{id}/delete/` | Delete a contract |
| `GET` | `/api/contracts/stats/` | Dashboard statistics |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/{id}/download/` | Download PDF report |

### Auth (Optional)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Register a user |
| `POST` | `/api/auth/token/` | Login (get JWT tokens) |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |

### Upload Example

```bash
curl -X POST http://localhost:8000/api/contracts/upload/ \
  -F "file=@my_contract.pdf" \
  -F "contract_type=employment_contract"
```

---

## Contract Analysis Covers

The system reviews **17+ clause categories**:

| Category | What's Checked |
|----------|----------------|
| Parties | Employer/employee info completeness |
| Salary | Basic wage, allowances, WPS compliance |
| Probation | Max 90 days (extendable to 180 by written agreement) |
| Working Hours | 8h/day, 48h/week, Ramadan rules |
| Overtime | Minimum 50% premium per Saudi Law Art. 107 |
| Annual Leave | 21/30 days based on tenure |
| Termination | 60-day notice, proper compensation |
| Non-Compete | Duration, scope, proportionality |
| Deductions | 5-day/month limit for disciplinary deductions |
| End of Service | Gratuity calculation per Art. 84 |
| Transfer | Employee consent requirements |
| Medical Insurance | Coverage requirements |
| Confidentiality | Scope and duration reasonableness |
| Contract Duration | Fixed-term vs indefinite |
| Work Location | Specificity and transfer rights |
| Start Date | Presence and clarity |
| Renewal | Automatic renewal clauses |

---

## Legal Knowledge Base

The system is grounded in:

- **Saudi Labor Law** (Royal Decree No. M/51 & amendments effective Feb 19, 2025)
- **Implementing Regulations** of the Labor Law
- **Wage Protection System** requirements
- **Ministry of Human Resources** standard contract template requirements
- **Council of Health Insurance** regulations

---

## Project Structure

```
aqd/
├── backend/
│   ├── aqd_backend/         # Django project settings & URLs
│   ├── contracts/           # Main app: models, views, serializers
│   │   └── services/
│   │       ├── extractor.py # PDF/DOCX/image text extraction
│   │       └── analyzer.py  # AI analysis + rule engine
│   ├── reports/             # PDF report generation
│   │   └── pdf_generator.py # ReportLab PDF builder
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api.ts           # API client & TypeScript types
│   │   ├── App.tsx          # Router setup
│   │   ├── components/
│   │   │   └── Layout.tsx   # Sidebar navigation
│   │   └── pages/
│   │       ├── Dashboard.tsx    # Stats & recent contracts
│   │       ├── Upload.tsx       # Upload & analysis wizard
│   │       ├── ContractDetail.tsx # Full analysis view
│   │       └── History.tsx      # Contract history & search
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | Your OpenAI API key |
| `DB_NAME` | No | PostgreSQL database name (default: uses SQLite) |
| `DB_USER` | No | PostgreSQL user |
| `DB_PASSWORD` | No | PostgreSQL password |
| `DB_HOST` | No | PostgreSQL host |
| `SECRET_KEY` | No | Django secret key (change in production!) |
| `DEBUG` | No | `True` for development, `False` for production |
| `REACT_APP_API_URL` | No | Backend API URL (default: http://localhost:8000/api) |

---

## Security & Privacy

- Contracts are processed and stored in your own infrastructure
- File uploads limited to 20MB
- No data sent to third parties except the Anthropic API for analysis
- JWT authentication available for multi-user deployments
- File contents are used only for the analysis request

---

## Roadmap (MVP v2)

- [ ] Arabic + English side-by-side report
- [ ] Contract comparison (two versions)
- [ ] Chat with your contract (conversational Q&A)
- [ ] Company dashboard with batch upload
- [ ] Employer risk score
- [ ] Automatic legal knowledge base updates
- [ ] Qiwa platform integration

---

## Disclaimer

This tool provides AI-assisted contract guidance for informational purposes only. It does not constitute legal advice or a definitive legal opinion. For legally binding decisions, consult a qualified Saudi labor law attorney. Language such as "may conflict with" or "requires review" indicates areas for further examination, not conclusive violations.
