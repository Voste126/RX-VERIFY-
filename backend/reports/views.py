"""
API views for crowdsourced quality reporting / Incident Management.

This module provides ViewSets for crowd flag operations with automatic
user association, investigation lifecycle actions, and image upload support.
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import CrowdFlag
from .serializers import CrowdFlagSerializer
from accounts.permissions import IsAdminOrPatientOrPharmacist


# Terminal statuses — flags in these states are considered "resolved"
TERMINAL_STATUSES = ('RESOLVED', 'CLOSED_NO_ACTION')
ACTIVE_STATUSES = ('NEW', 'INVESTIGATING', 'ESCALATED_DISTRIBUTOR', 'ESCALATED_REGULATOR')


@extend_schema_view(
    list=extend_schema(
        summary="List all crowd flags",
        description="Retrieve quality reports with comprehensive filtering options including severity level and investigation status.",
        tags=['Flags'],
        parameters=[
            OpenApiParameter(
                name='resolved',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by resolution status (backward-compatible)',
                examples=[
                    OpenApiExample('Unresolved Only', value='false'),
                    OpenApiExample('Resolved Only', value='true'),
                ]
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by investigation status (comma-separated: NEW,INVESTIGATING,ESCALATED_DISTRIBUTOR,ESCALATED_REGULATOR,RESOLVED,CLOSED_NO_ACTION)',
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
                    OpenApiExample('Counterfeits', value='COUNTERFEIT'),
                    OpenApiExample('Quality Issues', value='QUALITY'),
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
        description="Get detailed information about a specific quality report including severity and investigation status.",
        tags=['Flags'],
    ),
    create=extend_schema(
        summary="Create new crowd flag / incident report",
        description="""
        Submit a quality report with severity categorization and optional evidence.

        **Severity Levels & Trust Score Impact:**
        - CRITICAL: -15.00 points (counterfeits, safety hazards)
        - HIGH: -10.00 points (significant quality issues)
        - MEDIUM: -5.00 points (notable concerns) [DEFAULT]
        - LOW: -2.00 points (minor issues)

        **Auto-Populated Fields:**
        - `user`: Automatically set to authenticated user (DO NOT include!)
        - `created_at`: Auto-timestamp
        - `status`: Defaults to NEW

        **Accepts multipart/form-data** for image uploads via `evidence_image`.

        **Side Effect:**
        ⚠️ Automatically decreases lot trust_score in REAL-TIME based on severity!

        **DO NOT include** the `user` field in your request!
        """,
        tags=['Flags'],
        examples=[
            OpenApiExample(
                'Critical - Counterfeit with Evidence',
                value={
                    "reporter_type": "Pharmacist",
                    "issue_type": "COUNTERFEIT",
                    "severity": "CRITICAL",
                    "description": "Fake hologram detected, packaging differs from authentic batches.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7",
                    "dispensing_pharmacy_name": "City Pharmacy",
                    "date_of_purchase": "2026-06-10",
                },
                request_only=True,
            ),
            OpenApiExample(
                'Medium - Packaging Damage',
                value={
                    "reporter_type": "Patient",
                    "issue_type": "PACKAGING",
                    "severity": "MEDIUM",
                    "description": "Seal appears tampered with, but contents seem intact.",
                    "lot": "494466b3-0f94-4f5c-8a12-38e403fcf3e7",
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
    ViewSet for crowdsourced quality reporting / Incident Management.

    Provides CRUD operations for CrowdFlag model with the following features:
    - List all crowd flags (paginated)
    - Retrieve individual flag details
    - Create new flags with optional image evidence (patients and pharmacists)
    - Investigation lifecycle actions (Admin only):
        - start_investigation: NEW → INVESTIGATING
        - escalate: → ESCALATED_DISTRIBUTOR / ESCALATED_REGULATOR
        - resolve: → RESOLVED
    - Automatic user association with authenticated user
    - Filter by status, severity, issue type, reporter type
    - Search by description

    Permissions:
    - All operations: Patients, pharmacists, and admins can access
    - User field is automatically set to request.user on creation
    - Lifecycle actions restricted to Admin role
    """

    queryset = CrowdFlag.objects.all().select_related('user', 'lot')
    serializer_class = CrowdFlagSerializer
    permission_classes = [IsAdminOrPatientOrPharmacist]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Enable search by description and issue type
    search_fields = ['description', 'issue_type']
    # Enable ordering
    ordering_fields = ['created_at', 'issue_type', 'status', 'severity']
    ordering = ['-created_at']  # Default ordering (newest first)

    def get_queryset(self):
        """
        Optionally filter crowd flags by various criteria.

        Query params:
            resolved (bool): Filter by resolution status (backward-compat)
            status (str): Comma-separated list of statuses to include
            issue_type (str): Filter by issue type
            reporter_type (str): Filter by reporter type
            severity (str): Filter by severity level (CRITICAL, HIGH, MEDIUM, LOW)
            lot (uuid): Filter by lot manifest ID
            my_flags (bool): Filter to show only current user's flags

        Returns:
            QuerySet: Filtered crowd flag queryset
        """
        queryset = super().get_queryset()

        # Filter by status (new lifecycle param — comma-separated)
        status_param = self.request.query_params.get('status', None)
        if status_param:
            statuses = [s.strip().upper() for s in status_param.split(',')]
            queryset = queryset.filter(status__in=statuses)

        # Filter by resolution status (backward-compatible)
        resolved = self.request.query_params.get('resolved', None)
        if resolved is not None:
            resolved_bool = resolved.lower() == 'true'
            if resolved_bool:
                queryset = queryset.filter(status__in=TERMINAL_STATUSES)
            else:
                queryset = queryset.filter(status__in=ACTIVE_STATUSES)

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

        # Filter to show only current user's flags if requested.
        # Admins always see all flags, regardless of this param.
        my_flags = self.request.query_params.get('my_flags', None)
        if my_flags and my_flags.lower() == 'true':
            if getattr(self.request.user, 'role', None) != 'Admin':
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

    # ── Investigation Lifecycle Actions ──────────────────────────────────────

    def _append_notes(self, flag, notes, action_label):
        """Helper to append timestamped notes to investigator_notes."""
        if notes:
            ts = timezone.now().strftime('%Y-%m-%d %H:%M UTC')
            user = self.request.user.username
            entry = f"[{ts}] ({action_label} by {user}) {notes}"
            if flag.investigator_notes:
                flag.investigator_notes += f"\n{entry}"
            else:
                flag.investigator_notes = entry

    @extend_schema(
        summary="Start investigation on a flag",
        description="""
        Transition a flag from NEW to INVESTIGATING status.

        **Request Body (JSON):**
        - `notes` (string, optional): Investigation notes to append.

        **Side Effect:** Status changes to INVESTIGATING, notes are timestamped and appended.
        """,
        tags=['Flags'],
        responses={200: CrowdFlagSerializer},
    )
    @action(detail=True, methods=['post'])
    def start_investigation(self, request, pk=None):
        """Transition status to INVESTIGATING and append notes."""
        flag = self.get_object()
        flag.status = 'INVESTIGATING'
        self._append_notes(flag, request.data.get('notes', ''), 'Investigation Started')
        flag.save()
        return Response(self.get_serializer(flag).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Escalate a flag",
        description="""
        Escalate a flag to a Distributor or Regulator.

        **Request Body (JSON):**
        - `escalate_to` (string, required): One of `DISTRIBUTOR` or `REGULATOR`.
        - `notes` (string, optional): Escalation notes to append.

        **Side Effect:** Status changes to ESCALATED_DISTRIBUTOR or ESCALATED_REGULATOR.
        """,
        tags=['Flags'],
        responses={200: CrowdFlagSerializer},
    )
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Escalate flag to distributor or regulator."""
        flag = self.get_object()
        target = request.data.get('escalate_to', '').upper()
        if target == 'DISTRIBUTOR':
            flag.status = 'ESCALATED_DISTRIBUTOR'
        elif target == 'REGULATOR':
            flag.status = 'ESCALATED_REGULATOR'
        else:
            return Response(
                {'detail': 'escalate_to must be DISTRIBUTOR or REGULATOR.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self._append_notes(flag, request.data.get('notes', ''), f'Escalated to {target.title()}')
        flag.save()
        return Response(self.get_serializer(flag).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Resolve a flag",
        description="""
        Mark a flag as RESOLVED after investigation.

        **Request Body (JSON):**
        - `notes` (string, optional): Resolution notes to append.

        **Side Effect:**
        ⚠️ Automatically recalculates lot trust_score in REAL-TIME!
        """,
        tags=['Flags'],
        responses={200: CrowdFlagSerializer},
    )
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark flag as RESOLVED and append resolution notes."""
        flag = self.get_object()
        flag.status = 'RESOLVED'
        self._append_notes(flag, request.data.get('notes', ''), 'Resolved')
        flag.save()
        return Response(self.get_serializer(flag).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Get Heatmap Data",
        description="Get a lightweight JSON array of all active crowd flags with coordinates for the Fraud Radar map.",
        tags=['Flags'],
    )
    @action(detail=False, methods=['get'])
    def heatmap_data(self, request):
        """
        Query all active flags that have coordinates and return a lightweight JSON.
        Optimized with select_related to prevent N+1 DB queries on the lot.
        """
        flags = CrowdFlag.objects.filter(
            status__in=ACTIVE_STATUSES,
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('lot__medicine')

        results = []
        for flag in flags:
            results.append({
                'id': str(flag.id),
                'latitude': flag.latitude,
                'longitude': flag.longitude,
                'severity': flag.severity,
                'medicine_name': flag.lot.medicine.name if flag.lot and flag.lot.medicine else "Unknown Medicine"
            })

        return Response(results, status=status.HTTP_200_OK)
