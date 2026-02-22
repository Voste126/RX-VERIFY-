import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

class DummyView(APIView):
    def get(self, request):
        return Response({'error': 'You can only inspect your own orders'}, status=status.HTTP_403_FORBIDDEN)

factory = RequestFactory()
view = DummyView.as_view()
request = factory.get('/test/')

# capture logs
logging.basicConfig(level=logging.WARNING)

response = view(request)
