from rest_framework import serializers
from .models import Medicine


class MedicineSerializer(serializers.ModelSerializer):
    """Serializer for the Medicine model with detailed pharmaceutical information."""
    
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    
    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'category', 'active_ingredient', 
            'strength', 'dosage_form', 'manufacturer_name',
            'distributor', 'distributor_name'
        ]
        read_only_fields = ['id']

