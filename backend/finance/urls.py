from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, DebtViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'debts', DebtViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
