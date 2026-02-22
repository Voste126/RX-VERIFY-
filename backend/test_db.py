import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from logs.models import ReceiptEvent
from accounts.models import CustomUser
from manifests.models import LotManifest

u = CustomUser.objects.filter(role='Pharmacist').first()
m = LotManifest.objects.first()

print(f"Pharmacist: {u}")
print(f"Manifest: {m}")

try:
    r = ReceiptEvent.objects.create(user=u, lot=m, location_coord={"lat": 1.0, "lng": 1.0})
    print(f"Created receipt: {r.id}")
except Exception as e:
    print(f"Failed: {e}")
