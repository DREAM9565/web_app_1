from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductRequestViewSet, RequestCategoryViewSet, RequestGroupViewSet, RequestVidViewSet,
    MarketProductRequestViewSet, RequestCurrencyViewSet
)

router = DefaultRouter()
router.register(r'requests', ProductRequestViewSet)
router.register(r'categories', RequestCategoryViewSet)
router.register(r'groups', RequestGroupViewSet)
router.register(r'vids', RequestVidViewSet)
router.register(r'currencies', RequestCurrencyViewSet)
router.register(r'market-products', MarketProductRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]