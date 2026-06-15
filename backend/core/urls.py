from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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
    
    # Supply Orders & Chain of Custody (orders app)
    path('api/orders/', include('orders.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
