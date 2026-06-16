FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Установка системных зависимостей для сборки psycopg2 и Redis
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Установка зависимостей Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода
COPY . /app/

# Сборка статических файлов (настройка Whitenoise должна быть в settings.py)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Запуск Redis, миграций, Celery и Gunicorn
CMD ["sh", "-c", "redis-server --daemonize yes && python manage.py migrate && python manage.py seed_data && celery -A core worker --loglevel=info & celery -A core beat --loglevel=info & gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
