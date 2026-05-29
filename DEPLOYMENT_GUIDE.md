# Инструкция по деплою Prodent CRM (Koyeb + Cloudflare)

Эта инструкция содержит все необходимые шаги для развертывания вашего бэкенда на платформе Koyeb и фронтенда на Cloudflare Pages. Я уже добавил необходимые зависимости (`gunicorn`, `whitenoise`, `dj-database-url`) и подготовил файлы: `Dockerfile` и `koyeb_build.sh`.

## Шаг 1: Подготовка Backend (Koyeb)
1. Авторизуйтесь на [Koyeb.com](https://app.koyeb.com/).
2. Перейдите в раздел **Databases** и создайте новую базу (Create Database -> PostgreSQL). Скопируйте строку подключения `PostgreSQL Connection String` (Она выглядит как `postgresql://user:pass@host:5432/db`).
3. Перейдите в раздел **Apps** -> **Create Service**.
4. Подключите ваш GitHub репозиторий, где хранится проект, и выберите папку `backend` в качестве рабочей директории (Work directory).
5. **Builder:** Выберите `Dockerfile`.
6. **Environment variables:**
   Добавьте следующие переменные:
   - `DATABASE_URL` = (ваша строка из Koyeb Database)
   - `SECRET_KEY` = `ваш-супер-секретный-ключ` (придумайте любой надежный пароль)
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `.koyeb.app,ваш-кастомный-домен.com`
   - `CORS_ALLOWED_ORIGINS` = `https://ваш-проект.pages.dev,https://ваш-домен.com`
   - `TELEGRAM_BOT_TOKEN` = `токен_вашего_бота`
   - `TELEGRAM_WEBHOOK_URL` = `https://<название-вашего-app>.koyeb.app/api/telegram/webhook/`
7. Нажмите **Deploy**.

*Koyeb автоматически найдет `Dockerfile`, соберет образ, загрузит зависимости и запустит Gunicorn. Также при старте Koyeb запустит миграции базы, так как `koyeb_build.sh` (или Dockerfile) это сделают.*

## Шаг 2: Настройка базы данных и миграций
Я создал для вас скрипт `koyeb_build.sh` внутри папки `/backend`.
Если вы хотите, чтобы миграции запускались автоматически при каждом деплое, перейдите в настройки вашего сервиса на Koyeb (Settings), найдите поле **Run Command** или **Build Command** и укажите там: `bash koyeb_build.sh`.

## Шаг 3: Подготовка Frontend (Cloudflare Pages)
1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
2. Нажмите **Create Application** -> **Pages** -> **Connect to Git**.
3. Выберите ваш репозиторий с проектом Prodent.
4. В разделе **Set up builds and deployments**:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next` (или `out`, если вы поменяли `next.config.ts` на `output: 'export'`. По умолчанию Cloudflare сам адаптирует SSR Next.js через Workers).
   - Root directory (Root directory path): `/frontend`
5. **Environment variables (Переменные окружения):**
   - `NEXT_PUBLIC_API_URL` = `https://<название-вашего-app>.koyeb.app` (адрес бэкенда)
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = `имя_вашего_бота_без_@`
6. Нажмите **Save and Deploy**. Cloudflare автоматически соберет проект.

## Шаг 4: Установка Telegram Webhook
После успешного деплоя бэкенда, вам нужно "сказать" Telegram-у, куда отправлять сообщения.
Просто откройте в браузере (или выполните команду в терминале):

```bash
curl "https://api.telegram.org/bot<ВАШ_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<ВАШ_KOYEB_APP_URL>/api/telegram/webhook/"
```
Вы должны получить ответ: `{"ok":true,"result":true,"description":"Webhook was set"}`.

## Шаг 5: Настройка SSL и кастомного домена
1. В панели Koyeb перейдите в ваш сервис -> **Domains** -> **Add Domain**.
2. Введите ваш домен (например, `api.prodent.uz`). Koyeb даст вам CNAME запись (например, `xxx.koyeb.app`).
3. Зайдите в DNS-настройки Cloudflare (куда привязан ваш домен) и добавьте запись **CNAME**:
   - Name: `api`
   - Target: `xxx.koyeb.app`
   - Proxy status: ☁️ Включен (Proxied)
4. В разделе **SSL/TLS** в Cloudflare обязательно установите режим шифрования на **Full (Strict)**. Это гарантирует, что соединение между Cloudflare и сервером Koyeb полностью защищено.
5. Для фронтенда зайдите в настройки вашего проекта в Cloudflare Pages -> **Custom Domains** -> Добавьте свой домен (например, `prodent.uz`). Cloudflare автоматически добавит нужные записи.

Готово! Ваш проект Prodent CRM развернут, защищен SSL от Cloudflare и готов к боевому запуску. 🚀
