from django.urls import path
from .api_views import (
    MPRProductListAPIView,
    ProductDetailAPIView,
    MarketProductListAPIView,
    MarketProductCreateAPIView,
    CategoryListAPIView,
    MarketProductRetrieveUpdateAPIView,
    CurrencyListAPIView,
)

urlpatterns = [
    path('currencies/', CurrencyListAPIView.as_view(), name='currencies'),
    path('categories/', CategoryListAPIView.as_view(), name='api-categories'),
    path('products/', MPRProductListAPIView.as_view(), name='api-products'),
    path('market-products/', MarketProductListAPIView.as_view(), name='api-market-products'),
    path('products/<str:encode>/', ProductDetailAPIView.as_view(), name='api-product-detail'),
    path('market-products/create/', MarketProductCreateAPIView.as_view(), name='api-market-product-create'),
    path('market-products/<int:pk>/', MarketProductRetrieveUpdateAPIView.as_view(), name='api-market-product-retrieve-update'),
    
]
