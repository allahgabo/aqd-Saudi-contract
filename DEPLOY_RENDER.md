# 🚀 Deploy AQD to Render — Step by Step

## What you get
- **Backend API** (Django): `https://aqd-backend.onrender.com`
- **Frontend** (React): `https://aqd-frontend.onrender.com`
- **Database** (PostgreSQL): managed by Render

Free tier works for demos. Upgrade to Starter ($7/service/mo) for production.

---

## Option A — Automatic via Blueprint (recommended)

### Step 1 — Push to GitHub
```
git init
git add .
git commit -m "Initial commit"
```
Create a repo on GitHub: https://github.com/new  
Then:
```
git remote add origin https://github.com/YOUR_USERNAME/aqd-analyzer.git
git push -u origin main
```

### Step 2 — Connect to Render
1. Go to **https://render.com** and sign in / sign up
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account, select the `aqd-analyzer` repo
4. Render reads `render.yaml` and creates all 3 services automatically

### Step 3 — Set secrets
After services are created, go to each service and set these env vars:

**aqd-backend** → Environment:
| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | `sk-your-openai-key-here` |

**aqd-frontend** → Environment:
| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://aqd-backend.onrender.com/api` |

Also update **aqd-backend** once you know the frontend URL:
| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://aqd-frontend.onrender.com` |

### Step 4 — Trigger redeploy
After setting env vars, click **"Manual Deploy"** → **"Deploy latest commit"** on each service.

---

## Option B — Manual service creation

If you prefer to create services one by one:

### 1. Create PostgreSQL database
- Render Dashboard → **New** → **PostgreSQL**
- Name: `aqd-db`
- Plan: Free
- Click **Create Database** — note the **Internal Database URL**

### 2. Create backend Web Service
- **New** → **Web Service** → connect your GitHub repo
- **Root Directory**: `backend`
- **Runtime**: Python 3
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn aqd_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Plan**: Free

**Environment Variables:**
```
DATABASE_URL     = <paste Internal Database URL from step 1>
SECRET_KEY       = <click Generate> or any long random string
OPENAI_API_KEY   = sk-your-key
DEBUG            = False
```

### 3. Create frontend Static Site
- **New** → **Static Site** → connect same repo
- **Root Directory**: `frontend`
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Publish Directory**: `build`

**Environment Variable:**
```
REACT_APP_API_URL = https://aqd-backend.onrender.com/api
```

**Redirect/Rewrite Rule** (for React Router):
- Source: `/*`
- Destination: `/index.html`
- Action: **Rewrite**

---

## ⚠ Free Tier Limitations

| Issue | Cause | Fix |
|-------|-------|-----|
| Service sleeps after 15min | Free plan | Upgrade to Starter $7/mo |
| First request takes ~30s | Cold start on free | Upgrade or add uptime monitor |
| Database deleted after 90 days | Free PostgreSQL | Upgrade to Starter DB |

---

## 🔐 Admin Account

After first deploy, the build script auto-creates:
- Username: `admin`
- Password: `admin123`
- Plan: Enterprise

**Change the password immediately** at `/settings` after login.

---

## 🔄 Redeploying after code changes

```
git add .
git commit -m "Update"
git push
```
Render auto-deploys on every push to `main`.

---

## Custom Domain (optional)

1. Render Dashboard → your frontend service → **Settings** → **Custom Domain**
2. Add your domain (e.g. `aqd.yourdomain.com`)
3. Add the DNS record shown at your domain registrar
4. SSL is automatic (Let's Encrypt)

Also update `FRONTEND_URL` on the backend to match your custom domain.

---

## Troubleshooting

**"Application failed to respond"** → Check backend logs in Render dashboard

**"CORS error" in browser** → Set `FRONTEND_URL` env var on backend to your exact frontend URL

**"Database connection failed"** → Make sure `DATABASE_URL` is set on backend and points to your Render PostgreSQL

**"Build failed - module not found"** → Check `requirements.txt` includes `whitenoise` and `dj-database-url`

**Files not persisting (uploaded contracts lost after restart)** → Free tier has no persistent disk. Upgrade to add a Render Disk, or integrate AWS S3 for file storage.
