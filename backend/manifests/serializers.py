from rest_framework import serializers
from .models import LotManifest


class LotManifestSerializer(serializers.ModelSerializer):
    """Serializer for the LotManifest model."""
    
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    
    class Meta:
        model = LotManifest
        fields = [
            'id', 'batch_number', 'expiry_date', 'digital_signature', 
            'trust_score', 'medicine', 'medicine_name', 'distributor', 
            'distributor_name'
        ]
        read_only_fields = ['id']
