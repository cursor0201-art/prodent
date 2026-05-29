from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json
import logging
from core.telegram_utils import send_telegram_message

logger = logging.getLogger(__name__)

@csrf_exempt
def telegram_webhook(request):
    if request.method == 'POST':
        try:
            update = json.loads(request.body.decode('utf-8'))
            logger.info(f"Received Telegram Webhook: {update}")
            
            # Handle messages
            if 'message' in update:
                message = update['message']
                chat_id = message['chat']['id']
                text = message.get('text', '')
                
                if text.startswith('/start patient_'):
                    try:
                        patient_id = int(text.split('_')[1])
                        from patients.models import Patient
                        patient = Patient.objects.get(id=patient_id)
                        
                        # Security Check
                        if patient.telegram_chat_id and patient.telegram_chat_id != str(chat_id):
                            # The account is already linked to another chat
                            reply_markup = {
                                "inline_keyboard": [[
                                    {"text": "Да, перепривязать", "callback_data": f"relink_patient_{patient_id}"},
                                    {"text": "Нет, отмена", "callback_data": "cancel_relink"}
                                ]]
                            }
                            send_telegram_message(
                                "⚠️ Этот профиль пациента уже привязан к другому Telegram-аккаунту. Вы уверены, что хотите перепривязать его к текущему?",
                                to_chat_id=chat_id,
                                reply_markup=reply_markup
                            )
                        else:
                            # Link successfully
                            patient.telegram_chat_id = str(chat_id)
                            patient.save()
                            send_telegram_message(
                                f"✅ Здравствуйте, {patient.first_name}! Ваш аккаунт успешно привязан. Теперь вы будете получать уведомления о записях сюда.",
                                to_chat_id=chat_id
                            )
                    except Exception as e:
                        logger.error(f"Error processing /start command: {e}")
                        send_telegram_message("❌ Ошибка привязки аккаунта. Возможно, пациент не найден.", to_chat_id=chat_id)
            
            # Handle callback queries (inline buttons)
            elif 'callback_query' in update:
                callback = update['callback_query']
                data = callback.get('data', '')
                chat_id = callback['message']['chat']['id']
                
                if data.startswith('relink_patient_'):
                    patient_id = int(data.split('_')[2])
                    from patients.models import Patient
                    patient = Patient.objects.get(id=patient_id)
                    patient.telegram_chat_id = str(chat_id)
                    patient.save()
                    send_telegram_message("✅ Аккаунт успешно перепривязан к этому чату.", to_chat_id=chat_id)
                elif data == 'cancel_relink':
                    send_telegram_message("❌ Отменено.", to_chat_id=chat_id)
                elif data.startswith('confirm_'):
                    appt_id = int(data.split('_')[1])
                    from appointments.models import Appointment
                    appt = Appointment.objects.get(id=appt_id)
                    appt.status = 'BOOKED'
                    appt.save()
                    send_telegram_message(f"✅ Запись #{appt_id} подтверждена.", to_chat_id=chat_id)
                    
            return JsonResponse({"status": "ok"})
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return JsonResponse({"status": "error"}, status=500)
    return JsonResponse({"status": "invalid request"}, status=400)
