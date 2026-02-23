import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from logs.models import ReceiptEvent
from accounts.models import CustomUser
from manifests.models import LotManifest

u = CustomUser.objects.filter(role='Pharmacist').first()
m = LotManifest.objects.first()


try:
    r = ReceiptEvent.objects.create(user=u, lot=m, location_coord={"lat": 1.0, "lng": 1.0})
except Exception as e:
