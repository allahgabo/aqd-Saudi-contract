#!/bin/bash
set -e

echo "==================================="
echo "  AQD Backend Starting..."
echo "==================================="

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn aqd_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --log-level info \
    --access-logfile -
