import time
import urllib.request
import urllib.parse
import json
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from patients.models import Patient

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Запускает Telegram бот-слушатель для привязки Chat ID пациентов"

    def handle(self, *args, **options):
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        if not bot_token:
            self.stderr.write("ОШИБКА: TELEGRAM_BOT_TOKEN не настроен в settings.py")
            return

        self.stdout.write(f"Бот успешно запущен. Слушаем обновления Telegram API...")
        offset = 0

        while True:
            try:
                url = f"https://api.telegram.org/bot{bot_token}/getUpdates?offset={offset}&timeout=10"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_data = response.read()
                    res_json = json.loads(res_data.decode('utf-8'))
                    
                    if not res_json.get('ok'):
                        time.sleep(2)
                        continue

                    for update in res_json.get('result', []):
                        offset = update.get('update_id') + 1
                        message = update.get('message')
                        if not message:
                            continue

                        chat_id = message.get('chat', {}).get('id')
                        text = message.get('text', '')

                        # Check if command is /start patient_<id>
                        if text.startswith('/start'):
                            parts = text.split(' ')
                            if len(parts) > 1 and parts[1].startswith('patient_'):
                                try:
                                    patient_id = int(parts[1].split('_')[1])
                                    patient = Patient.objects.get(id=patient_id)
                                    
                                    # Save Telegram Chat ID
                                    patient.telegram_chat_id = str(chat_id)
                                    patient.save()

                                    # Send confirmation back
                                    self.send_reply(
                                        bot_token, 
                                        chat_id, 
                                        f"Здравствуйте, {patient.first_name}! 👋\n\n"
                                        f"Ваш Telegram успешно привязан к клинике <b>Prodent Stomatologiya</b>. "
                                        f"Теперь вы будете получать автоматические напоминания о ваших визитах и приёмах сюда!"
                                    )
                                    self.stdout.write(self.style.SUCCESS(f"Пациент {patient} привязал Telegram Chat ID: {chat_id}"))

                                except Patient.DoesNotExist:
                                    self.send_reply(bot_token, chat_id, "Ошибка: Пациент с таким ID не найден.")
                                except Exception as e:
                                    self.stdout.write(f"Ошибка при обработке: {e}")
                                    self.send_reply(bot_token, chat_id, "Произошла системная ошибка при привязке аккаунта.")

            except Exception as e:
                # If offline or rate limited, wait a bit
                time.sleep(5)

    def send_reply(self, token, chat_id, text):
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=5) as r:
                r.read()
        except Exception as e:
            logger.error("Failed to send reply to client: %s", str(e))
