import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from reports.views import CrowdFlagViewSet

factory = RequestFactory()
view = CrowdFlagViewSet.as_view({'post': 'create'})

request = factory.post('/api/flags/', {
    'lot': '3d02cd19-edc6-4f9e-b07e-b9b89a3d0424',
    'issue_type': 'Quality Issue',
    'severity': 'HIGH',
    'description': 'Test',
    'reporter_type': 'Patient'
}, format='json')

try:
    response = view(request)
    print(f"Anon Post Response: {response.status_code}")
    print(f"Anon Post Data: {response.data}")
except Exception as e:
    print(f"Anon Post Exception: {e}")
