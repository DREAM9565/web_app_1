from venv import logger
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ProductRequest, ProductRequestImage, RequestCategory, RequestGroup, RequestVid,
    MarketProductRequest, MarketProductRequestImage, RequestCurrency
)

User = get_user_model()

# Сериализатор для изображений запросов
class ProductRequestImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if obj.image else None

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

# Сериализатор для рыночных товаров (вложенный)
class MarketProductRequestNestedSerializer(serializers.ModelSerializer):
    images = ProductRequestImageSerializer(many=True, read_only=True)
    currency = RequestCurrencySerializer(read_only=True)

    class Meta:
        model = MarketProductRequest
        fields = [
            'id', 'description', 'cz', 'currency', 'provider', 'min_shipment',
            'country', 'city', 'qty_per_package', 'price_list_delivery_15', 'delivery_time',
            'fulfillment_time', 'qty_provider', 'price_list_delivery_30', 'price_list_delivery_45',
            'created_at', 'images'
        ]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

# Сериализатор для запросов на добавление товара
class ProductRequestSerializer(serializers.ModelSerializer):
    images = ProductRequestImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        max_length=10
    )
    category = RequestCategorySerializer(read_only=True)
    group = RequestGroupSerializer(read_only=True)
    vid = RequestVidSerializer(read_only=True)
    
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=RequestCategory.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=RequestGroup.objects.all(),
        source='group',
        write_only=True,
        required=False
    )
    vid_id = serializers.PrimaryKeyRelatedField(
        queryset=RequestVid.objects.all(),
        source='vid',
        write_only=True,
        required=False
    )
    market_products = MarketProductRequestNestedSerializer(many=True, read_only=True)
    creator = UserSerializer(read_only=True)
    creator_name = serializers.SerializerMethodField()
    creator_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductRequest
        fields = [
            'id', 'name', 'description', 'product_link', 'desired_purchase_price',
            'category', 'group', 'vid', 'category_id', 'group_id', 'vid_id',
            'created_at', 'images', 'uploaded_images', 'market_products',
            'creator', 'creator_name', 'creator_full_name',
            'processed_by_km', 'processed_by_buyer'
        ]
        read_only_fields = ['creator', 'created_at']

    def get_creator_name(self, obj):
        if obj.creator:
            return obj.creator.username
        return 'Неизвестно'

    def get_creator_full_name(self, obj):
        if obj.creator:
            full_name = f"{obj.creator.first_name} {obj.creator.last_name}".strip()
            return full_name if full_name else obj.creator.username
        return 'Неизвестно'

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        creator = self.context['request'].user  # Получаем текущего пользователя из контекста
        request = ProductRequest.objects.create(creator=creator, **validated_data)
        
        for image in uploaded_images:
            ProductRequestImage.objects.create(request=request, image=image)
        
        return request

    def to_representation(self, instance):
        try:
            data = super().to_representation(instance)
            # Добавляем дополнительные проверки
            if 'created_at' in data and data['created_at'] is None:
                data['created_at'] = ''
            return data
        except Exception as e:
            logger.error(f"Ошибка сериализации запроса: {str(e)}")
            return {}

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Update related fields first
        for field in ['category', 'group', 'vid']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Add new images
        for image in uploaded_images:
            ProductRequestImage.objects.create(request=instance, image=image)
        
        return instance

# Сериализатор для рыночных товаров
class MarketProductRequestSerializer(serializers.ModelSerializer):
    images = ProductRequestImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), 
        write_only=True, 
        required=False,
        max_length=10
    )
    currency = RequestCurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=RequestCurrency.objects.all(),
        source='currency',
        write_only=True,
        required=False
    )

    class Meta:
        model = MarketProductRequest
        fields = [
            'id', 'request', 'description', 'cz', 'currency', 'currency_id',
            'provider', 'min_shipment', 'country', 'city', 'qty_per_package',
            'price_list_delivery_15', 'delivery_time', 'fulfillment_time',
            'price_list_delivery_30', 'price_list_delivery_45', 'images', 'uploaded_images', 'qty_provider'
        ]
        extra_kwargs = {
            'qty_provider': {'required': False, 'default': 0},
        }

    def create(self, validated_data):
        # Извлекаем uploaded_images из validated_data
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Создаем экземпляр MarketProductRequest
        instance = MarketProductRequest.objects.create(**validated_data)
        
        # Создаем связанные изображения
        for image in uploaded_images:
            MarketProductRequestImage.objects.create(product=instance, image=image)
        
        return instance

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Add new images
        for image in uploaded_images:
            MarketProductRequestImage.objects.create(product=instance, image=image)
        
        return instance

class MarketProductDetailSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    related_requests = serializers.SerializerMethodField()

    class Meta:
        model = MarketProductRequest
        fields = [
            'id', 'description', 'cz', 'provider', 'qty_per_package',
            'min_shipment', 'country', 'city', 'delivery_time',
            'price_list_delivery_15', 'price_list_delivery_30',
            'price_list_delivery_45', 'currency', 'images', 'related_requests',
            'fulfillment_time', 'qty_provider'
        ]

    def get_images(self, obj):
        images = MarketProductRequestImage.objects.filter(product=obj)
        return [
            {
                'id': image.id,
                'image': image.image.url if image.image else None
            }
            for image in images
        ]

    def get_currency(self, obj):
        if obj.currency:
            return {
                'id': obj.currency.id,
                'description': obj.currency.description
            }
        return None

    def get_related_requests(self, obj):
        # Получаем все запросы, связанные с этим рыночным товаром
        request = obj.request
        if request:
            return {
                'id': request.id,
                'name': request.name,
                'description': request.description,
                'desired_purchase_price': request.desired_purchase_price,
                'created_at': request.created_at,
                'images': [
                    {
                        'id': image.id,
                        'image': image.image.url if image.image else None
                    }
                    for image in request.images.all()
                ] if hasattr(request, 'images') else []
            }
        return None