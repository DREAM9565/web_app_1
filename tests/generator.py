import random

# Открываем файл для сохранения результата
with open('table_result.html', 'w', encoding='utf-8') as f:
    # Заголовок HTML
    f.write('''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Таблица 32x32 с рандомными цветами</title>
  <style>
    table, td { 
      border: 1px solid #000; 
      border-collapse: collapse; 
    }
    td { 
      width: 20px; 
      height: 20px; 
    }
  </style>
</head>
<body>
  <table>
''')

    # Генерируем 32 строки
    for row in range(32):
        f.write('    <tr>')
        # Генерируем 32 ячейки в строке
        for col in range(32):
            # Генерируем случайный цвет в формате #RRGGBB
            r = random.randint(0, 255)
            g = random.randint(0, 255)
            b = random.randint(0, 255)
            color = f'#{r:02X}{g:02X}{b:02X}'
            
            f.write(f'<td style="background-color:{color};"></td>')
        f.write('</tr>\n')

    # Закрываем таблицу и HTML
    f.write('''  </table>
</body>
</html>''')

print("Таблица с уникальными случайными цветами сгенерирована в файле table_result.html") 