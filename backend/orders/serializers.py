from rest_framework import serializers
from .models import SupplyOrder
from manifests.models import LotManifest
from entities.models import Distributor
from accounts.models import User
from pharmaceuticals.models import Medicine


class SupplyOrderSerializer(serializers.ModelSerializer):
    """Serializer for SupplyOrder with nested relationships."""
    
    pharmacist_name = serializers.CharField(source='pharmacist.username', read_only=True)
    pharmacist_pharmacy = serializers.CharField(source='pharmacist.pharmacy_name', read_only=True)
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    manifest_batch = serializers.CharField(source='manifest.batch_number', read_only=True, allow_null=True)
    manifest_trust_score = serializers.DecimalField(source='manifest.trust_score', max_digits=5, decimal_places=2, read_only=True, allow_null=True)
    
    class Meta:
        model = SupplyOrder
        fields = [
            'id',
            'pharmacist',
            'pharmacist_name',
            'pharmacist_pharmacy',
            'distributor',
            'distributor_name',
            'items',
            'status',
            'manifest',
            'manifest_batch',
            'manifest_trust_score',
            'delivery_token',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'pharmacist', 'delivery_token', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Ensure items are properly saved."""
        print(f"[SupplyOrderSerializer] Creating order with data: {validated_data}")
        print(f"[SupplyOrderSerializer] Items in validated_data: {validated_data.get('items')}")
        order = super().create(validated_data)
        print(f"[SupplyOrderSerializer] Order created with items: {order.items}")
        return order
    
    def to_representation(self, instance):
        """Enrich items with medicine names."""
        representation = super().to_representation(instance)
        
        # Enrich items with medicine details
        if representation.get('items'):
            enriched_items = []
            medicine_ids = [item.get('medicine_id') for item in representation['items'] if item.get('medicine_id')]
            
            # Fetch all medicines in one query
            medicines = Medicine.objects.filter(id__in=medicine_ids).values('id', 'name')
            medicine_dict = {str(m['id']): m['name'] for m in medicines}
            
            for item in representation['items']:
                medicine_id = item.get('medicine_id')
                enriched_item = item.copy()
                
                # Add medicine name if found
                if medicine_id and medicine_id in medicine_dict:
                    enriched_item['name'] = medicine_dict[medicine_id]
                
                enriched_items.append(enriched_item)
            
            representation['items'] = enriched_items
        
        return representation
    
    def validate_items(self, value):
        """Validate items structure."""
        print(f"[SupplyOrderSerializer] Validating items: {value}")
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Items must be a non-empty list")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each item must be a dictionary")
            if 'medicine_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Each item must have 'medicine_id' and 'quantity'")
        
        return value



class SupplyOrderListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    pharmacist_name = serializers.CharField(source='pharmacist.username', read_only=True)
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupplyOrder
        fields = [
            'id',
            'pharmacist_name',
            'distributor_name',
            'items_count',
            'status',
            'created_at',
        ]
    
    def get_items_count(self, obj):
        """Get total number of items in the order."""
        return len(obj.items) if obj.items else 0


class FulfillOrderSerializer(serializers.Serializer):
    """Serializer for order fulfillment input."""
    
    batch_number = serializers.CharField(max_length=100)
    expiry_date = serializers.DateField()
    medicine_id = serializers.UUIDField()
    
    def validate_batch_number(self, value):
        """Ensure batch number is unique."""
        if LotManifest.objects.filter(batch_number=value).exists():
            raise serializers.ValidationError(f"Batch number '{value}' already exists")
        return value


class VerifyReceiptSerializer(serializers.Serializer):
    """Serializer for receipt verification input."""
    
    scanned_uuid = serializers.UUIDField()
