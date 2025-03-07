from rest_framework import serializers
from .models import (
    ProductRequest, ProductRequestImage, RequestCategory, RequestGroup, RequestVid,
    MarketProductRequest, MarketProductRequestImage, RequestCurrency
)

# Сериализатор для изображений запросов
class ProductRequestImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRequestImage
        fields = ['id', 'image']

# Сериализатор для категорий
class RequestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestCategory
        fields = ['id', 'name']

# Сериализатор для групп
class RequestGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestGroup
        fields = ['id', 'name']

# Сериализатор для видов
class RequestVidSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestVid
        fields = ['id', 'name']

# Сериализатор для валют
class RequestCurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestCurrency
        fields = ['id', 'description']

# Сериализатор для запросов на добавление товара
class ProductRequestSerializer(serializers.ModelSerializer):
    images = ProductRequestImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, max_length=3
    )
    category = RequestCategorySerializer(read_only=True)
    group = RequestGroupSerializer(read_only=True)
    vid = RequestVidSerializer(read_only=True)

    class Meta:
        model = ProductRequest
        fields = [
            'id', 'name', 'description', 'product_link', 'desired_purchase_price',
            'category', 'group', 'vid', 'created_at', 'images', 'uploaded_images'
        ]

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        request = ProductRequest.objects.create(**validated_data)
        for image in uploaded_images:
            ProductRequestImage.objects.create(request=request, image=image)
        return request

# Сериализатор для рыночных товаров
class MarketProductRequestSerializer(serializers.ModelSerializer):
    images = ProductRequestImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, max_length=3
    )
    currency = RequestCurrencySerializer(read_only=True)

    class Meta:
        model = MarketProductRequest
        fields = [
            'id', 'request', 'description', 'cz', 'currency', 'provider', 'min_shipment',
            'country', 'city', 'qty_per_package', 'price_list_delivery_15', 'delivery_time',
            'fulfillment_time', 'qty_provider', 'price_list_delivery_30', 'price_list_delivery_45',
            'created_at', 'images', 'uploaded_images'
        ]

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        product = MarketProductRequest.objects.create(**validated_data)
        for image in uploaded_images:
            MarketProductRequestImage.objects.create(product=product, image=image)
        return product