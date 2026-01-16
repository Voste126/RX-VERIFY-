from rest_framework import serializers
from .models import LotManifest
import hashlib
import hmac
from nacl.signing import SigningKey


class LotManifestSerializer(serializers.ModelSerializer):
    """
    Serializer for LotManifest with AUTO-GENERATED Ed25519 signatures.
    
    UPDATABLE FIELDS:
    - batch_number: Lot/batch identifier
    - expiry_date: Medicine expiration date
    - medicine: Medicine ID
    - distributor: Distributor ID
    
    IMMUTABLE FIELDS (Auto-Managed):
    - digital_signature: ALWAYS auto-regenerated on create/update
    - trust_score: IMMUTABLE - cannot be changed after creation
    - is_authentic: Computed field (verification result)
    
    SECURITY:
    - Ed25519 signatures auto-generated using derived keys
    - No private keys stored in database
    """
    
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    distributor_name = serializers.CharField(source='distributor.name', read_only=True)
    is_authentic = serializers.SerializerMethodField(
        help_text="Boolean result of signature verification"
    )
    
    class Meta:
        model = LotManifest
        fields = [
            'id', 'batch_number', 'expiry_date', 'digital_signature', 
            'trust_score', 'medicine', 'medicine_name', 'distributor', 
            'distributor_name', 'is_authentic'
        ]
        # Immutable fields - cannot be updated by user
        read_only_fields = ['id', 'digital_signature', 'trust_score', 'is_authentic']
        extra_kwargs = {
            'digital_signature': {'required': False},
            'trust_score': {'required': False},
        }
    
    def _generate_ed25519_signature(self, lot_manifest):
        """
        Generate an Ed25519 signature for the lot manifest.
        
        Process:
        1. Derive a signing key from the distributor's public key
        2. Construct message: "{batch_number}:{expiry_date}:{distributor_id}"
        3. Sign the message with Ed25519
        4. Return hex-encoded signature
        
        Returns:
            str: 128-character hex signature
        """
        # Construct the message
        message = f"{lot_manifest.batch_number}:{lot_manifest.expiry_date.isoformat()}:{str(lot_manifest.distributor_id)}"
        
        # Derive a signing key from distributor's public key
        # Use the public key as seed material (deterministic)
        seed = bytes.fromhex(lot_manifest.distributor.public_key)[:32]  # Take first 32 bytes
        signing_key = SigningKey(seed)
        
        # Sign the message
        signed = signing_key.sign(message.encode('utf-8'))
        
        # Return hex-encoded signature
        return signed.signature.hex()
    
    def create(self, validated_data):
        """
        Create lot manifest with AUTO-GENERATED Ed25519 signature.
        
        Auto-Generation Process:
        1. Create lot manifest instance
        2. Generate Ed25519 signature automatically
        3. Set trust_score to 100.00 (immutable)
        4. Save and return
        """
        # Remove trust_score if provided (it's immutable)
        validated_data.pop('trust_score', None)
        
        # Create the lot manifest instance
        lot_manifest = LotManifest.objects.create(**validated_data)
        
        # AUTO-GENERATE Ed25519 signature
        lot_manifest.digital_signature = self._generate_ed25519_signature(lot_manifest)
        
        # Set trust_score to 100.00 (default from model)
        # This is set by model default, but we ensure it's correct
        if not lot_manifest.trust_score or lot_manifest.trust_score == 0:
            lot_manifest.trust_score = 100.00
        
        # Save with generated signature
        lot_manifest.save()
        
        return lot_manifest
    
    def update(self, instance, validated_data):
        """
        Update lot manifest with AUTOMATIC signature regeneration.
        
        BEHAVIOR:
        - Updatable fields: batch_number, expiry_date, medicine, distributor
        - trust_score: IMMUTABLE - ignored if provided
        - digital_signature: ALWAYS auto-regenerated after update
        
        Process:
        1. Remove immutable fields from validated_data
        2. Update allowed fields
        3. ALWAYS regenerate digital signature
        4. Save and return
        """
        # Remove immutable fields if somehow provided
        validated_data.pop('trust_score', None)
        validated_data.pop('digital_signature', None)
        
        # Update only allowed fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # ALWAYS regenerate signature on any update
        # This ensures signature matches current data
        instance.digital_signature = self._generate_ed25519_signature(instance)
        
        instance.save()
        
        return instance
    
    def get_is_authentic(self, obj):
        """
        Execute signature verification.
        
        Returns:
            bool: True if signature is valid, False otherwise
        """
        return obj.verify_signature()

