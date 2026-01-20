"""
API views for crowdsourced quality reporting.

This module provides ViewSets for crowd flag operations with automatic
user association and patient/pharmacist permissions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import CrowdFlag
from .serializers import CrowdFlagSerializer
from accounts.permissions import IsPatientOrPharmacist


@extend_schema_view(
    list=extend_schema(
        summary="List all crowd flags",
        description="Retrieve quality reports with comprehensive filtering options including severity level.",
        tags=['Flags'],
        parameters=[
            OpenApiParameter(
                name='resolved',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by resolution status',
                examples=[
                    OpenApiExample('Unresolved Only', value='false'),
                    OpenApiExample('Resolved Only', value='true'),
                ]
            ),
            OpenApiParameter(
                name='severity',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by severity level (impacts trust score)',
                examples=[
                    OpenApiExample('Critical Issues', value='CRITICAL'),
                    OpenApiExample('High Priority', value='HIGH'),
                    OpenApiExample('Medium Priority', value='MEDIUM'),
                    OpenApiExample('Low Priority', value='LOW'),
                ]
            ),
            OpenApiParameter(
                name='issue_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by issue type (case-insensitive)',
                examples=[
                    OpenApiExample('Counterfeits', value='Counterfeit Suspected'),
                    OpenApiExample('Quality Issues', value='Quality Issue'),
                ]
            ),
            OpenApiParameter(
                name='reporter_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by reporter type'
            ),
            OpenApiParameter(
                name='lot',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter by lot manifest ID'
            ),
            OpenApiParameter(
                name='my_flags',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Show only flags created by current user',
                examples=[
                    OpenApiExample('My Flags Only', value='true'),
                ]
            ),
        ],
    ),
    retrieve=extend_schema(
        summary="Retrieve crowd flag details",
        description="Get detailed information about a specific quality report including severity and resolution status.",
        tags=['Flags'],
    ),
    create=extend_schema(
        summary="Create new crowd flag",
        description="""
        Submit a quality report with severity categorization.
        
        **Severity Levels & Trust Score Impact:**
        - CRITICAL: -15.00 points (counterfeits, safety hazards)
        - HIGH: -10.00 points (significant quality issues)
        - MEDIUM: -5.00 points (notable concerns) [DEFAULT]
        - LOW: -2.00 points (minor issues)
        
        **Auto-Populated Fields:**
        - `user`: Automatically set to authenticated user (DO NOT include!)
        - `created_at`: Auto-timestamp
        - `is_resolved`: Defaults to false
        
        **Side Effect:**
        ⚠️ Automatically decreases lot trust_score in REAL-TIME based on severity!
        
        **DO NOT include** the `user` field in your request!
        """,
        tags=['Flags'],
        examples=[
            OpenApiExample(
                'Critical - Counterfeit Suspected',
                value={
                    "reporter_type": "Pharmacist",
                    "issue_type": "Counterfeit Suspected",
                    "severity": "CRITICAL",
                    "description": "Fake hologram detected, packaging differs from authentic batches. Seal appears professionally resealed.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7"
                },
                request_only=True,
            ),
            OpenApiExample(
                'High - Quality Issue',
                value={
                    "reporter_type": "Pharmacist",
                    "issue_type": "Quality Issue",
                    "severity": "HIGH",
                    "description": "Tablets are discolored and crumbling. Unusual odor detected.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Medium - Packaging Damage',
                value={
                    "reporter_type": "Patient",
                    "issue_type": "Packaging Damage",
                    "severity": "MEDIUM",
                    "description": "Seal appears tampered with, but contents seem intact.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Low - Minor Issue',
                value={
                    "reporter_type": "Patient",
                    "issue_type": "Minor Issue",
                    "severity": "LOW",
                    "description": "Label slightly faded but still readable. No quality concerns.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7"
                },
                request_only=True,
            ),
        ],
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
            severity (str): Filter by severity level (CRITICAL, HIGH, MEDIUM, LOW)
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
        
        # Filter by severity if param provided
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity.upper())
        
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
        description="""
        Mark a quality report as resolved after investigation.
        
        **Side Effect:**
        ⚠️ Automatically recalculates lot trust_score in REAL-TIME!
        The trust score will INCREASE as this flag is no longer counted in penalties.
        
        **No request body required** - Just POST to this endpoint.
        
        Typically used by administrators after investigation.
        """,
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
        description="""
        Mark a quality report as unresolved (reopen a resolved issue).
        
        **Side Effect:**
        ⚠️ Automatically recalculates lot trust_score in REAL-TIME!
        The trust score will DECREASE as this flag is now counted in penalties again.
        
        **No request body required** - Just POST to this endpoint.
        
        Used to reopen resolved issues if new information emerges.
        """,
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
