from django.utils import formats

def get_registration_message(patient, date, time_str, address="г. Ташкент, Юнусабад 7 квартал 40 дом") -> str:
    lang = getattr(patient, 'language', 'ru')
    
    if lang == 'uz':
        return f"""🦷 Shark Denta

Assalomu alaykum,
{patient.first_name} {patient.last_name}!

Shark Denta stomatologiya klinikasini tanlaganingiz uchun rahmat.

Siz {date} kuni
{time_str} ga muvaffaqiyatli ro'yxatdan o'tdingiz.

📍 Manzil:
{address}

Agar rejalaringiz o'zgarsa,
iltimos bizga oldindan xabar bering.

Hurmat bilan,
Shark Denta"""
    
    # Default RU
    return f"""🦷 Shark Denta

Здравствуйте,
{patient.first_name} {patient.last_name}!

Благодарим за обращение
в стоматологическую клинику Shark Denta.

Вы успешно записаны
на {date}
в {time_str}.

📍 Адрес:
{address}

Если у Вас изменятся планы,
пожалуйста сообщите нам заранее.

С уважением,
Shark Denta"""

def get_reminder_message(patient, date, time_str, address="г. Ташкент, Юнусабад 7 квартал 40 дом") -> str:
    lang = getattr(patient, 'language', 'ru')
    
    if lang == 'uz':
        return f"""🦷 Shark Denta

Assalomu alaykum,
{patient.first_name} {patient.last_name}!

Qabulingiz boshlanishiga
1 soat qoldi.

📅 Sana:
{date}

🕒 Vaqt:
{time_str}

📍 Manzil:
{address}

10–15 daqiqa oldin kelishingizni tavsiya qilamiz.

Hurmat bilan,
Shark Denta"""

    # Default RU
    return f"""🦷 Shark Denta

Здравствуйте,
{patient.first_name} {patient.last_name}!

До Вашего приема
остался 1 час.

📅 Дата:
{date}

🕒 Время:
{time_str}

📍 Адрес:
{address}

Просим прийти за
10–15 минут до приема.

С уважением,
Shark Denta"""

def get_birthday_message(patient) -> str:
    lang = getattr(patient, 'language', 'ru')
    
    if lang == 'uz':
        return f"""🎉 Shark Denta

Hurmatli
{patient.first_name} {patient.last_name}!

Tug'ilgan kuningiz bilan tabriklaymiz!

Sizga mustahkam sog'liq
va yorqin tabassum tilaymiz.

🎁 Sovg'a sifatida
bepul shifokor konsultatsiyasi.

Hurmat bilan,
Shark Denta"""

    # Default RU
    return f"""🎉 Shark Denta

Уважаемый(ая)
{patient.first_name} {patient.last_name}!

Поздравляем Вас
с Днем рождения!

Желаем крепкого здоровья
и красивой улыбки.

🎁 В подарок
бесплатная консультация врача.

С уважением,
Shark Denta"""
