FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Установка системных зависимостей для сборки psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Установка зависимостей Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода
COPY . /app/

# Сборка статических файлов (настройка Whitenoise должна быть в settings.py)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Запуск миграций, автосоздание админа (чтобы обойти платный Shell) и запуск Gunicorn
CMD ["sh", "-c", "python manage.py migrate && python manage.py shell -c \"from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', '', 'admin123')\" && gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
