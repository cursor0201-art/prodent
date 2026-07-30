from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material, MaterialLog
from .serializers import MaterialSerializer, MaterialLogSerializer

import logging
logger = logging.getLogger(__name__)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('name')
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'sku']

    def perform_create(self, serializer):
        material = serializer.save()
        user = self.request.user if hasattr(self.request, 'user') and self.request.user.is_authenticated else None
        
        # Create initial MaterialLog for warehouse operation history
        if material.quantity > 0:
            try:
                MaterialLog.objects.create(
                    material=material,
                    change_qty=material.quantity,
                    log_type=MaterialLog.LogType.RESTOCK,
                    description="Первичное добавление на склад",
                    created_by=user
                )
            except Exception as e:
                logger.error(f"Failed to create initial MaterialLog: {e}")

        # If material has initial quantity and price, record expense transaction
        if material.quantity > 0 and material.price_per_unit > 0:
            total_expense = material.quantity * material.price_per_unit
            try:
                from finance.models import Transaction
                Transaction.objects.create(
                    amount=total_expense,
                    transaction_type='EXPENSE',
                    payment_method='CASH',
                    description=f"Закупка материала (склад): {material.name} ({material.quantity} {material.unit})",
                    created_by=user
                )
            except Exception as e:
                logger.error(f"Failed to record material purchase expense: {e}")

class MaterialLogViewSet(viewsets.ModelViewSet):
    queryset = MaterialLog.objects.all().order_by('-created_at')
    serializer_class = MaterialLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['material', 'log_type']

    def perform_create(self, serializer):
        log = serializer.save(created_by=self.request.user if hasattr(self.request, 'user') and self.request.user.is_authenticated else None)
        # If log is RESTOCK with positive quantity, record expense transaction
        if log.log_type == MaterialLog.LogType.RESTOCK and log.change_qty > 0 and log.material.price_per_unit > 0:
            total_expense = log.change_qty * log.material.price_per_unit
            try:
                from finance.models import Transaction
                Transaction.objects.create(
                    amount=total_expense,
                    transaction_type='EXPENSE',
                    payment_method='CASH',
                    description=f"Пополнение склада: {log.material.name} (+{log.change_qty} {log.material.unit})",
                    created_by=self.request.user if hasattr(self.request, 'user') and self.request.user.is_authenticated else None
                )
            except Exception as e:
                logger.error(f"Failed to record material restock expense: {e}")
