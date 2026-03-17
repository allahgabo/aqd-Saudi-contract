from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import django


def health_check(request):
    return JsonResponse({'status': 'ok', 'django': django.VERSION[:3]})


def api_root(request):
    """Friendly root response — confirms backend is live."""
    return JsonResponse({
        'service': 'AQD · عقد — Saudi Contract Analyzer API',
        'status': 'online',
        'version': '1.0.0',
        'endpoints': {
            'health':    '/api/health/',
            'auth':      '/api/auth/',
            'contracts': '/api/contracts/',
            'reports':   '/api/reports/',
            'admin_api': '/api/admin/',
            'django_admin': '/admin/',
        },
        'docs': 'Set REACT_APP_API_URL=https://aqd-backend.onrender.com/api in your frontend',
    })


urlpatterns = [
    path('',       api_root,     name='root'),       # ← shows info at /
    path('admin/', admin.site.urls),
    path('api/',       api_root,     name='api-root'),  # ← also at /api/
    path('api/health/', health_check, name='health'),
    path('api/auth/', include('contracts.auth_urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/admin/', include('contracts.admin_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
