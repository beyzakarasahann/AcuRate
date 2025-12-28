"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Try to import drf_spectacular views (optional dependency)
try:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
    SPECTACULAR_AVAILABLE = True
except ImportError:
    SPECTACULAR_AVAILABLE = False

def root_view(request):
    """Root endpoint to verify backend is running"""
    endpoints = {
        'admin': '/admin/',
        'api': '/api/',
    }
    
    # Add API docs endpoints only if drf-spectacular is available
    if SPECTACULAR_AVAILABLE and getattr(settings, 'API_DOCS_ENABLED', False):
        endpoints.update({
            'api_docs': '/api/docs/',
            'api_redoc': '/api/redoc/',
            'api_schema': '/api/schema/',
        })
    
    return JsonResponse({
        'success': True,
        'message': 'AcuRate Backend API is running!',
        'version': '1.0.0',
        'endpoints': endpoints,
    })
schema_view = get_schema_view(
   openapi.Info(
      title="AcuRate API",
      default_version='v1',
      description="AcuRate projesi API Dokümantasyonu",
      contact=openapi.Contact(email="iletisim@acurate.com"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)
urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]

# API Documentation (only if drf-spectacular is available and enabled)
if SPECTACULAR_AVAILABLE and getattr(settings, 'API_DOCS_ENABLED', False):
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

# Serve media and static files in development
if settings.DEBUG:
    # Only serve media files if MEDIA_ROOT is set
    if hasattr(settings, 'MEDIA_ROOT') and settings.MEDIA_ROOT:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Only serve static files if STATIC_ROOT is set
    if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
        urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
