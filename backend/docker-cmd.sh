#!/bin/bash
set -e

echo "Выполнение миграций"
python manage.py migrate --noinput

echo "Импорт дефолтных данных"
python manage.py import_analysis_indicators
python manage.py import_chronic_diseases
python manage.py import_specializations

echo "Запуск сервера..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 backend.wsgi:application