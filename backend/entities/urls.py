"""
URL configuration for entities app.

This module defines URL patterns for distributor management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DistributorViewSet

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'distributors', DistributorViewSet, basename='distributor')

urlpatterns = [
    path('', include(router.urls)),
]
