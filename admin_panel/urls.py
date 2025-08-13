from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductRequestImageViewSet, 
    RequestGroupViewSet, 
    RequestVidViewSet,
    ProductRequestViewSet
)

router = DefaultRouter()
router.register(r'product-requests/groups', RequestGroupViewSet, basename='requestgroup')
router.register(r'product-requests/vids', RequestVidViewSet, basename='requestvid')
router.register(r'product-requests/requests', ProductRequestViewSet, basename='productrequest')
router.register(r'product-requests/images', ProductRequestImageViewSet, basename='productrequestimage')

urlpatterns = [
    path('api/', include(router.urls)),
] 