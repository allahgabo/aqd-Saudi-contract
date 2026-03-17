# AQD · عقد — Quick Start Guide

## What is AQD?
A **SaaS platform** for AI-powered Saudi employment contract review.
Multi-user, plan-based (Free / Pro / Enterprise), with an admin dashboard.

---

## Prerequisites
- Python 3.10+ — https://python.org (check "Add to PATH")
- Node.js 18 LTS — https://nodejs.org
- OpenAI API key — https://platform.openai.com/api-keys

---

## First-time Setup

### 1 — Copy and edit .env
```
copy .env.example .env      # cmd
```
Open `.env`, set:
```
OPENAI_API_KEY=sk-YOUR-REAL-KEY-HERE
```

### 2 — Backend
```
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt

set USE_SQLITE=True
venv\Scripts\python manage.py migrate
venv\Scripts\python manage.py create_admin     ← sets up plans + admin account
venv\Scripts\python manage.py seed_demo        ← optional demo contracts
cd ..
```

### 3 — Frontend
```
cd frontend
npm install --legacy-peer-deps
cd ..
```

### 4 — Run
```
dev.bat        (double-click, opens two windows + browser)
.\dev.ps1      (PowerShell)
```
App opens at **http://localhost:3000**

---

## Default Admin Account
| Field    | Value          |
|----------|----------------|
| Username | `admin`        |
| Password | `admin123`     |
| Plan     | Enterprise (unlimited) |
| Admin    | Yes            |

Change the password immediately in production!

---

## User Plans
| Plan       | Analyses/month | Price (SAR) | Features |
|------------|----------------|-------------|---------|
| Free       | 3              | 0           | Basic report |
| Pro        | 30             | 99          | + PDF, Chat, Compare, Share |
| Enterprise | Unlimited      | 299         | + Admin dashboard, API |

---

## Routes
| URL         | Description                    |
|-------------|-------------------------------|
| `/`         | Dashboard                      |
| `/upload`   | Analyze a contract             |
| `/history`  | All your contracts             |
| `/compare`  | Compare two contracts          |
| `/pricing`  | Plan pricing page              |
| `/settings` | Account settings               |
| `/admin`    | Admin dashboard (admin only)   |
| `/login`    | Sign in                        |
| `/register` | Create account                 |

---

## Common Fixes

**"OPENAI_API_KEY not set"** → Edit `.env`

**"Couldn't import Django":**
```
cd backend && python -m venv venv && venv\Scripts\pip install -r requirements.txt
```

**"npm: command not found":** Install Node.js from https://nodejs.org

**Plans missing after migration:**
```
cd backend && set USE_SQLITE=True && venv\Scripts\python manage.py create_admin
```
