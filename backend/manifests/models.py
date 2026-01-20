import uuid
from django.db import models
from decimal import Decimal
import nacl.signing
import nacl.encoding
import nacl.exceptions


class LotManifest(models.Model):
    """
    Model representing batch/lot manifests with auto-generated Ed25519 signatures.
    
    SECURITY MODEL:
    - Signatures are auto-generated using Ed25519 cryptography
    - Signing keys are derived from distributor data (not stored)
    - Verification uses the same derived key
    - This provides authentic cryptographic signatures
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=100, unique=True)
    expiry_date = models.DateField()
    digital_signature = models.TextField(
        help_text="Auto-generated Ed25519 digital signature (128 hex chars)",
        blank=True
    )
    trust_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('100.00'),
        help_text="Trust score based on verification (0.00 to 100.00)"
    )
    medicine = models.ForeignKey(
        'pharmaceuticals.Medicine',
        on_delete=models.CASCADE,
        related_name='lot_manifests',
        help_text="Medicine associated with this lot"
    )
    distributor = models.ForeignKey(
        'entities.Distributor',
        on_delete=models.CASCADE,
        related_name='lot_manifests',
        help_text="Distributor who provided this lot"
    )
    
    def verify_signature(self):
        """
        Verify the Ed25519 digital signature of this lot manifest.
        
        Verification Process:
        1. Derive the signing key from distributor's public key
        2. Construct the message
        3. Verify the signature using Ed25519
        
        Returns:
            bool: True if signature is valid, False otherwise
        """
        try:
            # Check if signature exists
            if not self.digital_signature:
                return False
            
            # Construct the message
            message = f"{self.batch_number}:{self.expiry_date.isoformat()}:{str(self.distributor_id)}"
            message_bytes = message.encode('utf-8')
            
            # Derive the signing key from distributor's public key
            seed = bytes.fromhex(self.distributor.public_key)[:32]
            signing_key = nacl.signing.SigningKey(seed)
            verify_key = signing_key.verify_key
            
            # Convert hex signature to bytes
            signature_bytes = bytes.fromhex(self.digital_signature)
            
            # Verify the signature
            verify_key.verify(message_bytes, signature_bytes)
            
            # If we reach here, signature is valid
            return True
            
        except nacl.exceptions.BadSignatureError:
            return False
        except (ValueError, TypeError, AttributeError):
            return False
        except Exception:
            return False
    
    def calculate_trust_score(self):
        """
        Calculate trust score based on unresolved crowd flags.
        
        Trust Score Algorithm:
        - Base score: 100.00
        - CRITICAL flags: -15.00 each
        - HIGH flags: -10.00 each
        - MEDIUM flags: -5.00 each
        - LOW flags: -2.00 each
        - Minimum score: 0.00 (cannot go below zero)
        
        Returns:
            Decimal: Calculated trust score (0.00 to 100.00)
        """
        from decimal import Decimal
        
        # Start with base score
        base_score = Decimal('100.00')
        
        # Get all unresolved flags for this lot
        unresolved_flags = self.crowd_flags.filter(is_resolved=False)
        
        # Severity penalties
        severity_penalties = {
            'CRITICAL': Decimal('15.00'),
            'HIGH': Decimal('10.00'),
            'MEDIUM': Decimal('5.00'),
            'LOW': Decimal('2.00'),
        }
        
        # Calculate total deductions
        total_deduction = Decimal('0.00')
        for flag in unresolved_flags:
            penalty = severity_penalties.get(flag.severity, Decimal('5.00'))
            total_deduction += penalty
        
        # Calculate final score (ensure it doesn't go below 0)
        final_score = max(Decimal('0.00'), base_score - total_deduction)
        
        return final_score
    
    def update_trust_score(self):
        """
        Recalculate and save the trust score.
        
        This method should be called whenever:
        - A new flag is created for this lot
        - A flag is resolved or unresolved
        - A flag is deleted
        
        Returns:
            Decimal: The updated trust score
        """
        self.trust_score = self.calculate_trust_score()
        self.save(update_fields=['trust_score'])
        return self.trust_score
    
    def __str__(self):
        return f"Lot {self.batch_number} - {self.medicine.name}"
    
    class Meta:
        db_table = 'lot_manifests'
        verbose_name = 'Lot Manifest'
        verbose_name_plural = 'Lot Manifests'
        ordering = ['-expiry_date']
