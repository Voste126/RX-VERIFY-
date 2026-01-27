"""
URL configuration for accounts app.

This module defines URL patterns for user authentication and account management,
including JWT token endpoints and role-specific registration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from .views import (
    UserViewSet,
    patient_register,
    pharmacist_register,
    distributor_register,
    logout
)
from .serializers import CustomTokenObtainPairSerializer


# Custom JWT view with role in payload
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# Create a router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # JWT Authentication endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout, name='logout'),
    
    # Role-specific registration endpoints
    path('auth/register/patient/', patient_register, name='patient_register'),
    path('auth/register/pharmacist/', pharmacist_register, name='pharmacist_register'),
    path('auth/register/distributor/', distributor_register, name='distributor_register'),
    
    # User ViewSet endpoints
    path('', include(router.urls)),
]
