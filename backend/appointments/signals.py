from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Appointment, ServiceMaterialNorm
from inventory.models import MaterialLog

import logging
logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Appointment)
def auto_deduct_materials_on_completion(sender, instance, **kwargs):
    """
    При переключении статуса записи в COMPLETED автоматически списываем
    материалы со склада на основе норм расхода (ServiceMaterialNorm).
    """
    if not instance.pk:
        return  # Новая запись — пропускаем

    try:
        old_instance = Appointment.objects.get(pk=instance.pk)
    except Appointment.DoesNotExist:
        return

    # Только при переходе в COMPLETED из другого статуса
    if old_instance.status != 'COMPLETED' and instance.status == 'COMPLETED':
        if not instance.service:
            return

        norms = ServiceMaterialNorm.objects.filter(service=instance.service).select_related('material')

        for norm in norms:
            try:
                MaterialLog.objects.create(
                    material=norm.material,
                    change_qty=-norm.quantity,  # Отрицательное — расход
                    log_type='CONSUMPTION',
                    description=f"Авто-списание: услуга «{instance.service.name_ru}» для пациента {instance.patient}",
                    created_by=instance.doctor if hasattr(instance.doctor, 'pk') else None
                )
                logger.info(
                    f"Авто-списание: {norm.material.name} × {norm.quantity} "
                    f"для услуги {instance.service.name_ru}"
                )
            except Exception as e:
                logger.error(f"Ошибка при авто-списании материала {norm.material.name}: {e}")
