"""
API views for receipt event tracking.

This module provides ViewSets for receipt event operations with automatic
user association and role-based permissions.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import ReceiptEvent
from .serializers import ReceiptEventSerializer
from accounts.permissions import IsPharmacist


@extend_schema_view(
    list=extend_schema(
        summary="List all receipt events",
        description="Retrieve a paginated list of receipt events with filtering by user, lot, or date range.",
        tags=['Receipts'],
        parameters=[
            OpenApiParameter(
                name='user',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter by user (pharmacist) ID'
            ),
            OpenApiParameter(
                name='lot',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter by lot manifest ID'
            ),
            OpenApiParameter(
                name='date_from',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter events from this date onwards (YYYY-MM-DD)',
                examples=[
                    OpenApiExample('Start of Year', value='2026-01-01'),
                ]
            ),
            OpenApiParameter(
                name='date_to',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter events up to this date (YYYY-MM-DD)',
                examples=[
                    OpenApiExample('End of Month', value='2026-01-31'),
                ]
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Retrieve receipt event details",
        description="Get detailed information about a specific receipt event including location coordinates and lot details.",
        tags=['Receipts'],
    ),
    create=extend_schema(
        summary="Create new receipt event",
        description="""
        Record a new receipt event when a pharmacist receives a pharmaceutical lot.
        
        **Auto-Populated Fields:**
        - `user`: Automatically set to authenticated pharmacist (DO NOT include this field!)
        - `created_at`: Auto-timestamp
        
        **Location Format:**
        - Provide GPS coordinates as JSON: {"lat": latitude, "lng": longitude}
        - Latitude: -90 to 90 (negative = South)
        - Longitude: -180 to 180 (negative = West)
        
        **Immutability:**
        Receipt events are audit logs and CANNOT be updated or deleted after creation.
        
        **Pharmacist-only access.**
        """,
        tags=['Receipts'],
        examples=[
            OpenApiExample(
                'Receipt at Nairobi Pharmacy',
                value={
                    "location_coord": {
                        "lat": -1.2921,
                        "lng": 36.8219
                    },
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Receipt at Mombasa Pharmacy',
                value={
                    "location_coord": {
                        "lat": -4.0435,
                        "lng": 39.6682
                    },
                    "lot": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Receipt at Kisumu Pharmacy',
                value={
                    "location_coord": {
                        "lat": -0.0917,
                        "lng": 34.7680
                    },
                    "lot": "f9e8d7c6-b5a4-4321-9876-fedcba098765"
                },
                request_only=True,
            ),
        ],
    ),
)
class ReceiptEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for receipt event tracking.
    
    Provides operations for ReceiptEvent model with the following features:
    - List all receipt events (paginated)
    - Retrieve individual receipt event details
    - Create new receipt events (pharmacists only)
    - Automatic user association with authenticated user
    - Filter by user, lot, and date
    - Search by location
    
    Permissions:
    - Create: Only pharmacists can create receipt events
    - Read: All authenticated users can view receipt events
    - Update/Delete: Not allowed (receipt events are immutable audit logs)
    
    Note: The user field is automatically set to request.user on creation
    and cannot be manually specified.
    """
    
    queryset = ReceiptEvent.objects.all().select_related('user', 'lot')
    serializer_class = ReceiptEventSerializer
    permission_classes = [IsPharmacist]
    
    # Only allow list, retrieve, and create operations
    # Receipt events are audit logs and should not be updated or deleted
    http_method_names = ['get', 'post', 'head', 'options']
    
    # Enable ordering by creation date
    ordering_fields = ['created_at']
    ordering = ['-created_at']  # Default ordering (newest first)
    
    def get_queryset(self):
        """
        Optionally filter receipt events by user or lot.
        
        Query params:
            user (uuid): Filter by user ID
            lot (uuid): Filter by lot manifest ID
            date_from (date): Filter events from this date onwards
            date_to (date): Filter events up to this date
        
        Returns:
            QuerySet: Filtered receipt event queryset
        """
        queryset = super().get_queryset()
        
        # Filter by user if param provided
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by lot if param provided
        lot_id = self.request.query_params.get('lot', None)
        if lot_id:
            queryset = queryset.filter(lot_id=lot_id)
        
        # Filter by date range if params provided
        date_from = self.request.query_params.get('date_from', None)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to', None)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Override create to automatically associate the authenticated user.
        
        The user field is set to the current authenticated user (pharmacist)
        and cannot be manually specified in the request data. This ensures
        data integrity and prevents user spoofing.
        
        Args:
            serializer: The ReceiptEventSerializer instance
        """
        # Automatically set the user to the authenticated user
        serializer.save(user=self.request.user)
