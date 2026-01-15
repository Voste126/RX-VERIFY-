"""
URL configuration for pharmaceuticals app.

This module defines URL patterns for medicine catalog management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import  MedicineViewSet

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'medicines', MedicineViewSet, basename='medicine')

urlpatterns = [
    path('', include(router.urls)),
]
