#!/bin/bash

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Заполнение базы тестовыми данными и обновление паролей при деплое:
python manage.py seed_data

echo "Build and setup complete!"
