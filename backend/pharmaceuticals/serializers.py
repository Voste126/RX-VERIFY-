from rest_framework import serializers
from .models import Medicine


class MedicineSerializer(serializers.ModelSerializer):
    """Serializer for the Medicine model."""
    
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'category', 'distributor', 'distributor_name']
        read_only_fields = ['id']
