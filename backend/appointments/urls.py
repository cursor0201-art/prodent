from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, AppointmentViewSet, ServiceMaterialNormViewSet,
    TreatmentPlanViewSet, TreatmentPlanItemViewSet
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'material-norms', ServiceMaterialNormViewSet)
router.register(r'treatment-plans', TreatmentPlanViewSet)
router.register(r'treatment-plan-items', TreatmentPlanItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
