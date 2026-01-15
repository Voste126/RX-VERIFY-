"""
API views for receipt event tracking.

This module provides ViewSets for receipt event operations with automatic
user association and role-based permissions.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import ReceiptEvent
from .serializers import ReceiptEventSerializer
from accounts.permissions import IsPharmacist


@extend_schema_view(
    list=extend_schema(
        summary="List all receipt events",
        description="Retrieve a paginated list of receipt events with filtering options.",
        tags=['Receipts'],
    ),
    retrieve=extend_schema(
        summary="Retrieve receipt event details",
        description="Get detailed information about a specific receipt event including location data.",
        tags=['Receipts'],
    ),
    create=extend_schema(
        summary="Create new receipt event",
        description="Record a new receipt event. Automatically associates the authenticated pharmacist as the user. Only pharmacists can create receipt events.",
        tags=['Receipts'],
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
