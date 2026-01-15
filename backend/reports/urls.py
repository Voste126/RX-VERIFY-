"""
URL configuration for reports app.

This module defines URL patterns for crowdsourced quality reporting.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CrowdFlagViewSet

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'flags', CrowdFlagViewSet, basename='crowdflag')

urlpatterns = [
    path('', include(router.urls)),
]
