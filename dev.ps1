# ============================================================
#  AQD - Saudi Contract Analyzer  
#  Usage: .\dev.ps1
# ============================================================
param([switch]$SkipInstall)
$ErrorActionPreference = "Stop"

function OK($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function ERR($t)  { Write-Host "`n[ERROR] $t`n" -ForegroundColor Red; Read-Host "Press Enter to exit"; exit 1 }
function STEP($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }

Write-Host "`n  AQD - Saudi Contract Analyzer" -ForegroundColor Blue
Write-Host "  ================================`n" -ForegroundColor Blue

# ── .env check ───────────────────────────────────────────────
STEP "Checking configuration"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  [!!] Created .env - add your OPENAI_API_KEY then re-run" -ForegroundColor Yellow
    Start-Process notepad ".env"
    Read-Host "Press Enter after saving .env"; exit 1
}

$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]*)=(.*)$") { $envVars[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$apiKey = $envVars["OPENAI_API_KEY"]
if (-not $apiKey -or $apiKey -like "sk-your-openai-api-key*") {
    ERR "OPENAI_API_KEY not set in .env`n  Get yours at: https://platform.openai.com/api-keys"
}
OK "OPENAI_API_KEY found"

# ── Python check ─────────────────────────────────────────────
STEP "Checking Python"
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    try { 
        $v = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) { $python = $cmd; OK "Python: $v"; break }
    } catch {}
}
if (-not $python) { ERR "Python not found.`n  Download: https://python.org`n  Check 'Add Python to PATH' during install" }

# ── Node check ───────────────────────────────────────────────
STEP "Checking Node.js"
try { $nv = & node --version 2>&1; if ($LASTEXITCODE -ne 0) { throw } ; OK "Node.js: $nv" }
catch { ERR "Node.js not found.`n  Download: https://nodejs.org (LTS version)" }

# ── Backend setup ─────────────────────────────────────────────
STEP "Setting up backend (Django)"
Push-Location backend

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "  Creating Python virtual environment..." -ForegroundColor Gray
    & $python -m venv venv
    if ($LASTEXITCODE -ne 0) { ERR "Failed to create venv" }
}
OK "Virtual environment ready"

if (-not $SkipInstall) {
    Write-Host "  Installing Python packages (first run ~2 min)..." -ForegroundColor Gray
    & venv\Scripts\pip.exe install -r requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) { ERR "pip install failed - check internet connection" }
    OK "Python packages installed"
}

Write-Host "  Running database migrations..." -ForegroundColor Gray
$env:USE_SQLITE = "True"
$env:OPENAI_API_KEY = $apiKey
& venv\Scripts\python.exe manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { ERR "Database migration failed" }
OK "Database ready"
Pop-Location

# ── Frontend setup ────────────────────────────────────────────
STEP "Setting up frontend (React)"
Push-Location frontend

if (-not $SkipInstall -and -not (Test-Path "node_modules\react\index.js")) {
    Write-Host "  Running npm install (first run ~2 min)..." -ForegroundColor Gray
    & npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { ERR "npm install failed - check internet connection" }
    OK "npm packages installed"
}

# Write env files (CRA reads these automatically)
Set-Content ".env.local" "REACT_APP_API_URL=http://localhost:8000/api`nBROWSER=none"
OK "Frontend env configured"
Pop-Location

# ── Launch servers ────────────────────────────────────────────
STEP "Launching servers"
$root = (Get-Location).Path

Write-Host "  Starting Django backend on :8000 ..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  `$host.UI.RawUI.WindowTitle = 'AQD Backend :8000'
  cd '$root\backend'
  `$env:USE_SQLITE = 'True'
  `$env:OPENAI_API_KEY = '$apiKey'
  Write-Host 'AQD Backend starting...' -ForegroundColor Cyan
  venv\Scripts\python.exe manage.py runserver
"@

Write-Host "  Waiting for backend..." -ForegroundColor Gray
Start-Sleep 5

Write-Host "  Starting React frontend on :3000 ..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  `$host.UI.RawUI.WindowTitle = 'AQD Frontend :3000'
  cd '$root\frontend'
  `$env:REACT_APP_API_URL = 'http://localhost:8000/api'
  Write-Host 'AQD Frontend starting...' -ForegroundColor Cyan
  npm start
"@

Start-Sleep 8
try { Start-Process "http://localhost:3000" } catch {}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   AQD is starting in two new windows!" -ForegroundColor Green
Write-Host ""
Write-Host "   App:    http://localhost:3000" -ForegroundColor Green
Write-Host "   API:    http://localhost:8000/api" -ForegroundColor Green
Write-Host "   Admin:  http://localhost:8000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "   Close the two server windows to stop." -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
