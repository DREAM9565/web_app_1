from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductRequestViewSet, RequestCategoryViewSet,
    RequestGroupViewSet, RequestVidViewSet,
    MarketProductRequestViewSet, RequestCurrencyViewSet,
    ProductRequestImageViewSet, delete_market_product_image
)

router = DefaultRouter()
router.register(r'requests', ProductRequestViewSet, basename='product-request')
router.register(r'categories', RequestCategoryViewSet)
router.register(r'groups', RequestGroupViewSet)
router.register(r'vids', RequestVidViewSet)
router.register(r'currencies', RequestCurrencyViewSet)
router.register(r'market-products', MarketProductRequestViewSet, basename='market-product')
router.register(r'images', ProductRequestImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('market-products/<int:product_id>/images/<int:image_id>/', delete_market_product_image, name='delete_market_product_image'),
]