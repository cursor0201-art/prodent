from django.utils import formats

def get_registration_message(patient, date, time_str, address="г. Ташкент, Юнусабадский район.") -> str:
    # Принудительно используем узбекский язык для всех SMS уведомлений.
    lang = 'uz'

    name = f"{patient.first_name} {patient.last_name}".strip()

    if lang == 'uz':
        # ID 81265
        address_uz = "Toshkent sh., Yunusobod tumani." if address == "г. Ташкент, Юнусабадский район." else address
        return f"""🦷 Shark Denta

Assalomu alaykum, {name}!

Shark Denta klinikasini tanlaganingiz uchun rahmat.

Siz {date} kuni soat {time_str} ga muvaffaqiyatli yozildingiz.

📍 Manzil: {address_uz}

Savollar bo'lsa, biz bilan bog'laning.

Hurmat bilan,
Shark Denta"""

    # Fallback (нигде не должен вызываться, но оставлен на случай отклонения)
    return f"""🦷 Shark Denta

Assalomu alaykum, {name}!

Shark Denta klinikasini tanlaganingiz uchun rahmat.

Siz {date} kuni soat {time_str} da muvaffaqiyatli yozildingiz.

📍 Manzil: {address}

Savollar bo'lsa, biz bilan bog'laning.

Hurmat bilan,
Shark Denta"""


def get_reminder_message(patient, date, time_str, address="г. Ташкент, Юнусабадский район.", reminder_minutes=60) -> str:
    name = f"{patient.first_name} {patient.last_name}".strip()
    address_uz = "Toshkent sh., Yunusobod tumani." if address == "г. Ташкент, Юнусабадский район." else address
    if reminder_minutes >= 1440:
        duration = f"{reminder_minutes // 1440} kun"
    elif reminder_minutes >= 60:
        duration = f"{reminder_minutes // 60} soat"
    else:
        duration = f"{reminder_minutes} daqiqa"

    return f"""🦷 Shark Denta

Assalomu alaykum, {name}!

Sizning qabulingiz boshlanishiga {duration} qoldi.

📅 {date}
🕐 {time_str}

📍 Manzil: {address_uz}

Sizni kutamiz!

Hurmat bilan,
Shark Denta"""


def get_birthday_message(patient) -> str:
    # Принудительно используем узбекский язык для всех SMS поздравлений.
    name = f"{patient.first_name} {patient.last_name}".strip()

    return f"""🎉 Shark Denta

Assalomu alaykum, {name}!

Tug'ilgan kuningiz bilan tabriklaymiz!

Sizga sog'liq va baxt tilaymiz.

🎁 Sovg'a sifatida bepul shifokor konsultatsiyasi taqdim etiladi.

Hurmat bilan,
Shark Denta"""
