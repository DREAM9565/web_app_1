from django.db import models
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files import File
from django.contrib.auth import get_user_model
from django.dispatch import receiver
from django.db.models.signals import post_delete
import os
import logging

User = get_user_model()

logger = logging.getLogger(__name__)

# Модель для категорий запросов
class RequestCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название")
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "Категория запроса"
        verbose_name_plural = "Категории запросов"

# Модель для групп запросов
class RequestGroup(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название")
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "Группа запроса"
        verbose_name_plural = "Группы запросов"

# Модель для видов запросов
class RequestVid(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название")
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "Вид запроса"
        verbose_name_plural = "Виды запросов"

# Модель для валют запросов
class RequestCurrency(models.Model):
    description = models.CharField(max_length=10, verbose_name="Описание")
    def __str__(self):
        return self.description
    class Meta:
        verbose_name = "Валюта запроса"
        verbose_name_plural = "Валюты запросов"

# Модель для запросов на добавление товара
class ProductRequest(models.Model):
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='product_requests',
        verbose_name="Создатель",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, verbose_name="Наименование")
    description = models.TextField(verbose_name="Описание")
    product_link = models.URLField(
        verbose_name="Ссылка на товар", 
        blank=True, 
        null=True,
        max_length=500
    )
    desired_purchase_price = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Желаемая цена закупки"
    )
    category = models.ForeignKey(
        RequestCategory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Категория"
    )
    group = models.ForeignKey(
        RequestGroup, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Группа"
    )
    vid = models.ForeignKey(
        RequestVid, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Вид"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    processed_by_km = models.BooleanField(default=False, verbose_name="Отработано КМ")
    processed_by_buyer = models.BooleanField(default=False, verbose_name="Отработано Байером")

    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "Запрос на добавление товара"
        verbose_name_plural = "Запросы на добавление товаров"

    def delete(self, *args, **kwargs):
        try:
            logger.info(f"Начало удаления запроса ID: {self.id}")
            
            # Удаляем связанные изображения
            for image in self.images.all():
                try:
                    logger.info(f"Удаление изображения ID: {image.id} для запроса {self.id}")
                    image.delete()  # Это вызовет метод delete для каждого изображения
                except Exception as e:
                    logger.error(f"Ошибка при удалении изображения {image.id}: {str(e)}")

            # Удаляем связанные рыночные товары
            market_products = self.market_products.all()
            for product in market_products:
                try:
                    logger.info(f"Удаление рыночного товара ID: {product.id} для запроса {self.id}")
                    # Удаляем изображения рыночного товара
                    for image in product.images.all():
                        try:
                            logger.info(f"Удаление изображения ID: {image.id} рыночного товара {product.id}")
                            image.delete()
                        except Exception as e:
                            logger.error(f"Ошибка при удалении изображения {image.id} рыночного товара: {str(e)}")
                    product.delete()
                except Exception as e:
                    logger.error(f"Ошибка при удалении рыночного товара {product.id}: {str(e)}")

            logger.info(f"Удаление самого запроса ID: {self.id}")
            super().delete(*args, **kwargs)
            logger.info(f"Запрос ID: {self.id} успешно удален")
            
        except Exception as e:
            logger.error(f"Ошибка при удалении запроса {self.id}: {str(e)}")
            raise

# Модель для изображений запросов
class ProductRequestImage(models.Model):
    request = models.ForeignKey(
        ProductRequest, on_delete=models.CASCADE, related_name='images', verbose_name="Запрос"
    )
    image = models.ImageField(upload_to='product_requests/images/', verbose_name="Фото")

    def save(self, *args, **kwargs):
        if self.image:
            img = Image.open(self.image)
            img = ImageOps.exif_transpose(img)
            img = img.convert('RGB')
            img.thumbnail((800, 800))
            output = BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)
            self.image = File(output, self.image.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Фото для {self.request.name}"
    class Meta:
        verbose_name = "Изображение запроса"
        verbose_name_plural = "Изображения запросов"

    def delete(self, *args, **kwargs):
        # Удаляем файл с диска
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)

# Сигнал для удаления файлов при удалении через QuerySet
@receiver(post_delete, sender=ProductRequestImage)
def delete_image_file(sender, instance, **kwargs):
    if instance.image:
        if os.path.isfile(instance.image.path):
            os.remove(instance.image.path)

# Модель для рыночных товаров, связанных с запросами
class MarketProductRequest(models.Model):
    request = models.ForeignKey(
        ProductRequest, on_delete=models.CASCADE, related_name='market_products', verbose_name="Запрос"
    )
    description = models.TextField(verbose_name="Описание")
    cz = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена закупки")
    currency = models.ForeignKey(
        RequestCurrency, on_delete=models.SET_NULL, null=True, verbose_name="Валюта"
    )
    provider = models.CharField(max_length=255, verbose_name="Поставщик")
    min_shipment = models.IntegerField(verbose_name="Минимальная партия")
    country = models.CharField(max_length=100, verbose_name="Страна")
    city = models.CharField(max_length=100, verbose_name="Город")
    qty_per_package = models.IntegerField(verbose_name="Количество в упаковке")
    price_list_delivery_15 = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена доставки (15 дней)"
    )
    delivery_time = models.CharField(max_length=50, verbose_name="Срок доставки")
    fulfillment_time = models.CharField(max_length=50, verbose_name="Срок исполнения")
    qty_provider = models.IntegerField(default=0, verbose_name="Количество у поставщика")
    price_list_delivery_30 = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена доставки (30 дней)"
    )
    price_list_delivery_45 = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена доставки (45 дней)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    def __str__(self):
        return f"{self.description} (Запрос: {self.request.name})"
    class Meta:
        verbose_name = "Рыночный товар (запрос)"
        verbose_name_plural = "Рыночные товары (запросы)"

# Модель для изображений рыночных товаров
class MarketProductRequestImage(models.Model):
    product = models.ForeignKey(
        MarketProductRequest, on_delete=models.CASCADE, related_name='images', verbose_name="Товар"
    )
    image = models.ImageField(upload_to='market_products/images/', verbose_name="Фото")

    def save(self, *args, **kwargs):
        if self.image:
            img = Image.open(self.image)
            img = ImageOps.exif_transpose(img)
            img = img.convert('RGB')
            img.thumbnail((800, 800))
            output = BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)
            self.image = File(output, self.image.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Фото для {self.product.description}"
    class Meta:
        verbose_name = "Изображение рыночного товара (запрос)"
        verbose_name_plural = "Изображения рыночных товаров (запросы)"