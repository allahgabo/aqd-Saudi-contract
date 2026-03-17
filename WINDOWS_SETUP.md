# Windows Setup Guide — AQD · عقد

## Method 1: Local Development (No Docker — Easiest)

### Prerequisites
1. **Python 3.11+** — https://python.org/downloads  
   ✅ Check "Add Python to PATH" during install
2. **Node.js 18+** — https://nodejs.org (LTS version)
3. **Anthropic API Key** — https://platform.openai.com/api-keys

### Steps

```powershell
# 1. Open PowerShell in the aqd\ folder
#    (Right-click the aqd folder → "Open in Terminal")

# 2. Allow scripts to run (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Copy and edit the .env file
Copy-Item .env.example .env
notepad .env   # Add your OPENAI_API_KEY

# 4. Run the dev script
.\dev.ps1
```

**Alternative — use the batch file (cmd.exe):**
```cmd
dev.bat
```

The app opens automatically at **http://localhost:3000**

---

## Method 2: Docker (Recommended for production-like setup)

### Fix the "Access is denied" error

This error means Docker Desktop is not running or needs elevated permissions.

#### Step 1 — Start Docker Desktop as Administrator
1. Close Docker Desktop completely (right-click tray icon → Quit)
2. Right-click the Docker Desktop shortcut
3. Select **"Run as administrator"**
4. Wait for the whale icon to appear in the system tray (green = ready)

#### Step 2 — Check Docker is working
```powershell
docker ps
# Should show an empty table, not an error
```

#### Step 3 — Run the app
```powershell
# Copy and edit .env first
Copy-Item .env.example .env
notepad .env   # Add your OPENAI_API_KEY

# Start everything
docker compose up --build -d

# Check it's running
docker compose ps

# Seed demo data (optional)
docker compose exec backend python manage.py seed_demo
```

Open **http://localhost:3000** in your browser.

#### Common Docker errors on Windows

| Error | Fix |
|-------|-----|
| `Access is denied` / pipe error | Start Docker Desktop as Administrator |
| `WSL 2 installation is incomplete` | Run `wsl --update` in PowerShell as Admin |
| `port is already allocated` | Change ports in docker-compose.yml (e.g. `"8001:8000"`) |
| `no matching manifest for windows/amd64` | Enable "Use WSL 2 based engine" in Docker Desktop settings |

#### Enable WSL 2 (if not already)
```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
```
Then restart your computer.

---

## Setting OPENAI_API_KEY

1. Go to https://platform.openai.com/api-keys
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-...``)
4. Open `.env` and replace:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```
   with your actual key.

---

## Useful commands (PowerShell)

```powershell
# View running containers
docker compose ps

# View backend logs
docker compose logs backend -f

# View frontend logs
docker compose logs frontend -f

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and delete all data (fresh start)
docker compose down -v

# Run Django management commands
docker compose exec backend python manage.py seed_demo
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py test contracts
```

---

## Accessing Django Admin

1. Create a superuser:
   ```powershell
   # Docker:
   docker compose exec backend python manage.py createsuperuser
   
   # Local dev (PowerShell):
   cd backend
   .\venv\Scripts\python.exe manage.py createsuperuser
   ```
2. Open http://localhost:8000/admin

---

## Project URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | React frontend |
| http://localhost:8000/api/contracts/ | Contracts API |
| http://localhost:8000/api/contracts/stats/ | Dashboard stats |
| http://localhost:8000/admin | Django admin |
| http://localhost:8000/api/auth/token/ | Get JWT token |


---

## Troubleshooting the 404 / API errors

### Symptom: "Request failed with status code 404" in browser console

This means the React frontend loaded fine, but it can't reach the Django API.

**Cause**: Django backend isn't running.

**Fix**: Open a terminal in `aqd\backend\` and run:
```powershell
# Activate virtualenv
.\venv\Scripts\Activate.ps1

# Set required env vars
$env:USE_SQLITE = "True"
$env:OPENAI_API_KEY = "sk-YOUR-OPENAI-KEY"

# Start Django
python manage.py runserver
```

You should see:
```
Django version 6.x, using settings 'aqd_backend.settings'
Starting development server at http://127.0.0.1:8000/
```

Then refresh http://localhost:3000 — the red banner will disappear.

---

### Symptom: Red banner "Backend not reachable" at top of page

Same as above — Django is not running. Click the **Retry** button after starting it.

---

### Symptom: "USE_SQLITE" or database errors on first run

```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:USE_SQLITE = "True"
python manage.py migrate
python manage.py seed_demo
```

---

### Symptom: `Set-ExecutionPolicy` error when running dev.ps1

```powershell
# Run this once as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Symptom: `npm start` opens a blank page

Make sure the `.env.local` file exists in `aqd\frontend\`:
```
REACT_APP_API_URL=http://localhost:8000/api
```

Create it with:
```powershell
"REACT_APP_API_URL=http://localhost:8000/api" | Out-File frontend\.env.local -Encoding utf8
```

Then restart `npm start`.

---

### Quick-start checklist

- [ ] `.env` exists with a valid `OPENAI_API_KEY`  
- [ ] Python virtualenv created: `cd backend && python -m venv venv`
- [ ] Dependencies installed: `venv\Scripts\pip install -r requirements.txt`
- [ ] Database migrated: `$env:USE_SQLITE="True"; python manage.py migrate`
- [ ] Django running on :8000  
- [ ] `frontend\.env.local` has `REACT_APP_API_URL=http://localhost:8000/api`
- [ ] React running on :3000
