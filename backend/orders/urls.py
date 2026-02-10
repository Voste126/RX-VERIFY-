from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplyOrderViewSet

router = DefaultRouter()
router.register(r'', SupplyOrderViewSet, basename='supply-order')

urlpatterns = [
    path('', include(router.urls)),
]
