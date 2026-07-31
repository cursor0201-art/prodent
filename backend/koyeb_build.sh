#!/bin/bash

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Заполнение учетных записей врачей/админа:
python manage.py seed_data

# Очистка тестовых данных (пациенты, приемы, финансы, склад) для начала реальной работы клиники:
python manage.py reset_data

echo "Build and setup complete!"
