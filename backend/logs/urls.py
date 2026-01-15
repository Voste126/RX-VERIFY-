"""
URL configuration for logs app.

This module defines URL patterns for receipt event tracking.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ReceiptEventViewSet

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'receipts', ReceiptEventViewSet, basename='receiptevent')

urlpatterns = [
    path('', include(router.urls)),
]
