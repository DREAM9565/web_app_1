from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from admin_panel.views_react import serve_react

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('products.api_urls')),
    path('api/accounts/', include('accounts.api_urls')),
    # Другие API маршруты, если они есть
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Если приложение собрано (например, в production), отдаем React build
if not settings.DEBUG:
    urlpatterns += [
        re_path(r'^.*$', serve_react),
    ]

# # Если React сборка используется (production):
# urlpatterns += [
#     path('manifest.json', TemplateView.as_view(template_name="manifest.json")),
#     # Catch-all: любые URL, которые не начинаются с /admin/ или /api/, отдаются React-приложению
#     re_path(r'^.*$', serve_react),
# ]