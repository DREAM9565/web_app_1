from rest_framework import viewsets
from .models import (
    ProductRequest, RequestCategory, RequestGroup, RequestVid, MarketProductRequest, RequestCurrency
)
from .serializers import (
    ProductRequestSerializer, RequestCategorySerializer, RequestGroupSerializer,
    RequestVidSerializer, MarketProductRequestSerializer, RequestCurrencySerializer
)

# Viewset для категорий
class RequestCategoryViewSet(viewsets.ModelViewSet):
    queryset = RequestCategory.objects.all()
    serializer_class = RequestCategorySerializer

# Viewset для групп
class RequestGroupViewSet(viewsets.ModelViewSet):
    queryset = RequestGroup.objects.all()
    serializer_class = RequestGroupSerializer

# Viewset для видов
class RequestVidViewSet(viewsets.ModelViewSet):
    queryset = RequestVid.objects.all()
    serializer_class = RequestVidSerializer

# Viewset для валют
class RequestCurrencyViewSet(viewsets.ModelViewSet):
    queryset = RequestCurrency.objects.all()
    serializer_class = RequestCurrencySerializer

# Viewset для запросов на добавление товара
class ProductRequestViewSet(viewsets.ModelViewSet):
    queryset = ProductRequest.objects.all()
    serializer_class = ProductRequestSerializer

# Viewset для рыночных товаров
class MarketProductRequestViewSet(viewsets.ModelViewSet):
    queryset = MarketProductRequest.objects.all()
    serializer_class = MarketProductRequestSerializer