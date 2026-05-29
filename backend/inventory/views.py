from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material, MaterialLog
from .serializers import MaterialSerializer, MaterialLogSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('name')
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'sku']

class MaterialLogViewSet(viewsets.ModelViewSet):
    queryset = MaterialLog.objects.all().order_by('-created_at')
    serializer_class = MaterialLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['material', 'log_type']
