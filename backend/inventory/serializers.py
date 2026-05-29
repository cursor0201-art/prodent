from rest_framework import serializers
from .models import Material, MaterialLog
from users.serializers import UserSerializer

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class MaterialLogSerializer(serializers.ModelSerializer):
    material_detail = MaterialSerializer(source='material', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = MaterialLog
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at')

    def create(self, validated_data):
        # Automatically assign the logged-in user as the creator
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
