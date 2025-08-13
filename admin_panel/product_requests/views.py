import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from .models import (
    ProductRequest, RequestCategory, RequestGroup, RequestVid, MarketProductRequest, RequestCurrency, ProductRequestImage, MarketProductRequestImage
)
from .serializers import (
    ProductRequestSerializer, RequestCategorySerializer, RequestGroupSerializer,
    RequestVidSerializer, MarketProductRequestSerializer, RequestCurrencySerializer,
    MarketProductDetailSerializer, ProductRequestImageSerializer
)
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class NoPagination(PageNumberPagination):
    page_size = None  # Отключаем пагинацию

class LargeResultsSetPagination(PageNumberPagination):
    page_size = 100  # Увеличиваем размер страницы
    page_size_query_param = 'page_size'
    max_page_size = 1000

# Viewset для категорий
class RequestCategoryViewSet(viewsets.ModelViewSet):
    queryset = RequestCategory.objects.all()
    serializer_class = RequestCategorySerializer
    pagination_class = LargeResultsSetPagination

# Viewset для групп
class RequestGroupViewSet(viewsets.ModelViewSet):
    queryset = RequestGroup.objects.all()
    serializer_class = RequestGroupSerializer
    pagination_class = NoPagination

# Viewset для видов
class RequestVidViewSet(viewsets.ModelViewSet):
    queryset = RequestVid.objects.all()
    serializer_class = RequestVidSerializer
    pagination_class = NoPagination

# Viewset для валют
class RequestCurrencyViewSet(viewsets.ModelViewSet):
    queryset = RequestCurrency.objects.all()
    serializer_class = RequestCurrencySerializer

# Viewset для запросов на добавление товара
class ProductRequestViewSet(viewsets.ModelViewSet):
    queryset = ProductRequest.objects.all()
    serializer_class = ProductRequestSerializer

    def list(self, request, *args, **kwargs):
        try:
            logger.info("Получен запрос на список запросов")
            queryset = self.get_queryset()
            logger.info(f"Количество запросов: {queryset.count()}")
            
            # Добавляем creator обратно в select_related
            queryset = queryset.select_related(
                'creator',
                'category',
                'group',
                'vid'
            ).prefetch_related('images', 'market_products')
            
            serializer = self.get_serializer(queryset, many=True)
            logger.info("Данные успешно сериализованы")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Ошибка при получении списка запросов: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        try:
            logger.info("Получен запрос на создание запроса")
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Ошибка при создании запроса: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        try:
            logger.info(f"Получен запрос на получение запроса с ID: {kwargs.get('pk')}")
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            logger.warning(f"Запрос с ID {kwargs.get('pk')} не найден")
            return Response(
                {"error": "Запрос не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Ошибка при получении запроса: {str(e)}")
            return Response(
                {"error": "Внутренняя ошибка сервера"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Log the validated data
            logger.info(f"Validated data: {serializer.validated_data}")
            
            updated_instance = serializer.save()
            
            # Log the updated instance
            logger.info(f"Updated instance: {updated_instance}")
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating request: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], url_path='market-products/(?P<product_id>[^/.]+)')
    def get_market_product(self, request, pk=None, product_id=None):
        try:
            logger.info(f"Получен запрос на получение товара. Request ID: {pk}, Product ID: {product_id}")
            
            # Получаем основной запрос
            product_request = self.get_object()
            logger.info(f"Найден основной запрос: {product_request}")

            # Ищем товар
            market_product = MarketProductRequest.objects.filter(
                id=product_id,
                request=product_request
            ).first()
            
            if not market_product:
                logger.warning(f"Товар не найден. Product ID: {product_id}")
                return Response(
                    {"error": "Товар не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )

            logger.info(f"Найден товар: {market_product}")
            serializer = MarketProductDetailSerializer(market_product)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Ошибка при получении товара: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()  # Это вызовет метод delete в модели
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

# Viewset для рыночных товаров
class MarketProductRequestViewSet(viewsets.ModelViewSet):
    queryset = MarketProductRequest.objects.all()
    serializer_class = MarketProductRequestSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsBuyerOrAdmin()]
        return super().get_permissions()

class IsBuyerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role in ['buyer', 'admin'] or request.user.is_superuser

class ProductRequestImageViewSet(viewsets.ModelViewSet):
    queryset = ProductRequestImage.objects.all()
    serializer_class = ProductRequestImageSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()  # Это вызовет метод delete в модели
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

def delete_market_product_image(request, product_id, image_id):
    try:
        image = MarketProductRequestImage.objects.get(id=image_id, product_id=product_id)
        image.delete()
        return JsonResponse({'status': 'success'})
    except MarketProductRequestImage.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Image not found'}, status=404)