#!/bin/bash
# ============================================================
#  AQD · عقد — Local Development Runner
#  Usage: ./dev.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

banner() {
echo -e "${BLUE}"
cat << 'BANNER'
    ___  ____  ____
   / _ \/ __ \/ __ \  عقد
  / ___/ / / / / / /
 /_/  /_/ /_/_/ /_/
  Saudi Contract Analyzer
BANNER
echo -e "${NC}"
}

banner

# ── Check .env ──────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❗ Please edit .env and add your OPENAI_API_KEY, then re-run.${NC}"
    exit 1
fi

source .env
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ]; then
    echo -e "${RED}❗ OPENAI_API_KEY is not set in .env${NC}"
    echo "   Get your key at: https://platform.openai.com/api-keys"
    exit 1
fi

echo -e "${GREEN}✓ OPENAI_API_KEY found${NC}"

# ── Check Python ────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}❗ Python 3 is required. Install from https://python.org${NC}"
    exit 1
fi

# ── Check Node ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo -e "${RED}❗ Node.js is required. Install from https://nodejs.org${NC}"
    exit 1
fi

# ── Backend setup ───────────────────────────────────────────
echo -e "\n${CYAN}=== Setting up Backend ===${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtualenv and installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

echo "Running migrations (SQLite)..."
USE_SQLITE=True python manage.py migrate --noinput 2>&1 | grep -v "^$"

echo -e "${GREEN}✓ Backend ready${NC}"

# ── Frontend setup ──────────────────────────────────────────
echo -e "\n${CYAN}=== Setting up Frontend ===${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages (this may take a minute)..."
    npm install --legacy-peer-deps --silent
fi

# Write .env.local for frontend
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env.local
echo -e "${GREEN}✓ Frontend ready${NC}"

# ── Start both servers ──────────────────────────────────────
echo -e "\n${CYAN}=== Starting Servers ===${NC}"
cd ..

# Start backend
echo "Starting Django backend on :8000..."
(
    cd backend
    source venv/bin/activate
    export USE_SQLITE=True
    export OPENAI_API_KEY="$OPENAI_API_KEY"
    python manage.py runserver 8000
) &
BACKEND_PID=$!

# Start frontend
sleep 2
echo "Starting React frontend on :3000..."
(
    cd frontend
    REACT_APP_API_URL=http://localhost:8000/api npm start
) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   AQD is running!                      ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║   Frontend:  http://localhost:3000     ║${NC}"
echo -e "${GREEN}║   API:       http://localhost:8000/api ║${NC}"
echo -e "${GREEN}║   Admin:     http://localhost:8000/admin║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║   Press Ctrl+C to stop                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

# Cleanup on exit
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
