from rest_framework import serializers
from .models import ReceiptEvent


class ReceiptEventSerializer(serializers.ModelSerializer):
    """Serializer for the ReceiptEvent model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    lot_batch_number = serializers.CharField(source='lot.batch_number', read_only=True)
    
    class Meta:
        model = ReceiptEvent
        fields = [
            'id', 'location_coord', 'user', 'user_username', 
            'lot', 'lot_batch_number', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
