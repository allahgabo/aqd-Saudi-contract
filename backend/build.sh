#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Render Build Script — runs once during every deploy
# ─────────────────────────────────────────────────────────────────────────
set -o errexit   # exit on any error

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Collecting static files ==="
python manage.py collectstatic --no-input

echo "=== Running database migrations ==="
python manage.py migrate

echo "=== Seeding plans and admin user ==="
# Only creates if they don't already exist — safe to run every deploy
python manage.py create_admin || echo "Admin already exists, skipping"

echo "=== Build complete ==="
