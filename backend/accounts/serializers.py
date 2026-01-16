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
