from django.db import models
from django.contrib.auth.models import User

# Модель для категорий
class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    description = models.TextField(null=True)
    _to = models.IntegerField(null=True)
    sku = models.IntegerField(null=True)
    ost_cz = models.IntegerField(null=True)
    class Meta:
        db_table = 'category'
        managed = False
    def __str__(self):
        return self.description

# Модель для валют
class Currency(models.Model):
    id = models.AutoField(primary_key=True)
    description = models.TextField(null=True)
    class Meta:
        db_table = 'currency'
        managed = False
    def __str__(self):
        return self.description

# Модель для групп
class Group(models.Model):
    group_id = models.AutoField(primary_key=True)
    description = models.TextField(null=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE, null=True, related_name='groups')
    _to = models.IntegerField(null=True)
    sku = models.IntegerField(null=True)
    ost_cz = models.IntegerField(null=True)
    class Meta:
        db_table = 'group'
        managed = False
    def __str__(self):
        return self.description

# Модель для видов
class Vid(models.Model):
    vid_id = models.AutoField(primary_key=True)
    description = models.TextField(null=True)
    group = models.ForeignKey('Group', on_delete=models.CASCADE, null=True, related_name='vids')
    _to = models.IntegerField(null=True)
    sku = models.IntegerField(null=True)
    ost_cz = models.IntegerField(null=True)
    class Meta:
        db_table = 'vid'
        managed = False
    def __str__(self):
        return self.description

# Основная модель товара
class MPRProduct(models.Model):
    code = models.TextField()
    description = models.TextField()
    photo_path = models.TextField()
    provider = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True)
    vid = models.ForeignKey(Vid, on_delete=models.SET_NULL, null=True)
    date_start_sell = models.DateField()
    months_in_the_network = models.IntegerField()
    cz = models.DecimalField(max_digits=10, decimal_places=2)
    cp = models.DecimalField(max_digits=10, decimal_places=2)
    markup = models.DecimalField(max_digits=10, decimal_places=2)
    margin = models.DecimalField(max_digits=10, decimal_places=2)
    avg_qty_sales_6_months = models.IntegerField()
    encode = models.TextField(primary_key=True)
    class Meta:
        db_table = 'mpr_product'
        managed = False
    def __str__(self):
        return self.description

# Модель рыночного товара
class MarketProduct(models.Model):
    id = models.AutoField(primary_key=True)
    parent = models.ForeignKey('MPRProduct', on_delete=models.CASCADE, related_name='market_products', db_column='parrent_id')
    photo_path = models.TextField(null=True, blank=True)
    date_create = models.TextField(null=True, blank=True)
    cz = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.ForeignKey('Currency', on_delete=models.SET_NULL, null=True, blank=True)
    qty_per_package = models.IntegerField(null=True, blank=True)
    provider = models.TextField(null=True, blank=True)
    min_shipment = models.IntegerField(null=True, blank=True)
    country = models.TextField(null=True, blank=True)
    city = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    price_list_delivery_15 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_list_delivery_30 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_list_delivery_45 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_time = models.TextField(null=True, blank=True)
    qty_provider = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fulfillment_time = models.DateField(null=True, blank=True)
    class Meta:
        db_table = 'market_product'
        managed = False
    def __str__(self):
        return self.description or ""

# Модель для логирования действий пользователей
class UserActionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)
    def __str__(self):
        return f"{self.user} - {self.action}"