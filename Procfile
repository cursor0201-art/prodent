web: cd backend && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
worker: cd backend && celery -A core worker -l info
beat: cd backend && celery -A core beat -l info
