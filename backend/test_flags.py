import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from accounts.models import User
from reports.views import CrowdFlagViewSet

factory = RequestFactory()
view = CrowdFlagViewSet.as_view({'post': 'create'})

# Create a Patient user
patient, _ = User.objects.get_or_create(username='testpatient', email='test@test.com', role='Patient')

# Make a POST request
request = factory.post('/api/flags/', {
    'lot': '3d02cd19-edc6-4f9e-b07e-b9b89a3d0424',
    'issue_type': 'Quality Issue',
    'severity': 'HIGH',
    'description': 'Test',
    'reporter_type': 'Patient'
}, format='json')
request.user = patient

try:
    response = view(request)
except Exception as e:

# Admin test
admin, _ = User.objects.get_or_create(username='testadmin', email='testadmin@test.com', role='Admin')
request_admin = factory.post('/api/flags/', {
    'lot': '3d02cd19-edc6-4f9e-b07e-b9b89a3d0424',
    'issue_type': 'Quality Issue',
    'severity': 'HIGH',
    'description': 'Test',
    'reporter_type': 'Admin'
}, format='json')
request_admin.user = admin

try:
    response_admin = view(request_admin)
except Exception as e:
