# accounts/api_urls.py
from django.urls import path, include
from .api_views import (
    RegistrationAPIView,
    LoginAPIView,
    LogoutAPIView,
    WhoAmIAPIView
)

urlpatterns = [
    path('register/', RegistrationAPIView.as_view(), name='api-register'),
    path('login/', LoginAPIView.as_view(), name='api-login'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('whoami/', WhoAmIAPIView.as_view(), name='api-whoami'),

    # Подключаем admin-урлы
    path('admin/', include('accounts.api_urls_admin')), 
]
