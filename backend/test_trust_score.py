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

print("=" * 60)
print("TRUST SCORE AUTO-UPDATE TEST")
print("=" * 60)

# Get test data
try:
    lot = LotManifest.objects.first()
    user = User.objects.filter(role='PHARMACIST').first()
    
    if not lot or not user:
        print("ERROR: Need at least one lot and one pharmacist user")
        print("Run: python3 manage.py create_users_and_migrate.py")
        exit(1)
    
    print(f"\nTest Lot: {lot.batch_number}")
    print(f"Test User: {user.username}")
    
    # Reset trust score to base
    lot.trust_score = Decimal('100.00')
    lot.save()
    print(f"\n✓ Reset trust score to: {lot.trust_score}")
    
    # Test 1: Create CRITICAL flag
    print("\n" + "-" * 60)
    print("TEST 1: Creating CRITICAL flag (-15.00 penalty)")
    print("-" * 60)
    
    flag1 = CrowdFlag.objects.create(
        reporter_type="Pharmacist",
        issue_type="Counterfeit Suspected",
        severity="CRITICAL",
        description="Test critical flag - fake hologram detected",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    print(f"Flag created: {flag1.id}")
    print(f"Expected score: 85.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('85.00'), f"Expected 85.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 2: Create HIGH flag
    print("\n" + "-" * 60)
    print("TEST 2: Creating HIGH flag (-10.00 penalty)")
    print("-" * 60)
    
    flag2 = CrowdFlag.objects.create(
        reporter_type="Pharmacist",
        issue_type="Quality Issue",
        severity="HIGH",
        description="Test high flag - packaging damage",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    print(f"Flag created: {flag2.id}")
    print(f"Expected score: 75.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('75.00'), f"Expected 75.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 3: Create MEDIUM flag
    print("\n" + "-" * 60)
    print("TEST 3: Creating MEDIUM flag (-5.00 penalty)")
    print("-" * 60)
    
    flag3 = CrowdFlag.objects.create(
        reporter_type="Patient",
        issue_type="Packaging Damage",
        severity="MEDIUM",
        description="Test medium flag - seal slightly damaged",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    print(f"Flag created: {flag3.id}")
    print(f"Expected score: 70.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('70.00'), f"Expected 70.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 4: Create LOW flag
    print("\n" + "-" * 60)
    print("TEST 4: Creating LOW flag (-2.00 penalty)")
    print("-" * 60)
    
    flag4 = CrowdFlag.objects.create(
        reporter_type="Patient",
        issue_type="Minor Issue",
        severity="LOW",
        description="Test low flag - label slightly faded",
        user=user,
        lot=lot
    )
    
    lot.refresh_from_db()
    print(f"Flag created: {flag4.id}")
    print(f"Expected score: 68.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('68.00'), f"Expected 68.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 5: Resolve CRITICAL flag
    print("\n" + "-" * 60)
    print("TEST 5: Resolving CRITICAL flag (recalculation)")
    print("-" * 60)
    print("Current flags: CRITICAL, HIGH, MEDIUM, LOW")
    print("After resolving CRITICAL: HIGH(-10), MEDIUM(-5), LOW(-2) = -17")
    
    flag1.is_resolved = True
    flag1.save()
    
    lot.refresh_from_db()
    print(f"Flag resolved: {flag1.id}")
    print(f"Expected score: 83.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('83.00'), f"Expected 83.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 6: Resolve all remaining flags
    print("\n" + "-" * 60)
    print("TEST 6: Resolving all remaining flags")
    print("-" * 60)
    
    flag2.is_resolved = True
    flag2.save()
    flag3.is_resolved = True
    flag3.save()
    flag4.is_resolved = True
    flag4.save()
    
    lot.refresh_from_db()
    print(f"All flags resolved")
    print(f"Expected score: 100.00")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('100.00'), f"Expected 100.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Test 7: Edge case - Multiple critical flags
    print("\n" + "-" * 60)
    print("TEST 7: Edge case - 7 CRITICAL flags (should not go below 0)")
    print("-" * 60)
    
    # Delete previous test flags
    CrowdFlag.objects.filter(lot=lot).delete()
    lot.refresh_from_db()
    print(f"Deleted test flags, score reset to: {lot.trust_score}")
    
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
    print(f"Created 7 CRITICAL flags")
    print(f"Expected score: 0.00 (capped at minimum)")
    print(f"Actual score: {lot.trust_score}")
    assert lot.trust_score == Decimal('0.00'), f"Expected 0.00, got {lot.trust_score}"
    print("✓ PASSED")
    
    # Cleanup
    print("\n" + "-" * 60)
    print("CLEANUP")
    print("-" * 60)
    CrowdFlag.objects.filter(lot=lot).delete()
    lot.trust_score = Decimal('100.00')
    lot.save()
    print("✓ Deleted all test flags")
    print(f"✓ Reset trust score to: {lot.trust_score}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! ✓")
    print("=" * 60)
    print("\nTrust score auto-update system is working correctly!")
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
