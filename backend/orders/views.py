from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import SupplyOrder
from .serializers import (
    SupplyOrderSerializer,
    SupplyOrderListSerializer,
    FulfillOrderSerializer,
    VerifyReceiptSerializer
)
from manifests.models import LotManifest
from manifests.serializers import LotManifestSerializer
from pharmaceuticals.models import Medicine
from accounts.permissions import IsPharmacist, IsDistributor


class SupplyOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supply orders."""
    
    queryset = SupplyOrder.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return full serializer for all actions to include items."""
        # Always return full serializer so distributors/pharmacists can see order items
        return SupplyOrderSerializer
    
    def get_queryset(self):
        """Filter orders based on user role."""
        user = self.request.user
        
        if user.role == 'Pharmacist':
            # Pharmacists see their own orders
            return SupplyOrder.objects.filter(pharmacist=user)
        elif user.role == 'Distributor':
            # Distributors see orders for their entity
            try:
                distributor_entity = user.distributor_entities.first()
                if distributor_entity:
                    return SupplyOrder.objects.filter(distributor=distributor_entity)
            except:
                pass
        elif user.role == 'Admin':
            # Admins see all orders
            return SupplyOrder.objects.all()
        
        return SupplyOrder.objects.none()
    
    def perform_create(self, serializer):
        """Auto-assign pharmacist as the requesting user."""
        if self.request.user.role == 'Pharmacist':
            serializer.save(pharmacist=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsDistributor])
    def fulfill(self, request, pk=None):
        """
        Distributor fulfillment endpoint.
        
        Creates a new LotManifest, links it to the order, and updates status to SHIPPED.
        
        Input:
            - batch_number: Batch identifier
            - expiry_date: Expiration date
            - medicine_id: Medicine UUID
        
        Returns:
            QR code data (manifest UUID) and batch details
        """
        order = self.get_object()
        
        # Validate order status
        if order.status != 'PENDING':
            return Response(
                {'error': f'Order is already {order.status}. Only PENDING orders can be fulfilled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify distributor matches order
        try:
            distributor_entity = request.user.distributor_entities.first()
            if not distributor_entity or distributor_entity != order.distributor:
                return Response(
                    {'error': 'You can only fulfill orders assigned to your distributor entity'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except:
            return Response(
                {'error': 'Distributor entity not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        serializer = FulfillOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get medicine
        medicine = get_object_or_404(Medicine, id=serializer.validated_data['medicine_id'])
        
        # Create LotManifest using the manifest serializer (auto-generates signature)
        manifest_data = {
            'batch_number': serializer.validated_data['batch_number'],
            'expiry_date': serializer.validated_data['expiry_date'],
            'medicine': medicine.id,
            'distributor': distributor_entity.id,
        }
        
        manifest_serializer = LotManifestSerializer(data=manifest_data)
        if not manifest_serializer.is_valid():
            return Response(manifest_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the manifest (signature auto-generated)
        manifest = manifest_serializer.save()
        
        # Link manifest to order
        order.manifest = manifest
        order.status = 'SHIPPED'
        order.save()
        
        # Return success response with QR data
        return Response({
            'success': True,
            'message': '✓ Order fulfilled and QR code generated',
            'qr_data': str(manifest.id),
            'batch_number': manifest.batch_number,
            'trust_score': str(manifest.trust_score),
            'order_status': order.status,
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsPharmacist])
    def verify_receipt(self, request):
        """
        Pharmacist secure receipt verification endpoint.
        
        Verifies manifest signature and checks chain of custody.
        Awards +10 trust score bonus if chain is verified.
        
        Input:
            - scanned_uuid: Manifest UUID from QR code
        
        Returns:
            Verification status with trust score and chain of custody information
        """
        # Validate input
        serializer = VerifyReceiptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        scanned_uuid = serializer.validated_data['scanned_uuid']
        
        # Get manifest
        try:
            manifest = LotManifest.objects.select_related('distributor', 'medicine').get(id=scanned_uuid)
        except LotManifest.DoesNotExist:
            return Response({
                'status': 'INVALID',
                'message': '✗ Manifest not found - Invalid QR code',
                'trust_score': '0.00',
                'chain_of_custody': False,
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Step 1: Verify signature (base validity)
        is_authentic = manifest.verify_signature()
        
        if not is_authentic:
            return Response({
                'status': 'INVALID',
                'message': '✗ Signature Invalid - Possible counterfeit',
                'batch_number': manifest.batch_number,
                'trust_score': '0.00',
                'chain_of_custody': False,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Step 2: Check chain of custody
        try:
            supply_order = SupplyOrder.objects.get(
                manifest=manifest,
                pharmacist=request.user
            )
            chain_verified = True
        except SupplyOrder.DoesNotExist:
            supply_order = None
            chain_verified = False
        
        # Step 3: Calculate trust score with bonus
        base_trust_score = manifest.calculate_trust_score()
        
        if chain_verified:
            # Award +10 bonus for chain of custody
            final_trust_score = min(Decimal('110.00'), base_trust_score + Decimal('10.00'))
            
            # Update order status to DELIVERED
            supply_order.status = 'DELIVERED'
            supply_order.save()
            
            # Success response with chain
            return Response({
                'status': 'VERIFIED',
                'message': '✓ Chain of Custody Verified - Authorized delivery to you',
                'trust_score': str(final_trust_score),
                'base_score': str(base_trust_score),
                'bonus_applied': '+10.00',
                'batch_number': manifest.batch_number,
                'expiry_date': str(manifest.expiry_date),
                'medicine_name': manifest.medicine.name,
                'distributor_name': manifest.distributor.name,
                'chain_of_custody': True,
                'order_id': str(supply_order.id),
            }, status=status.HTTP_200_OK)
        else:
            # Signature valid but no chain link
            return Response({
                'status': 'VERIFIED',
                'message': '✓ Signature Valid - ⚠ Warning: No order link found',
                'trust_score': str(base_trust_score),
                'batch_number': manifest.batch_number,
                'expiry_date': str(manifest.expiry_date),
                'medicine_name': manifest.medicine.name,
                'distributor_name': manifest.distributor.name,
                'chain_of_custody': False,
                'warning': 'This manifest is not linked to any order you placed',
            }, status=status.HTTP_200_OK)
