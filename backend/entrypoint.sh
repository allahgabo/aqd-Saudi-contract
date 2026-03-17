#!/bin/bash
set -e

echo "======================================="
echo "  AQD · عقد — Backend Entrypoint"
echo "======================================="

# Wait for PostgreSQL if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "Waiting for PostgreSQL at $DB_HOST:${DB_PORT:-5432}..."
    until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME','aqd_db'),
        user=os.environ.get('DB_USER','aqd_user'),
        password=os.environ.get('DB_PASSWORD',''),
        host=os.environ.get('DB_HOST','localhost'),
        port=int(os.environ.get('DB_PORT',5432))
    ).close()
    sys.exit(0)
except Exception as e:
    print(f'  Still waiting: {e}')
    sys.exit(1)
"; do
        sleep 2
    done
    echo "PostgreSQL is ready!"
fi

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

# Create superuser if env vars provided
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser \
        --noinput \
        --username "${DJANGO_SUPERUSER_USERNAME:-admin}" \
        --email "$DJANGO_SUPERUSER_EMAIL" 2>/dev/null || echo "Superuser already exists."
fi

echo "Starting Gunicorn server..."
exec gunicorn aqd_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
