from rest_framework import serializers
from .models import Distributor


class DistributorSerializer(serializers.ModelSerializer):
    """Serializer for the Distributor model."""
    
    class Meta:
        model = Distributor
        fields = ['id', 'name', 'public_key', 'is_verified_regulator']
        read_only_fields = ['id']
