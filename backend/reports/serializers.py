from rest_framework import serializers
from .models import CrowdFlag


class CrowdFlagSerializer(serializers.ModelSerializer):
    """
    Serializer for the CrowdFlag / Incident Report model.

    Read-only computed fields:
      - user_username, lot_batch_number (from related objects)
      - is_resolved (backward-compatible property)

    Admin-only writable fields (status, investigator_notes) are enforced
    at the view layer via dedicated lifecycle action endpoints.
    """

    user_username = serializers.CharField(source='user.username', read_only=True)
    lot_batch_number = serializers.CharField(source='lot.batch_number', read_only=True)
    is_resolved = serializers.BooleanField(read_only=True)

    class Meta:
        model = CrowdFlag
        fields = [
            'id', 'reporter_type', 'issue_type', 'severity', 'description',
            'latitude', 'longitude', 'region',
            'user', 'user_username', 'lot', 'lot_batch_number',
            'created_at', 'is_resolved',
            # New lifecycle fields
            'status', 'dispensing_pharmacy_name', 'date_of_purchase',
            'evidence_image', 'investigator_notes',
        ]
        read_only_fields = [
            'id', 'user', 'created_at',
            'status', 'investigator_notes',
        ]
