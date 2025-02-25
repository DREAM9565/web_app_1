import csv
import os
import requests
import sys
from datetime import datetime

# Путь к CSV-файлу
csv_path = r"\\ad.modniy.org\analitik\Аналитический отдел\МПР\фотки\photo_otbor.csv"

# Базовый URL для фото
base_url = "https://mpr-shop.ru/img/guid/1.jpg"

# Папка сохранения
save_folder = os.path.dirname(csv_path)

# Путь для лог-файла
log_path = os.path.join(save_folder, "photo_download.log")

# Функция логирования в файл
def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    with open(log_path, "a", encoding="utf-8") as log_file:
        log_file.write(f"{timestamp} {message}\n")

log("=== Начало загрузки изображений ===")

# Читаем CSV и получаем общее количество строк
with open(csv_path, newline='', encoding='utf-8-sig') as csvfile:
    reader = list(csv.DictReader(csvfile))  # Преобразуем в список, чтобы считать длину
    total_rows = len(reader)

# Обрабатываем данные
processed_count = 0
success_count = 0  # Счётчик успешных загрузок
error_count = 0   # Счётчик ошибок

with open(csv_path, newline='', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile)

    for row in reader:
        processed_count += 1

        code = row["_code"].strip('"')
        guid = row["guid"].strip('"')

        if not code or not guid:
            log(f"Пропущена строка: {row}")
            continue

        image_url = base_url.replace("guid", guid)
        print(image_url)
        save_path = os.path.join(save_folder, f"{code}.jpg")
        
        try:
            response = requests.get(image_url, stream=True)
            if response.status_code == 200:
                with open(save_path, "wb") as img_file:
                    for chunk in response.iter_content(1024):
                        img_file.write(chunk)
                success_count += 1
                log(f"Сохранено: {code}.jpg ({image_url})")
            else:
                error_count += 1
                log(f"Ошибка скачивания {image_url}: Код {response.status_code}")

        except Exception as e:
            error_count += 1
            log(f"Ошибка при обработке {code}: {e}")

        # Выводим динамический счётчик в консоль
        sys.stdout.write(f"\rОбработано: {processed_count}/{total_rows}")
        sys.stdout.flush()

# Логируем итоги
log(f"=== Загрузка завершена ===\nУспешно скачано: {success_count}\nОшибки: {error_count}")
print(f"\n=== Готово! ===")
print(f"Успешно скачано: {success_count}")
print(f"Ошибки: {error_count}")
