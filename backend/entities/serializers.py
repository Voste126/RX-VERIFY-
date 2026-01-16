from rest_framework import serializers
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from .models import Distributor


class DistributorSerializer(serializers.ModelSerializer):
    """
    Serializer for the Distributor model with automatic Ed25519 key generation.
    
    When creating a distributor without providing a public_key, the serializer will:
    1. Generate an Ed25519 key pair
    2. Store the public key in the database
    3. Return the private key in the response (for secure distribution to the vendor)
    
    The private_key is write-only and only appears in the creation response.
    """
    
    private_key = serializers.CharField(
        read_only=True,
        help_text="Ed25519 private key (hex) - Only returned on creation. Save this securely!"
    )
    
    class Meta:
        model = Distributor
        fields = ['id', 'name', 'public_key', 'private_key', 'is_verified_regulator']
        read_only_fields = ['id', 'public_key', 'private_key']
        extra_kwargs = {
            'public_key': {'required': False},
        }
    
    def create(self, validated_data):
        """
        Create a distributor with auto-generated Ed25519 key pair if not provided.
        
        Returns the distributor instance with a temporary 'private_key' attribute
        that will be serialized in the response.
        """
        # Check if public_key was provided
        if 'public_key' not in validated_data or not validated_data['public_key']:
            # Generate new Ed25519 key pair
            private_key = ed25519.Ed25519PrivateKey.generate()
            public_key = private_key.public_key()
            
            # Convert to hex strings for storage/transmission
            private_key_hex = private_key.private_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PrivateFormat.Raw,
                encryption_algorithm=serialization.NoEncryption()
            ).hex()
            
            public_key_hex = public_key.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            ).hex()
            
            # Store public key in validated data
            validated_data['public_key'] = public_key_hex
            
            # Create the distributor
            distributor = Distributor.objects.create(**validated_data)
            
            # Attach private key to instance (for serialization only, not saved to DB)
            distributor.private_key = private_key_hex
            
            return distributor
        else:
            # Public key was provided manually
            distributor = Distributor.objects.create(**validated_data)
            distributor.private_key = None  # No private key to return
            return distributor
    
    def to_representation(self, instance):
        """
        Customize representation to include private_key only if it exists.
        """
        representation = super().to_representation(instance)
        
        # Only include private_key if it was generated (during creation)
        if not hasattr(instance, 'private_key') or instance.private_key is None:
            representation.pop('private_key', None)
        
        return representation

