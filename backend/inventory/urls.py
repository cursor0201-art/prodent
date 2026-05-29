from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, MaterialLogViewSet

router = DefaultRouter()
router.register(r'materials', MaterialViewSet)
router.register(r'logs', MaterialLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
