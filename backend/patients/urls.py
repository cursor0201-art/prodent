from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, DentalRecordViewSet, PatientFileViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'records', DentalRecordViewSet)
router.register(r'files', PatientFileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
