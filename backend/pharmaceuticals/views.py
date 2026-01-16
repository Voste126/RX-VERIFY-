"""
API views for medicine catalog management.

This module provides ViewSets for medicine CRUD operations with filtering and search capabilities.
"""
from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Medicine
from .serializers import MedicineSerializer
from accounts.permissions import IsAdminOrReadOnly


@extend_schema_view(
    list=extend_schema(
        summary="List all medicines",
        description="""
        Retrieve a paginated list of pharmaceutical medicines with detailed information.
        
        Supports filtering by:
        - Category (e.g., Antibiotic, Antimalarial)
        - Distributor ID
        - Search by name, active ingredient, or manufacturer
        """,
        tags=['Medicines'],
        parameters=[
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by medicine category (case-insensitive)',
                examples=[
                    OpenApiExample('Antibiotic', value='Antibiotic'),
                    OpenApiExample('Antimalarial', value='Antimalarial'),
                ]
            ),
            OpenApiParameter(
                name='distributor',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter by distributor UUID'
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search by name, active ingredient, or manufacturer'
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Retrieve medicine details",
        description="""
        Get detailed information about a specific medicine including:
        - Product name and active ingredient
        - Strength and dosage form
        - Manufacturer details
        - Distributor information
        """,
        tags=['Medicines'],
    ),
    create=extend_schema(
        summary="Create new medicine",
        description="""
        Add a new pharmaceutical medicine to the catalog.
        
        **Required fields:**
        - name: Product name
        - active_ingredient: Generic/API name
        - strength: Drug strength (e.g., 500mg)
        - dosage_form: Form (Tablet, Capsule, Syrup, etc.)
        - manufacturer_name: Manufacturing company
        - distributor: Distributor UUID
        
        **Requires admin role.**
        """,
        tags=['Medicines'],
        examples=[
            OpenApiExample(
                'Paracetamol Tablet',
                value={
                    "name": "Paracetamol Tablets",
                    "active_ingredient": "Paracetamol",
                    "strength": "500mg",
                    "dosage_form": "Tablet",
                    "manufacturer_name": "Universal Corporation Ltd",
                    "category": "Analgesic",
                    "distributor": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Amoxicillin Capsule',
                value={
                    "name": "Amoxicillin Capsules",
                    "active_ingredient": "Amoxicillin",
                    "strength": "250mg",
                    "dosage_form": "Capsule",
                    "manufacturer_name": "PharmaCorp Kenya",
                    "category": "Antibiotic",
                    "distributor": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Artemether Combination',
                value={
                    "name": "Coartem Tablets",
                    "active_ingredient": "Artemether + Lumefantrine",
                    "strength": "20mg/120mg",
                    "dosage_form": "Tablet",
                    "manufacturer_name": "Novartis East Africa",
                    "category": "Antimalarial",
                    "distributor": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(
        summary="Update medicine",
        description="""
        Update all fields of an existing medicine.
        
        All fields must be provided (use PATCH for partial updates).
        Requires admin role.
        """,
        tags=['Medicines'],
    ),
    partial_update=extend_schema(
        summary="Partially update medicine",
        description="""
        Update specific fields of a medicine without providing all fields.
        
        Useful for updating just the strength, manufacturer, or other specific attributes.
        Requires admin role.
        """,
        tags=['Medicines'],
        examples=[
            OpenApiExample(
                'Update Strength',
                value={
                    "strength": "1000mg"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Update Manufacturer',
                value={
                    "manufacturer_name": "GlaxoSmithKline Kenya"
                },
                request_only=True,
            ),
        ],
    ),
    destroy=extend_schema(
        summary="Delete medicine",
        description="""
        Permanently delete a medicine from the catalog.
        
        **Warning:** This will also affect any lot manifests referencing this medicine.
        Requires admin role.
        """,
        tags=['Medicines'],
    ),
)
class MedicineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for pharmaceutical medicine catalog management.
    
    Provides CRUD operations for Medicine model with the following features:
    - List all medicines (paginated)
    - Retrieve individual medicine details with:
      * Active ingredient information
      * Strength and dosage form
      * Manufacturer details
      * Distributor information
    - Create new medicines (admin only)
    - Update medicine information (admin only)
    - Delete medicines (admin only)
    - Filter by category and distributor
    - Search by name, active ingredient, or manufacturer
    
    Permissions:
    - Read: All authenticated users
    - Write (Create, Update, Delete): Admin users only
    """
    
    queryset = Medicine.objects.all().select_related('distributor')
    serializer_class = MedicineSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Enable search by medicine name, active ingredient, and manufacturer
    search_fields = ['name', 'active_ingredient', 'manufacturer_name', 'category']
    # Enable ordering
    ordering_fields = ['name', 'category', 'active_ingredient', 'strength']
    ordering = ['name']  # Default ordering
    
    def get_queryset(self):
        """
        Optionally filter medicines by category or distributor.
        
        Query params:
            category (str): Filter by medicine category (case-insensitive)
                          Example: ?category=Antibiotic
            distributor (uuid): Filter by distributor ID
                               Example: ?distributor=123e4567-e89b-12d3-a456-426614174000
            search (str): Search across name, active ingredient, manufacturer
                         Example: ?search=Paracetamol
        
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

