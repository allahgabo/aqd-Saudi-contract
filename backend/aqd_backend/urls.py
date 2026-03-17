from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import django


def health_check(request):
    return JsonResponse({'status': 'ok', 'django': django.VERSION[:3]})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health'),
    path('api/auth/', include('contracts.auth_urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/admin/', include('contracts.admin_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
