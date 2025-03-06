# admin_panel/views_react.py
import os
from django.http import HttpResponse
from django.conf import settings

def serve_react(request):
    with open(r'C:\Users\Analitik\Desktop\Directory\my-spa\build\index.html', 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())