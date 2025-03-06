import os
import uuid
import json
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Импорт моделей
from products.models import Category, Group, Vid, MPRProduct

def upsert_category(data_list):
    # В Category не обновляем primary key "category_id"
    skip_fields = {"category_id"}
    for item in data_list:
        pk = item.get("category_id")
        if pk is not None:
            try:
                obj = Category.objects.get(category_id=pk)
                for field, value in item.items():
                    if field not in skip_fields:
                        setattr(obj, field, value)
                obj.save()
            except Category.DoesNotExist:
                Category.objects.create(**item)
        else:
            Category.objects.create(**item)

def upsert_group(data_list):
    # Для Group не обновляем primary key "group_id" и внешний ключ "category"
    skip_fields = {"group_id", "category_id"}
    for item in data_list:
        pk = item.get("group_id")
        if pk is not None:
            try:
                obj = Group.objects.get(group_id=pk)
                for field, value in item.items():
                    if field not in skip_fields:
                        setattr(obj, field, value)
                obj.save()
            except Group.DoesNotExist:
                Group.objects.create(**item)
        else:
            Group.objects.create(**item)

def upsert_vid(data_list):
    # Для Vid не обновляем primary key "vid_id" и внешний ключ "group"
    skip_fields = {"vid_id", "group_id"}
    for item in data_list:
        pk = item.get("vid_id")
        if pk is not None:
            try:
                obj = Vid.objects.get(vid_id=pk)
                for field, value in item.items():
                    if field not in skip_fields:
                        setattr(obj, field, value)
                obj.save()
            except Vid.DoesNotExist:
                Vid.objects.create(**item)
        else:
            Vid.objects.create(**item)

def upsert_mpr_product(data_list):
    # Для MPRProduct не обновляем primary key "encode" и внешние ключи "category", "group", "vid"
    skip_fields = {"encode", "category_id", "group_id", "vid_id"}
    for item in data_list:
        pk = item.get("encode")
        if pk is not None:
            try:
                obj = MPRProduct.objects.get(encode=pk)
                for field, value in item.items():
                    if field not in skip_fields:
                        setattr(obj, field, value)
                obj.save()
            except MPRProduct.DoesNotExist:
                MPRProduct.objects.create(**item)
        else:
            MPRProduct.objects.create(**item)

@method_decorator(csrf_exempt, name='dispatch')
class JSONDataImportView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]  # доступ открыт, можно добавить проверку IP, если нужно
    authentication_classes = []     # отключаем встроенную аутентификацию, если требуется

    def post(self, request, format=None):
        # 1. Проверяем IP-адрес отправителя (например, через X-Real-IP)
        ip = request.META.get('HTTP_X_REAL_IP')
        allowed_ips = getattr(settings, 'IMPORT_ALLOWED_IPS', [])
        if ip not in allowed_ips:
            return Response({'detail': f'Доступ запрещён: {ip}'},
                            status=status.HTTP_403_FORBIDDEN)

        # 2. Проверяем наличие файла данных
        data_file = request.FILES.get('dump_file')
        if not data_file:
            return Response({'detail': 'Файл данных обязателен.'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Сохраняем файл в папку C:\dumps\ с уникальным именем
        dumps_dir = r'C:\dumps'
        if not os.path.exists(dumps_dir):
            try:
                os.makedirs(dumps_dir)
            except Exception as e:
                return Response({'detail': f'Ошибка создания директории: {str(e)}'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        unique_file_name = f"{uuid.uuid4()}_{data_file.name}"
        file_path = os.path.join(dumps_dir, unique_file_name)
        
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in data_file.chunks():
                    destination.write(chunk)
        except Exception as e:
            return Response({'detail': f'Ошибка сохранения файла: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 4. Открываем сохранённый файл и парсим JSON
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            return Response({'detail': f'Ошибка чтения или парсинга JSON: {str(e)}'},
                            status=status.HTTP_400_BAD_REQUEST)
        
        # 5. Выполняем upsert в транзакции (без полного удаления записей)
        try:
            with transaction.atomic():
                if "category" in data:
                    upsert_category(data["category"])
                if "group" in data:
                    upsert_group(data["group"])
                if "vid" in data:
                    upsert_vid(data["vid"])
                if "mpr_product" in data:
                    upsert_mpr_product(data["mpr_product"])
        except Exception as e:
            return Response({'detail': f'Ошибка импорта данных: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'detail': 'Данные успешно импортированы.'},
                        status=status.HTTP_200_OK)
