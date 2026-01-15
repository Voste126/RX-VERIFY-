"""
URL configuration for RxVerify Lite project.

This module integrates all app URL patterns and provides:
- API endpoints for all 6 apps
- JWT authentication endpoints
- Swagger/OpenAPI documentation UI
- Django admin interface

API Documentation:
- Swagger UI: /api/docs/
- ReDoc: /api/redoc/
- OpenAPI Schema: /api/schema/
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Django admin interface
    path('admin/', admin.site.urls),
    
    # API Documentation endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Authentication & User Management (accounts app)
    path('api/', include('accounts.urls')),
    
    # Distributor Management (entities app)
    path('api/', include('entities.urls')),
    
    # Medicine Catalog (pharmaceuticals app)
    path('api/', include('pharmaceuticals.urls')),
    
    # Lot Manifests & Signature Verification (manifests app)
    path('api/', include('manifests.urls')),
    
    # Receipt Event Tracking (logs app)
    path('api/', include('logs.urls')),
    
    # Crowdsourced Quality Reporting (reports app)
    path('api/', include('reports.urls')),
]
