"""
API views for crowdsourced quality reporting.

This module provides ViewSets for crowd flag operations with automatic
user association and patient/pharmacist permissions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import CrowdFlag
from .serializers import CrowdFlagSerializer
from accounts.permissions import IsPatientOrPharmacist


@extend_schema_view(
    list=extend_schema(
        summary="List all crowd flags",
        description="Retrieve a paginated list of quality reports and flags with filtering options.",
        tags=['Flags'],
    ),
    retrieve=extend_schema(
        summary="Retrieve crowd flag details",
        description="Get detailed information about a specific quality report.",
        tags=['Flags'],
    ),
    create=extend_schema(
        summary="Create new crowd flag",
        description="Submit a new quality report or flag. Automatically associates the authenticated user. Patients and pharmacists can create flags.",
        tags=['Flags'],
    ),
    update=extend_schema(
        summary="Update crowd flag",
        description="Update all fields of an existing quality report.",
        tags=['Flags'],
    ),
    partial_update=extend_schema(
        summary="Partially update crowd flag",
        description="Update specific fields of a quality report.",
        tags=['Flags'],
    ),
    destroy=extend_schema(
        summary="Delete crowd flag",
        description="Permanently delete a quality report from the system.",
        tags=['Flags'],
    ),
)
class CrowdFlagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for crowdsourced quality reporting.
    
    Provides CRUD operations for CrowdFlag model with the following features:
    - List all crowd flags (paginated)
    - Retrieve individual flag details
    - Create new flags (patients and pharmacists)
    - Update flag information
    - Delete flags
    - Automatic user association with authenticated user
    - Filter by resolution status, issue type, reporter type
    - Search by description
    
    Permissions:
    - All operations: Patients and pharmacists can access
    - User field is automatically set to request.user on creation
    """
    
    queryset = CrowdFlag.objects.all().select_related('user', 'lot')
    serializer_class = CrowdFlagSerializer
    permission_classes = [IsPatientOrPharmacist]
    
    # Enable search by description and issue type
    search_fields = ['description', 'issue_type']
    # Enable ordering
    ordering_fields = ['created_at', 'issue_type', 'is_resolved']
    ordering = ['-created_at']  # Default ordering (newest first)
    
    def get_queryset(self):
        """
        Optionally filter crowd flags by various criteria.
        
        Query params:
            resolved (bool): Filter by resolution status
            issue_type (str): Filter by issue type
            reporter_type (str): Filter by reporter type
            lot (uuid): Filter by lot manifest ID
            my_flags (bool): Filter to show only current user's flags
        
        Returns:
            QuerySet: Filtered crowd flag queryset
        """
        queryset = super().get_queryset()
        
        # Filter by resolution status if param provided
        resolved = self.request.query_params.get('resolved', None)
        if resolved is not None:
            resolved_bool = resolved.lower() == 'true'
            queryset = queryset.filter(is_resolved=resolved_bool)
        
        # Filter by issue type if param provided
        issue_type = self.request.query_params.get('issue_type', None)
        if issue_type:
            queryset = queryset.filter(issue_type__icontains=issue_type)
        
        # Filter by reporter type if param provided
        reporter_type = self.request.query_params.get('reporter_type', None)
        if reporter_type:
            queryset = queryset.filter(reporter_type__icontains=reporter_type)
        
        # Filter by lot if param provided
        lot_id = self.request.query_params.get('lot', None)
        if lot_id:
            queryset = queryset.filter(lot_id=lot_id)
        
        # Filter to show only current user's flags if requested
        my_flags = self.request.query_params.get('my_flags', None)
        if my_flags and my_flags.lower() == 'true':
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Override create to automatically associate the authenticated user.
        
        The user field is set to the current authenticated user
        and cannot be manually specified in the request data.
        
        Args:
            serializer: The CrowdFlagSerializer instance
        """
        # Automatically set the user to the authenticated user
        serializer.save(user=self.request.user)
    
    @extend_schema(
        summary="Mark flag as resolved",
        description="Mark a quality report as resolved. Typically used by administrators.",
        tags=['Flags'],
        responses={200: CrowdFlagSerializer},
    )
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Custom action to mark a crowd flag as resolved.
        
        Args:
            request: The HTTP request object
            pk: The primary key (UUID) of the crowd flag to resolve
        
        Returns:
            Response: Updated crowd flag data with is_resolved=True
        """
        crowd_flag = self.get_object()
        crowd_flag.is_resolved = True
        crowd_flag.save()
        
        serializer = self.get_serializer(crowd_flag)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="Mark flag as unresolved",
        description="Mark a quality report as unresolved. Used to reopen resolved issues.",
        tags=['Flags'],
        responses={200: CrowdFlagSerializer},
    )
    @action(detail=True, methods=['post'])
    def unresolve(self, request, pk=None):
        """
        Custom action to mark a crowd flag as unresolved.
        
        Args:
            request: The HTTP request object
            pk: The primary key (UUID) of the crowd flag to unresolve
        
        Returns:
            Response: Updated crowd flag data with is_resolved=False
        """
        crowd_flag = self.get_object()
        crowd_flag.is_resolved = False
        crowd_flag.save()
        
        serializer = self.get_serializer(crowd_flag)
        return Response(serializer.data, status=status.HTTP_200_OK)
