"""
URL configuration for manifests app.

This module defines URL patterns for lot manifest management and signature verification.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LotManifestViewSet

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'manifests', LotManifestViewSet, basename='lotmanifest')

urlpatterns = [
    path('', include(router.urls)),
]
