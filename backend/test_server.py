import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from accounts.models import User

client = Client()
distributor, _ = User.objects.get_or_create(username='testdistributor', role='Distributor')
# Using force_login causes SessionAuthentication and therefore CSRF to be bypassed in TestClient? No, TestClient skips CSRF by default.
client.force_login(distributor)

response = client.post('/api/flags/', {'lot': '3d02cd19-edc6-4f9e-b07e-b9b89a3d0424'})
