import urllib.request
import urllib.parse
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_telegram_message(text, to_chat_id=None, **kwargs):
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = to_chat_id or getattr(settings, 'TELEGRAM_CHAT_ID', None)

    if not bot_token or not chat_id:
        logger.warning("Telegram Bot Token or Chat ID not configured. Message not sent: %s", text)
        print(f"[Telegram Mock] Notification to {chat_id or 'unknown'}: {text}")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if kwargs.get('reply_markup'):
        payload['reply_markup'] = kwargs.get('reply_markup')

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = response.read()
            res_json = json.loads(res_data.decode('utf-8'))
            if res_json.get('ok'):
                return True
            else:
                logger.error("Telegram API Error: %s", res_json)
                return False
    except Exception as e:
        logger.error("Failed to send Telegram message: %s", str(e))
        return False
