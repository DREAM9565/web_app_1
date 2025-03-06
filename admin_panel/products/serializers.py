import datetime
import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import MPRProduct, MarketProduct, Category, Group, Vid, Currency
from django.conf import settings
from PIL import Image, ImageOps
from io import BytesIO


class VidSerializer(serializers.ModelSerializer):
    sku = serializers.SerializerMethodField()
    ost_cz = serializers.SerializerMethodField()

    class Meta:
        model = Vid
        fields = ('vid_id', 'description', 'sku', 'ost_cz')

    def get_sku(self, obj):
        return getattr(obj, 'sku', 0)

    def get_ost_cz(self, obj):
        value = getattr(obj, 'ost_cz', 0)  # По умолчанию 0, если атрибута нет
        value = value if value is not None else 0  # Если value None, заменяем на 0
        return f"{int(value):,}".replace(',', ' ')  # Только целое число с пробелами


class GroupSerializer(serializers.ModelSerializer):
    vids = VidSerializer(many=True, read_only=True)
    sku = serializers.SerializerMethodField()
    ost_cz = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('group_id', 'description', 'sku', 'vids', 'ost_cz')

    def get_sku(self, obj):
        return getattr(obj, 'sku', 0)

    def get_ost_cz(self, obj):
        value = getattr(obj, 'ost_cz', 0)  # По умолчанию 0, если атрибута нет
        value = value if value is not None else 0  # Если value None, заменяем на 0
        return f"{int(value):,}".replace(',', ' ')  # Только целое число с пробелами


class CategorySerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    sku = serializers.SerializerMethodField()
    ost_cz = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('category_id', 'description', 'sku', 'groups', 'ost_cz')

    def get_sku(self, obj):
        return getattr(obj, 'sku', 0)

    def get_ost_cz(self, obj):
        value = getattr(obj, 'ost_cz', 0)  # По умолчанию 0, если атрибута нет
        value = value if value is not None else 0  # Если value None, заменяем на 0
        return f"{int(value):,}".replace(',', ' ')  # Только целое число с пробелами


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'description']


class MarketProductSerializer(serializers.ModelSerializer):
       # Дополнительное поле:
    currency_name = serializers.CharField(
        source='currency.description',   # Берём description из связанной модели Currency
        read_only=True
    )
    class Meta:
        model = MarketProduct
        fields = [
            'id',
            'photo_path',
            'cz',
            'currency',
            'currency_name',   # Новое поле: описание валюты
            'provider',
            'min_shipment',
            'country',
            'city',
            'description',
            'qty_per_package',
            'price_list_delivery_15',
            'delivery_time',
            'price_list_delivery_30',
            'price_list_delivery_45',
            'qty_provider',
            'fulfillment_time',
            'date_create',
        ]

class MPRProductSerializer(serializers.ModelSerializer):
    market_products = MarketProductSerializer(many=True, read_only=True)
    class Meta:
        model = MPRProduct
        fields = [
            'encode',
            'description',
            'photo_path',
            'provider',
            'category',
            'group',
            'vid',
            'date_start_sell',
            'months_in_the_network',
            'cz',
            'cp',
            'markup',
            'margin',
            'avg_qty_sales_6_months',
            'market_products',
            'code',
        ]


class MarketProductDetailSerializer(serializers.ModelSerializer):
    parent_detail = MPRProductSerializer(source='parent', read_only=True)

    # Добавляем
    currency_name = serializers.CharField(
        source='currency.description',
        read_only=True
    )

    class Meta:
        model = MarketProduct
        fields = [
            'id',
            'photo_path',
            'cz',
            'currency',
            'currency_name',  # <-- добавляем сюда
            'provider',
            'min_shipment',
            'country',
            'city',
            'description',
            'qty_per_package',
            'price_list_delivery_15',
            'delivery_time',
            'price_list_delivery_30',
            'price_list_delivery_45',
            'qty_provider',
            'fulfillment_time',
            'parent_detail',
            'date_create',
        ]



class MarketProductCreateSerializer(serializers.ModelSerializer):
    photo_file = serializers.ImageField(write_only=True, required=False)
    parent = serializers.CharField(write_only=True)

    class Meta:
        model = MarketProduct
        fields = [
            'id',
            'parent',
            'photo_file',
            'cz',
            'currency',
            'provider',
            'min_shipment',
            'country',
            'city',
            'description',
            'qty_per_package',
            'price_list_delivery_15',
            'delivery_time',
            'price_list_delivery_30',
            'price_list_delivery_45',
            'qty_provider',
            'fulfillment_time',
            'date_create',
        ]

    def create(self, validated_data):
        photo_file = validated_data.pop('photo_file', None)
        parent_encode = validated_data.pop('parent', None)
    
        if not parent_encode:
            raise serializers.ValidationError("Поле parent обязательно.")
    
        # Находим родительский товар
        try:
            parent_instance = MPRProduct.objects.get(encode=parent_encode)
        except MPRProduct.DoesNotExist:
            raise serializers.ValidationError("Родительский товар не найден")
    
        # Устанавливаем поле parent_id
        validated_data['parent_id'] = parent_instance.encode
    
        # Поля, которые могут быть пустыми, приводим к None
        for field in [
            'currency', 'min_shipment', 'city', 'qty_per_package',
            'price_list_delivery_15', 'delivery_time', 'price_list_delivery_30',
            'qty_provider', 'fulfillment_time', 'price_list_delivery_45'
        ]:
            if field in validated_data and validated_data[field] == '':
                validated_data[field] = None

        # Обработка фото: сжатие и сохранение
        if photo_file:
            # Открываем файл через Pillow
            image = Image.open(photo_file)
            # При необходимости можно проверить разрешение (image.width, image.height) или размер файла
            
            # Преобразуем в RGB (если, например, хотим сохранить только в jpeg)
            image = image.convert('RGB')
            
            # Сжимаем и сохраняем в буфер (BytesIO)
            buffer = BytesIO()
            # quality=70 - это примерное значение, подбирайте под свои нужды
            # optimize=True может замедлить сохранение, но даёт дополнительное уменьшение
            image.save(buffer, format='JPEG', optimize=True, quality=70)
            
            # Формируем имя файла
            file_name = f"{parent_encode}_{photo_file.name.rsplit('.', 1)[0]}.jpg"
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'market_product')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Путь сохранения
            file_path = os.path.join(upload_dir, file_name)
            
            # Записываем байты из буфера в целевой файл
            with open(file_path, 'wb+') as destination:
                destination.write(buffer.getvalue())
            
            validated_data['photo_path'] = file_name

        # Устанавливаем дату создания
        validated_data['date_create'] = datetime.date.today().strftime('%d.%m.%Y')
        instance = super().create(validated_data)
        return instance


class MarketProductUpdateSerializer(serializers.ModelSerializer):
    photo_file = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = MarketProduct
        fields = [
            'id',
            'photo_path',
            'cz',
            'currency',
            'provider',
            'min_shipment',
            'country',
            'city',
            'description',
            'qty_per_package',
            'price_list_delivery_15',
            'delivery_time',
            'price_list_delivery_30',
            'price_list_delivery_45',
            'qty_provider',
            'fulfillment_time',
            'photo_file',
            'date_create',
        ]

    def update(self, instance, validated_data):
        new_photo = validated_data.pop('photo_file', None)
        if new_photo:
            # Если старое фото есть – удаляем
            if instance.photo_path:
                old_file_path = os.path.join('market_product', instance.photo_path)
                if default_storage.exists(old_file_path):
                    default_storage.delete(old_file_path)
            
            # Открываем новое изображение через Pillow и сжимаем
            image = Image.open(new_photo)
            # Корректируем ориентацию изображения на основе EXIF-данных
            image = ImageOps.exif_transpose(image)
            image = image.convert('RGB')
            buffer = BytesIO()
            image.save(buffer, format='JPEG', optimize=True, quality=70)

            # Формируем имя файла
            parent_identifier = instance.parent.encode if instance.parent and hasattr(instance.parent, 'encode') else instance.id
            new_file_name = f"{parent_identifier}_{new_photo.name.rsplit('.', 1)[0]}.jpg"
            upload_path = os.path.join('market_product', new_file_name)

            # Сохраняем в default_storage из буфера
            default_storage.save(upload_path, buffer)

            validated_data['photo_path'] = new_file_name

        return super().update(instance, validated_data)

# class MarketProductCreateSerializer(serializers.ModelSerializer):
#     # Поле для загрузки файла (фото)
#     photo_file = serializers.ImageField(write_only=True, required=False)
#     # Поле для передачи кода родительского товара (MPRProduct.encode)
#     parent = serializers.CharField(write_only=True)

#     class Meta:
#         model = MarketProduct
#         fields = [
#             'id',
#             'parent',
#             'photo_file',
#             'cz',
#             'currency',
#             'provider',
#             'min_shipment',
#             'country',
#             'city',
#             'description',
#             'qty_per_package',
#             'price_list_delivery_15',
#             'delivery_time',
#             'price_list_delivery_30',
#             'price_list_delivery_45',
#             'qty_provider',
#             'fulfillment_time',
#             'date_create',
#         ]

#     def create(self, validated_data):
#         # Извлекаем фото и код родительского товара из входящих данных
#         photo_file = validated_data.pop('photo_file', None)
#         parent_encode = validated_data.pop('parent', None)
    
#         if not parent_encode:
#             raise serializers.ValidationError("Поле parent обязательно.")
    
#         # Находим родительский товар по его encode
#         try:
#             parent_instance = MPRProduct.objects.get(encode=parent_encode)
#         except MPRProduct.DoesNotExist:
#             raise serializers.ValidationError("Родительский товар не найден")
    
#         # Устанавливаем поле parent_id
#         validated_data['parent_id'] = parent_instance.encode
    
#         # Если для некоторых полей пришли пустые строки, приводим их к None
#         for field in ['currency', 'min_shipment', 'city', 'qty_per_package',
#                   'price_list_delivery_15', 'delivery_time',
#                   'price_list_delivery_30', 'qty_provider',
#                 'fulfillment_time', 'price_list_delivery_45']:
#             if field in validated_data and validated_data[field] == '':
#                 validated_data[field] = None
    
#         # Если файл передан, сохраняем его в папке media/market_product/
#         if photo_file:
#             file_name = f"{parent_encode}_{photo_file.name}"
#             upload_dir = os.path.join(settings.MEDIA_ROOT, 'market_product')
#             os.makedirs(upload_dir, exist_ok=True)
#             file_path = os.path.join(upload_dir, file_name)
#             with open(file_path, 'wb+') as destination:
#                 for chunk in photo_file.chunks():
#                     destination.write(chunk)
#             validated_data['photo_path'] = file_name
#         # Устанавливаем дату создания – сегодняшняя дата в формате "YYYY-MM-DD"
#         validated_data['date_create'] = datetime.date.today().strftime('%d.%m.%Y')

#         # Создаем объект, используя обновленные данные
#         instance = super().create(validated_data)
    
#         return instance



# class MarketProductUpdateSerializer(serializers.ModelSerializer):
#     photo_file = serializers.ImageField(write_only=True, required=False)

#     class Meta:
#         model = MarketProduct
#         fields = [
#             'id',
#             'photo_path',  # обновляется, если загружен новый файл
#             'cz',
#             'currency',
#             'provider',
#             'min_shipment',
#             'country',
#             'city',
#             'description',
#             'qty_per_package',
#             'price_list_delivery_15',
#             'delivery_time',
#             'price_list_delivery_30',
#             'price_list_delivery_45',
#             'qty_provider',
#             'fulfillment_time',
#             'photo_file',  # поле для загрузки нового файла
#             'date_create',
#         ]

#     def update(self, instance, validated_data):
#         new_photo = validated_data.pop('photo_file', None)
#         if new_photo:
#             # Если старое фото существует, удаляем его
#             if instance.photo_path:
#                 old_file_path = os.path.join('market_product', instance.photo_path)
#                 if default_storage.exists(old_file_path):
#                     default_storage.delete(old_file_path)
#             # Формируем новое имя файла с использованием идентификатора родителя (encode) или id
#             parent_identifier = instance.parent.encode if instance.parent and hasattr(instance.parent, 'encode') else instance.id
#             new_file_name = f"{parent_identifier}_{new_photo.name}"
#             upload_path = os.path.join('market_product', new_file_name)
#             default_storage.save(upload_path, new_photo)
#             validated_data['photo_path'] = new_file_name
#         return super().update(instance, validated_data)