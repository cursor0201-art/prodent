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

# Запуск миграций и Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
