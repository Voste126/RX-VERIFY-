"""
API views for user account management.

This module provides ViewSets for user CRUD operations with JWT authentication.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import User
from .serializers import UserSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List all users",
        description="Retrieve a paginated list of all registered users in the system.",
        tags=['Users'],
    ),
    retrieve=extend_schema(
        summary="Retrieve user details",
        description="Get detailed information about a specific user by their ID.",
        tags=['Users'],
    ),
    create=extend_schema(
        summary="Create new user",
        description="Register a new user account. This endpoint allows public registration.",
        tags=['Users'],
    ),
    update=extend_schema(
        summary="Update user",
        description="Update all fields of an existing user account.",
        tags=['Users'],
    ),
    partial_update=extend_schema(
        summary="Partially update user",
        description="Update specific fields of an existing user account.",
        tags=['Users'],
    ),
    destroy=extend_schema(
        summary="Delete user",
        description="Permanently delete a user account from the system.",
        tags=['Users'],
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user account management.
    
    Provides CRUD operations for User model with the following features:
    - List all users (paginated)
    - Retrieve individual user details
    - Create new user accounts
    - Update user information
    - Delete user accounts
    - Get current user profile
    
    Permissions:
    - List, Retrieve, Update, Delete: Requires authentication
    - Create: Public access for user registration
    """
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Override permissions based on the action.
        
        Allow public access for user creation (registration),
        require authentication for all other operations.
        """
        if self.action == 'create':
            # Allow public user registration
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @extend_schema(
        summary="Get current user profile",
        description="Retrieve the profile information of the currently authenticated user.",
        tags=['Users'],
        responses={200: UserSerializer},
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the profile of the currently authenticated user.
        
        Returns:
            Response: Serialized user data of the authenticated user
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
