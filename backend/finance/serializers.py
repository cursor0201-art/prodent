from rest_framework import serializers
from .models import Transaction, Debt
from patients.serializers import PatientSerializer
from users.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    employee_detail = UserSerializer(source='employee', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at')

    def create(self, validated_data):
        # Automatically assign the logged-in user as the creator
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class DebtSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Debt
        fields = '__all__'
        read_only_fields = ('id', 'updated_at', 'remaining_amount')
