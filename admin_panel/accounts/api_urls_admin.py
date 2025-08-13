# accounts/api_urls_admin.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import AdminUserViewSet

router = DefaultRouter()
router.register(r'users', AdminUserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
