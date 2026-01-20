"""
Create sample data for testing trust score functionality.
"""

from accounts.models import User
from entities.models import Manufacturer, Distributor
from pharmaceuticals.models import Medicine
from manifests.models import LotManifest
from datetime import date, timedelta
import uuid

print("Creating sample data...")

# Create users if they don't exist
pharmacist, created = User.objects.get_or_create(
    username='pharmacist1',
    defaults={
        'email': 'pharmacist@example.com',
        'role': 'PHARMACIST',
        'phone_number': '+254700000001'
    }
)
if created:
    pharmacist.set_password('password123')
    pharmacist.save()
    print(f"✓ Created pharmacist: {pharmacist.username}")
else:
    print(f"✓ Pharmacist already exists: {pharmacist.username}")

patient, created = User.objects.get_or_create(
    username='patient1',
    defaults={
        'email': 'patient@example.com',
        'role': 'PATIENT',
        'phone_number': '+254700000002'
    }
)
if created:
    patient.set_password('password123')
    patient.save()
    print(f"✓ Created patient: {patient.username}")
else:
    print(f"✓ Patient already exists: {patient.username}")

# Create manufacturer
manufacturer, created = Manufacturer.objects.get_or_create(
    name='PharmaCo Ltd',
    defaults={
        'license_number': 'MFG-2024-001',
        'contact_email': 'contact@pharmaco.com'
    }
)
print(f"✓ Manufacturer: {manufacturer.name}")

# Create distributor with public key
distributor, created = Distributor.objects.get_or_create(
    name='HealthDist Inc',
    defaults={
        'license_number': 'DIST-2024-001',
        'contact_email': 'contact@healthdist.com',
        'public_key': 'a' * 64  # 64 hex chars for testing
    }
)
print(f"✓ Distributor: {distributor.name}")

# Create medicine
medicine, created = Medicine.objects.get_or_create(
    name='Paracetamol 500mg',
    defaults={
        'barcode': '1234567890123',
        'manufacturer': manufacturer
    }
)
print(f"✓ Medicine: {medicine.name}")

# Create lot manifest
if not LotManifest.objects.exists():
    lot = LotManifest.objects.create(
        batch_number='BATCH-2024-TEST-001',
        expiry_date=date.today() + timedelta(days=365),
        medicine=medicine,
        distributor=distributor
    )
    print(f"✓ Created lot: {lot.batch_number}")
else:
    lot = LotManifest.objects.first()
    print(f"✓ Using existing lot: {lot.batch_number}")

print("\n✅ Sample data created successfully!")
print(f"   Pharmacist: {pharmacist.username} / password123")
print(f"   Patient: {patient.username} / password123")
print(f"   Lot: {lot.batch_number}")
