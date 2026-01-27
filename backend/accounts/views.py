"""
API views for user account management.

This module provides ViewSets for user CRUD operations with JWT authentication.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import User
from .serializers import UserSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List all users",
        description="Retrieve a paginated list of all registered users with optional role filtering.",
        tags=['Users'],
        parameters=[
            OpenApiParameter(
                name='role',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter users by role',
                examples=[
                    OpenApiExample('Pharmacists Only', value='PHARMACIST'),
                    OpenApiExample('Patients Only', value='PATIENT'),
                    OpenApiExample('Regulators Only', value='REGULATOR'),
                ]
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Retrieve user details",
        description="Get detailed information about a specific user including role and contact information.",
        tags=['Users'],
    ),
    create=extend_schema(
        summary="Create new user",
        description="""
        Register a new user account with role-based access.
        
        **Available Roles:**
        - PATIENT: Can view products, create quality flags
        - PHARMACIST: Can receive lots, create flags, view receipt events
        - REGULATOR: Full read access (future use)
        
        **Public endpoint** - No authentication required for registration.
        """,
        tags=['Users'],
        examples=[
            OpenApiExample(
                'Pharmacist Registration',
                value={
                    "username": "pharmacist1",
                    "email": "pharmacist@example.com",
                    "password": "SecurePass123!",
                    "role": "PHARMACIST",
                },
                request_only=True,
            ),
            OpenApiExample(
                'Patient Registration',
                value={
                    "username": "patient1",
                    "email": "patient@example.com",
                    "password": "SecurePass123!",
                    "role": "PATIENT",
                },
                request_only=True,
            ),
        ],
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
        description="""
        Retrieve the profile information of the currently authenticated user.
        
        Useful for:
        - Displaying user info in the app
        - Checking current user's role
        - Getting user ID for other operations
        """,
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


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    PatientRegistrationSerializer,
    PharmacistRegistrationSerializer,
    DistributorRegistrationSerializer
)


@extend_schema(
    summary="Patient Registration",
    description="Register a new patient account. Role is automatically set to Patient.",
    tags=['Authentication'],
    request=PatientRegistrationSerializer,
    responses={201: UserSerializer},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def patient_register(request):
    """Public endpoint for patient registration."""
    serializer = PatientRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Patient account created successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Pharmacist Registration",
    description="Register a new pharmacist account. Role is automatically set to Pharmacist. License verification pending.",
    tags=['Authentication'],
    request=PharmacistRegistrationSerializer,
    responses={201: UserSerializer},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def pharmacist_register(request):
    """Public endpoint for pharmacist registration."""
    serializer = PharmacistRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Pharmacist account created successfully (pending license verification)',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Distributor Registration",
    description="Register a new distributor account. Role is automatically set to Distributor. Company verification pending.",
    tags=['Authentication'],
    request=DistributorRegistrationSerializer,
    responses={201: UserSerializer},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def distributor_register(request):
    """Public endpoint for distributor registration."""
    serializer = DistributorRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Distributor account created successfully (pending company verification)',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Logout",
    description="Logout the current user by blacklisting their refresh token.",
    tags=['Authentication'],
    request={'refresh_token': 'string'},
    responses={200: {'message': 'string'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint - blacklists refresh token."""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
