from rest_framework import serializers
from .models import CrowdFlag


class CrowdFlagSerializer(serializers.ModelSerializer):
    """Serializer for the CrowdFlag model."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    lot_batch_number = serializers.CharField(source='lot.batch_number', read_only=True)
    
    class Meta:
        model = CrowdFlag
        fields = [
            'id', 'reporter_type', 'issue_type', 'severity', 'description', 
            'user', 'user_username', 'lot', 'lot_batch_number', 
            'created_at', 'is_resolved'
        ]
        read_only_fields = ['id', 'user', 'created_at']

