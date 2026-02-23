"""
Test script for trust score auto-updates with flag severity.

This script tests:
1. Flag creation automatically decreases trust score
2. Flag resolution recalculates trust score
3. Different severity levels have different impacts
4. Trust score never goes below 0.00
"""

from manifests.models import LotManifest
from reports.models import CrowdFlag
from accounts.models import User
from decimal import Decimal


# Get test data
try:
    lot = LotManifest.objects.first()
    user = User.objects.filter(role='PHARMACIST').first()
    
    if not lot or not user:
        exit(1)
    
    
    # Reset trust score to base
    lot.trust_score = Decimal('100.00')
    lot.save()
    
    # Test 1: Create CRITICAL flag
    
    flag1 = CrowdFlag.objects.create(
        reporter_type="Pharmacist",
        issue_type="Counterfeit Suspected",
        severity="CRITICAL",
        description="Test critical flag - fake hologram detected",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('85.00'), f"Expected 85.00, got {lot.trust_score}"
    
    # Test 2: Create HIGH flag
    
    flag2 = CrowdFlag.objects.create(
        reporter_type="Pharmacist",
        issue_type="Quality Issue",
        severity="HIGH",
        description="Test high flag - packaging damage",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('75.00'), f"Expected 75.00, got {lot.trust_score}"
    
    # Test 3: Create MEDIUM flag
    
    flag3 = CrowdFlag.objects.create(
        reporter_type="Patient",
        issue_type="Packaging Damage",
        severity="MEDIUM",
        description="Test medium flag - seal slightly damaged",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('70.00'), f"Expected 70.00, got {lot.trust_score}"
    
    # Test 4: Create LOW flag
    
    flag4 = CrowdFlag.objects.create(
        reporter_type="Patient",
        issue_type="Minor Issue",
        severity="LOW",
        description="Test low flag - label slightly faded",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('68.00'), f"Expected 68.00, got {lot.trust_score}"
    
    # Test 5: Resolve CRITICAL flag
    
    flag1.is_resolved = True
    flag1.save()
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('83.00'), f"Expected 83.00, got {lot.trust_score}"
    
    # Test 6: Resolve all remaining flags
    
    flag2.is_resolved = True
    flag2.save()
    flag3.is_resolved = True
    flag3.save()
    flag4.is_resolved = True
    flag4.save()
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('100.00'), f"Expected 100.00, got {lot.trust_score}"
    
    # Test 7: Edge case - Multiple critical flags
    
    # Delete previous test flags
    CrowdFlag.objects.filter(lot=lot).delete()
    lot.refresh_from_db()
    
    # Create 7 critical flags (7 * 15 = 105, which exceeds 100)
    for i in range(7):
        CrowdFlag.objects.create(
            reporter_type="Pharmacist",
            issue_type=f"Critical Issue {i+1}",
            severity="CRITICAL",
            description=f"Critical test flag {i+1}",
            user=user,
            lot=lot
        )
    
    lot.refresh_from_db()
    assert lot.trust_score == Decimal('0.00'), f"Expected 0.00, got {lot.trust_score}"
    
    # Cleanup
    CrowdFlag.objects.filter(lot=lot).delete()
    lot.trust_score = Decimal('100.00')
    lot.save()
    
    
except Exception as e:
    import traceback
    traceback.print_exc()
