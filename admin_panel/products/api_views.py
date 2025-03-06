from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, filters
from .models import MPRProduct, MarketProduct, Category, Group, Vid, Currency
from .serializers import MPRProductSerializer, MarketProductSerializer, CategorySerializer, MarketProductCreateSerializer, MarketProductDetailSerializer, MarketProductUpdateSerializer, CurrencySerializer
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Prefetch
from rest_framework.parsers import MultiPartParser, FormParser


class ProductPagination(PageNumberPagination):
    page_size = 30  # 30 карточек на страницу

class CategoryListAPIView(generics.ListAPIView):
    """
    API для получения списка категорий с отсортированными вложенными groups и vids.
    """
    serializer_class = CategorySerializer
    pagination_class = None  # Отключаем пагинацию для категорий

    def get_queryset(self):
        # Сортируем vids по vid_id
        vid_queryset = Vid.objects.all().order_by('vid_id')
        # Сортируем groups по group_id и подтягиваем отсортированные vids
        group_queryset = Group.objects.prefetch_related(
            Prefetch('vids', queryset=vid_queryset)
        ).order_by('group_id')
        # Сортируем категории по category_id и подтягиваем отсортированные groups
        queryset = Category.objects.prefetch_related(
            Prefetch('groups', queryset=group_queryset)
        ).order_by('category_id')
        return queryset


class CurrencyListAPIView(generics.ListAPIView):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    pagination_class = None  # Отключаем пагинацию, если она не нужна


class MarketProductDetailAPIView(generics.RetrieveUpdateAPIView):
    queryset = MarketProduct.objects.all()
    serializer_class = MarketProductDetailSerializer
    lookup_field = 'pk'


class MPRProductListAPIView(generics.ListAPIView):
    serializer_class = MPRProductSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.OrderingFilter]
    # Задаём поля сортировки; можно сортировать сразу по нескольким полям,
    # передавая их через запятую, например: ?ordering=-cz,avg_qty_sales_6_months
    ordering_fields = [
        'encode',             # Код товара
        'date_start_sell',    # Дата начала продаж
        'cz',                 # Цена закупки
        'cp',                 # Цена продажи
        'markup',             # Наценка
        'margin',             # Маржа
        'avg_qty_sales_6_months'  # Продажи (за 6 мес.)
    ]
    ordering = ['encode']  # Сортировка по умолчанию

    def get_queryset(self):
        queryset = MPRProduct.objects.all()
        category = self.request.query_params.get('category_id')
        group = self.request.query_params.get('group_id')
        vid = self.request.query_params.get('vid_id')
        search_query = self.request.query_params.get('search')
        if category:
            queryset = queryset.filter(category_id=category)
        if group:
            queryset = queryset.filter(group_id=group)
        if vid:
            queryset = queryset.filter(vid_id=vid)
        if search_query:
            queryset = queryset.filter(description__icontains=search_query)
        return queryset

class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = MPRProduct.objects.all()
    serializer_class = MPRProductSerializer
    lookup_field = 'encode'

class MarketProductListAPIView(generics.ListAPIView):
    serializer_class = MarketProductSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.OrderingFilter]
    # Задаём поля сортировки для рыночных товаров
    ordering_fields = [
        'id',                     # ID товара
        'date_create',            # Дата создания (если используется)
        'cz',                     # Цена закупки
        'price_list_delivery_15', # Цена доставки (15 дней)
        'price_list_delivery_30', # Цена доставки (30 дней)
        'price_list_delivery_45'  # Цена доставки (45 дней)
    ]
    ordering = ['id']  # Сортировка по умолчанию

    def get_queryset(self):
        queryset = MarketProduct.objects.all().order_by('id')
        # Применяем фильтры по полям родительского товара:
        category = self.request.query_params.get('category_id')
        group = self.request.query_params.get('group_id')
        vid = self.request.query_params.get('vid_id')
        search_query = self.request.query_params.get('search', '')
        if category:
            queryset = queryset.filter(parent__category_id=category)
        if group:
            queryset = queryset.filter(parent__group_id=group)
        if vid:
            queryset = queryset.filter(parent__vid_id=vid)
        if search_query:
            queryset = queryset.filter(
                Q(description__icontains=search_query) | Q(parent__description__icontains=search_query)
            )
        return queryset


class MarketProductCreateAPIView(generics.CreateAPIView):
    queryset = MarketProduct.objects.all()
    serializer_class = MarketProductCreateSerializer
    permission_classes = [IsAuthenticated]


class MarketProductRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = MarketProduct.objects.all()
    lookup_field = 'pk'
    http_method_names = ['get', 'put', 'patch']
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        # Если запрос GET, возвращаем детальный сериализатор (с родительской карточкой)
        if self.request.method == 'GET':
            return MarketProductDetailSerializer
        # Иначе для обновления используем сериализатор обновления с логикой работы с фото
        return MarketProductUpdateSerializer

    def perform_update(self, serializer):
        # Просто вызываем стандартное сохранение; вся логика обработки фото находится в методе update() сериализатора
        serializer.save()