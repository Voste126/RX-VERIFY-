import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from accounts.models import User
from reports.views import CrowdFlagViewSet

factory = RequestFactory()
# Disable CSRF checks
from rest_framework.views import APIView
APIView.authentication_classes = [] # we will just rely on request.user

view = CrowdFlagViewSet.as_view({'post': 'create'})
distributor, _ = User.objects.get_or_create(username='testdistributor', role='Distributor')

request = factory.post('/api/flags/', {'lot': '3d02cd...'}, format='json')
request.user = distributor

import logging
logging.basicConfig(level=logging.WARNING)

response = view(request)
