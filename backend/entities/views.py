"""
API views for distributor management.

This module provides ViewSets for distributor CRUD operations with filtering capabilities.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Distributor
from .serializers import DistributorSerializer
from accounts.permissions import IsAdminOrReadOnly


@extend_schema_view(
    list=extend_schema(
        summary="List all distributors",
        description="Retrieve a paginated list of pharmaceutical distributors with filtering options.",
        tags=['Distributors'],
    ),
    retrieve=extend_schema(
        summary="Retrieve distributor details",
        description="Get detailed information about a specific distributor including verification status.",
        tags=['Distributors'],
    ),
    create=extend_schema(
        summary="Create new distributor",
        description="Register a new pharmaceutical distributor. Requires admin role.",
        tags=['Distributors'],
    ),
    update=extend_schema(
        summary="Update distributor",
        description="Update all fields of an existing distributor. Requires admin role.",
        tags=['Distributors'],
    ),
    partial_update=extend_schema(
        summary="Partially update distributor",
        description="Update specific fields of a distributor. Requires admin role.",
        tags=['Distributors'],
    ),
    destroy=extend_schema(
        summary="Delete distributor",
        description="Permanently delete a distributor from the system. Requires admin role.",
        tags=['Distributors'],
    ),
)
class DistributorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for pharmaceutical distributor management.
    
    Provides CRUD operations for Distributor model with the following features:
    - List all distributors (paginated)
    - Retrieve individual distributor details
    - Create new distributors (admin only)
    - Update distributor information (admin only)
    - Delete distributors (admin only)
    - Filter by verification status
    - Search by name
    
    Permissions:
    - Read: All authenticated users
    - Write (Create, Update, Delete): Admin users only
    """
    
    queryset = Distributor.objects.all()
    serializer_class = DistributorSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Enable search by distributor name
    search_fields = ['name']
    # Enable ordering by name and verification status
    ordering_fields = ['name', 'is_verified_regulator']
    ordering = ['name']  # Default ordering
    
    def get_queryset(self):
        """
        Optionally filter distributors by verification status.
        
        Query params:
            verified (bool): Filter by verification status
                           Example: ?verified=true
        
        Returns:
            QuerySet: Filtered distributor queryset
        """
        queryset = super().get_queryset()
        
        # Filter by verification status if param provided
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            verified_bool = verified.lower() == 'true'
            queryset = queryset.filter(is_verified_regulator=verified_bool)
        
        return queryset
