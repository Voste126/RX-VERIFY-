"""
API views for lot manifest and signature verification management.

This module provides ViewSets for lot manifest CRUD operations with a custom
signature verification endpoint.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiExample

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
        description="""
        Register a new lot/batch manifest with **auto-generated** Ed25519 digital signature.
        
        **Auto-Generated Fields:**
        - `digital_signature`: Ed25519 signature (128 hex chars)
          * Signed message: batch_number:expiry_date:distributor_id
          * Auto-generated using derived signing key
        - `trust_score`: Automatically set to 100.00 (IMMUTABLE)
        
        **Required Fields:**
        - `batch_number`: Unique lot/batch identifier
        - `expiry_date`: Medicine expiration date (YYYY-MM-DD)
        - `medicine`: Medicine UUID
        - `distributor`: Distributor UUID
        
        **DO NOT provide** `digital_signature` or `trust_score` - they are auto-generated and immutable!
        
        Requires admin role.
        """,
        tags=['Manifests'],
        examples=[
            OpenApiExample(
                'Paracetamol Lot',
                value={
                    "batch_number": "PCM-2026-KE-00142",
                    "expiry_date": "2028-11-15",
                    "medicine": "f9e8d7c6-b5a4-4321-9876-fedcba098765",
                    "distributor": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(
        summary="Update lot manifest",
        description="""
        Update lot manifest fields with AUTOMATIC signature regeneration.
        
        **Updatable Fields:**
        - `batch_number`: Lot/batch identifier
        - `expiry_date`: Medicine expiration date
        - `medicine`: Medicine UUID
        - `distributor`: Distributor UUID
        
        **IMMUTABLE Fields (Auto-Managed):**
        - `digital_signature`: ALWAYS auto-regenerated after update
        - `trust_score`: CANNOT be changed (locked at 100.00)
        
        **Behavior:**
        - Any update will regenerate the digital signature
        - trust_score is ignored if provided
        
        Requires admin role.
        """,
        tags=['Manifests'],
        examples=[
            OpenApiExample(
                'Update Batch Number',
                value={
                    "batch_number": "PCM-2026-KE-UPDATED",
                    "expiry_date": "2028-11-15",
                    "medicine": "f9e8d7c6-b5a4-4321-9876-fedcba098765",
                    "distributor": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                },
                request_only=True,
            ),
        ],
    ),
    partial_update=extend_schema(
        summary="Partially update lot manifest",
        description="""
        Partially update lot manifest with AUTOMATIC signature regeneration.
        
        **Updatable Fields:**
        - `batch_number`: Lot/batch identifier
        - `expiry_date`: Medicine expiration date  
        - `medicine`: Medicine UUID
        - `distributor`: Distributor UUID
        
        **IMMUTABLE Fields:**
        - `trust_score`: Cannot be updated (ignored if provided)
        - `digital_signature`: Always auto-regenerated
        
        **Note:** Even partial updates trigger signature regeneration!
        
        Requires admin role.
        """,
        tags=['Manifests'],
        examples=[
            OpenApiExample(
                'Update Only Batch Number',
                value={
                    "batch_number": "PCM-2026-KE-MODIFIED"
                },
                request_only=True,
            ),
            OpenApiExample(
                'Update Expiry Date',
                value={
                    "expiry_date": "2029-12-31"
                },
                request_only=True,
            ),
        ],
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
        summary="Verify Ed25519 lot manifest signature",
        description="""
        Verify the Ed25519 digital signature of a lot manifest using cryptographic verification.
        
        **SECURITY ARCHITECTURE:**
        - The distributor signed this manifest OFF-SERVER using their Ed25519 private key
        - The private key NEVER touches this server
        - We only use the distributor's PUBLIC KEY stored in the database
        - PyNaCl library performs Ed25519 elliptic curve cryptography verification
        
        **How It Works:**
        1. Construct message: "{batch_number}:{expiry_date}:{distributor_id}"
        2. Retrieve distributor's Ed25519 public key from database
        3. Use PyNaCl to verify the signature cryptographically
        4. Return verification result with timestamp
        
        **No Request Body Required** - Just POST to the endpoint.
        
        Returns a structured JSON response with:
        - **is_authentic**: Boolean - True if cryptographically valid
        - **trust_score**: Current trust score from database
        - **status**: "Verified" or "Forged/Tampered"
        - **timestamp**: Server time of verification (ISO 8601)
        """,
        tags=['Manifests'],
        responses={
            200: OpenApiResponse(
                description="Ed25519 signature verification result",
                response={
                    'type': 'object',
                    'properties': {
                        'is_authentic': {'type': 'boolean'},
                        'trust_score': {'type': 'string'},
                        'status': {'type': 'string', 'enum': ['Verified', 'Forged/Tampered']},
                        'timestamp': {'type': 'string', 'format': 'date-time'},
                    }
                }
            ),
            404: OpenApiResponse(description="Lot manifest not found"),
        }
    )
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Ed25519 Cryptographic Verification Endpoint.
        
        SECURITY NOTE:
        - This endpoint performs Ed25519 elliptic curve cryptography verification
        - The private key NEVER touches this server
        - Only the public key is used for verification
        - PyNaCl library ensures cryptographic integrity
        
        Verification Process:
        1. Retrieve the lot manifest by ID
        2. Call verify_signature() which uses PyNaCl to verify against public key
        3. Return authentication status with timestamp
        
        Args:
            request: The HTTP request object (no body required)
            pk: The primary key (UUID) of the lot manifest to verify
        
        Returns:
            Response: JSON response with verification result
            
        Response Format:
            {
                "is_authentic": true | false,
                "trust_score": "100.00",
                "status": "Verified" | "Forged/Tampered",
                "timestamp": "2026-01-16T22:56:00Z"
            }
        """
        from django.utils import timezone
        
        # Get the lot manifest instance
        lot_manifest = self.get_object()
        
        # Perform Ed25519 cryptographic verification
        # This calls the model's verify_signature() method which uses PyNaCl
        is_authentic = lot_manifest.verify_signature()
        
        # Determine status based on verification result
        if is_authentic:
            status_text = "Verified"
        else:
            status_text = "Forged/Tampered"
        
        # Get current server timestamp
        current_timestamp = timezone.now().isoformat()
        
        # Construct the response
        response_data = {
            "is_authentic": is_authentic,
            "trust_score": str(lot_manifest.trust_score),
            "status": status_text,
            "timestamp": current_timestamp
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

