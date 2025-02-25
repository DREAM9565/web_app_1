# accounts/api_urls_admin.py
from django.urls import path
from .api_views_admin import AdminUserListAPIView, AdminUserDetailAPIView

urlpatterns = [
    path('users/', AdminUserListAPIView.as_view(), name='admin-user-list'),
    path('users/<int:id>/', AdminUserDetailAPIView.as_view(), name='admin-user-detail'),
]
