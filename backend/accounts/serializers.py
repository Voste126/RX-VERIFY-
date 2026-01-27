from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model with password handling.
    
    Includes password and password2 fields for registration/updates.
    Passwords are write-only and properly hashed using set_password().
    """
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        help_text="User password (min 8 characters)"
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Password confirmation"
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password2',
            'role', 'first_name', 'last_name', 'date_joined', 'is_active'
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
        }
    
    def validate(self, data):
        """
        Validate that password and password2 match.
        """
        if 'password' in data and 'password2' in data:
            if data['password'] != data['password2']:
                raise serializers.ValidationError({
                    "password2": "Password fields didn't match."
                })
        return data
    
    def create(self, validated_data):
        """
        Create a new user with properly hashed password.
        """
        # Remove password2 from validated data
        validated_data.pop('password2', None)
        
        # Extract password
        password = validated_data.pop('password')
        
        # Create user instance
        user = User(**validated_data)
        
        # Set password (this hashes it)
        user.set_password(password)
        
        # Save to database
        user.save()
        
        return user
    
    def update(self, instance, validated_data):
        """
        Update user, handling password updates if provided.
        """
        # Remove password fields if present
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        
        return instance


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Include user role and info in JWT token payload."""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['role'] = user.role
        token['username'] = user.username
        token['email'] = user.email
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': str(self.user.id),
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        
        return data


class PatientRegistrationSerializer(UserSerializer):
    """Serializer for patient registration - locks role to Patient."""
    
    class Meta(UserSerializer.Meta):
        fields = [
            'id', 'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'date_joined', 'is_active'
        ]
    
    def validate_role(self, value):
        """Ensure role is Patient."""
        if value and value != 'Patient':
            raise serializers.ValidationError("Patient registration must use Patient role.")
        return value
    
    def create(self, validated_data):
        """Force role to Patient."""
        validated_data['role'] = 'Patient'
        return super().create(validated_data)


class PharmacistRegistrationSerializer(UserSerializer):
    """Serializer for pharmacist registration with license validation."""
    
    license_number = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Pharmacist license number"
    )
    pharmacy_name = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Legal pharmacy name"
    )
    pharmacy_phone = serializers.CharField(
        max_length=20,
        required=False,
        help_text="Pharmacy phone number"
    )
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['license_number', 'pharmacy_name', 'pharmacy_phone']
    
    def validate_role(self, value):
        """Ensure role is Pharmacist."""
        if value and value != 'Pharmacist':
            raise serializers.ValidationError("Pharmacist registration must use Pharmacist role.")
        return value
    
    def create(self, validated_data):
        """Force role to Pharmacist and store license info."""
        validated_data['role'] = 'Pharmacist'
        # Fields are now stored in the User model
        return super().create(validated_data)


class DistributorRegistrationSerializer(UserSerializer):
    """Serializer for distributor registration with company validation."""
    
    company_name = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Distributor company name"
    )
    license_number = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Distribution license number"
    )
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['company_name', 'license_number']
    
    def validate_role(self, value):
        """Ensure role is Distributor."""
        if value and value != 'Distributor':
            raise serializers.ValidationError("Distributor registration must use Distributor role.")
        return value
    
    def create(self, validated_data):
        """Force role to Distributor and store company info."""
        validated_data['role'] = 'Distributor'
        # Fields are now stored in the User model
        return super().create(validated_data)

