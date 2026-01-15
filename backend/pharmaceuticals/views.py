"""
API views for medicine catalog management.

This module provides ViewSets for medicine CRUD operations with filtering and search capabilities.
"""
from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Medicine
from .serializers import MedicineSerializer
from accounts.permissions import IsAdminOrReadOnly


@extend_schema_view(
    list=extend_schema(
        summary="List all medicines",
        description="Retrieve a paginated list of medicines with filtering by category and distributor.",
        tags=['Medicines'],
    ),
    retrieve=extend_schema(
        summary="Retrieve medicine details",
        description="Get detailed information about a specific medicine including distributor information.",
        tags=['Medicines'],
    ),
    create=extend_schema(
        summary="Create new medicine",
        description="Add a new medicine to the catalog. Requires admin role.",
        tags=['Medicines'],
    ),
    update=extend_schema(
        summary="Update medicine",
        description="Update all fields of an existing medicine. Requires admin role.",
        tags=['Medicines'],
    ),
    partial_update=extend_schema(
        summary="Partially update medicine",
        description="Update specific fields of a medicine. Requires admin role.",
        tags=['Medicines'],
    ),
    destroy=extend_schema(
        summary="Delete medicine",
        description="Permanently delete a medicine from the catalog. Requires admin role.",
        tags=['Medicines'],
    ),
)
class MedicineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for medicine catalog management.
    
    Provides CRUD operations for Medicine model with the following features:
    - List all medicines (paginated)
    - Retrieve individual medicine details
    - Create new medicines (admin only)
    - Update medicine information (admin only)
    - Delete medicines (admin only)
    - Filter by category and distributor
    - Search by name
    
    Permissions:
    - Read: All authenticated users
    - Write (Create, Update, Delete): Admin users only
    """
    
    queryset = Medicine.objects.all().select_related('distributor')
    serializer_class = MedicineSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Enable search by medicine name and category
    search_fields = ['name', 'category']
    # Enable ordering
    ordering_fields = ['name', 'category']
    ordering = ['name']  # Default ordering
    
    def get_queryset(self):
        """
        Optionally filter medicines by category or distributor.
        
        Query params:
            category (str): Filter by medicine category
                         Example: ?category=Antibiotic
            distributor (uuid): Filter by distributor ID
                              Example: ?distributor=123e4567-e89b-12d3-a456-426614174000
        
        Returns:
            QuerySet: Filtered medicine queryset
        """
        queryset = super().get_queryset()
        
        # Filter by category if param provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Filter by distributor if param provided
        distributor_id = self.request.query_params.get('distributor', None)
        if distributor_id:
            queryset = queryset.filter(distributor_id=distributor_id)
        
        return queryset
