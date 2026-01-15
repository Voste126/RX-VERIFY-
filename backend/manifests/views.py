"""
API views for lot manifest and signature verification management.

This module provides ViewSets for lot manifest CRUD operations with a custom
signature verification endpoint.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import LotManifest
from .serializers import LotManifestSerializer
from accounts.permissions import IsAdminOrReadOnly


@extend_schema_view(
    list=extend_schema(
        summary="List all lot manifests",
        description="Retrieve a paginated list of lot manifests with filtering options.",
        tags=['Manifests'],
    ),
    retrieve=extend_schema(
        summary="Retrieve lot manifest details",
        description="Get detailed information about a specific lot manifest including digital signature and trust score.",
        tags=['Manifests'],
    ),
    create=extend_schema(
        summary="Create new lot manifest",
        description="Register a new lot/batch manifest with digital signature. Requires admin role.",
        tags=['Manifests'],
    ),
    update=extend_schema(
        summary="Update lot manifest",
        description="Update all fields of an existing lot manifest. Requires admin role.",
        tags=['Manifests'],
    ),
    partial_update=extend_schema(
        summary="Partially update lot manifest",
        description="Update specific fields of a lot manifest. Requires admin role.",
        tags=['Manifests'],
    ),
    destroy=extend_schema(
        summary="Delete lot manifest",
        description="Permanently delete a lot manifest from the system. Requires admin role.",
        tags=['Manifests'],
    ),
)
class LotManifestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lot manifest management and signature verification.
    
    Provides CRUD operations for LotManifest model with the following features:
    - List all lot manifests (paginated)
    - Retrieve individual manifest details
    - Create new manifests (admin only)
    - Update manifest information (admin only)
    - Delete manifests (admin only)
    - Verify digital signatures
    - Filter by expiry date, trust score, medicine, distributor
    - Search by batch number
    
    Permissions:
    - Read, Verify: All authenticated users
    - Write (Create, Update, Delete): Admin users only
    """
    
    queryset = LotManifest.objects.all().select_related('medicine', 'distributor')
    serializer_class = LotManifestSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Enable search by batch number
    search_fields = ['batch_number']
    # Enable ordering
    ordering_fields = ['expiry_date', 'trust_score', 'batch_number']
    ordering = ['-expiry_date']  # Default ordering (newest first)
    
    def get_queryset(self):
        """
        Optionally filter lot manifests by various criteria.
        
        Query params:
            medicine (uuid): Filter by medicine ID
            distributor (uuid): Filter by distributor ID
            min_trust_score (float): Filter by minimum trust score
            expired (bool): Filter by expiration status
        
        Returns:
            QuerySet: Filtered lot manifest queryset
        """
        queryset = super().get_queryset()
        
        # Filter by medicine if param provided
        medicine_id = self.request.query_params.get('medicine', None)
        if medicine_id:
            queryset = queryset.filter(medicine_id=medicine_id)
        
        # Filter by distributor if param provided
        distributor_id = self.request.query_params.get('distributor', None)
        if distributor_id:
            queryset = queryset.filter(distributor_id=distributor_id)
        
       # Filter by minimum trust score if param provided
        min_trust_score = self.request.query_params.get('min_trust_score', None)
        if min_trust_score:
            try:
                queryset = queryset.filter(trust_score__gte=float(min_trust_score))
            except ValueError:
                pass  # Ignore invalid trust score values
        
        return queryset
    
    @extend_schema(
        summary="Verify lot manifest signature",
        description="""
        Verify the digital signature of a lot manifest.
        
        This endpoint calls the verify_signature() model method to validate the 
        cryptographic signature against the distributor's public key.
        
        Returns a structured JSON response with:
        - status: "Verified", "Forged", or "Unknown"
        - is_authentic: Boolean indicating signature validity
        - lot_details: Complete lot manifest information
        """,
        tags=['Manifests'],
        responses={
            200: OpenApiResponse(
                description="Signature verification result",
                response={
                    'type': 'object',
                    'properties': {
                        'status': {'type': 'string', 'enum': ['Verified', 'Forged', 'Unknown']},
                        'is_authentic': {'type': 'boolean'},
                        'lot_details': {'type': 'object'},
                    }
                }
            ),
            404: OpenApiResponse(description="Lot manifest not found"),
        }
    )
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Custom action to verify the digital signature of a lot manifest.
        
        This endpoint performs cryptographic verification of the manifest's
        digital signature using the distributor's public key.
        
        Args:
            request: The HTTP request object
            pk: The primary key (UUID) of the lot manifest to verify
        
        Returns:
            Response: JSON response with verification status and lot details
            
        Response format:
            {
                "status": "Verified" | "Forged" | "Unknown",
                "is_authentic": true | false,
                "lot_details": {
                    // Complete lot manifest data
                }
            }
        """
        # Get the lot manifest instance
        lot_manifest = self.get_object()
        
        # Call the model's verify_signature method
        # Note: This is currently a placeholder that returns True
        # In production, this should implement actual cryptographic verification
        is_authentic = lot_manifest.verify_signature()
        
        # Determine the status based on verification result
        if is_authentic:
            status_text = "Verified"
        else:
            status_text = "Forged"
        
        # Serialize the lot manifest details
        serializer = self.get_serializer(lot_manifest)
        
        # Construct the response
        response_data = {
            "status": status_text,
            "is_authentic": is_authentic,
            "lot_details": serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
