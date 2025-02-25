# admin_panel/views_react.py
import os
from django.http import HttpResponse
from django.conf import settings

def serve_react(request):
    """
    Отдает React index.html для всех маршрутов, не пойманных предыдущими URL.
    Предполагается, что после сборки React файлы находятся в папке build.
    """
    index_file_path = os.path.join(settings.BASE_DIR, 'build', 'index.html')
    try:
        with open(index_file_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        return HttpResponse(
            "<h1>React build не найден</h1><p>Сначала выполните сборку React приложения командой <code>npm run build</code>.</p>",
            status=501,
        )


# import os
# from django.conf import settings
# from django.http import HttpResponse, Http404

# def serve_react(request):
#     try:
#         react_index = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')
#         with open(react_index, 'r', encoding='utf-8') as f:
#             return HttpResponse(f.read())
#     except IOError:
#         raise Http404("index.html не найден")
