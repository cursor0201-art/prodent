#!/bin/bash

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Раскомментируйте строку ниже, если хотите заполнить базу тестовыми данными при первом деплое:
# python manage.py seed_db

echo "Build and setup complete!"
