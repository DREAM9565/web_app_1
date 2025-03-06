# db_importer/urls.py
from django.urls import path
from .views import JSONDataImportView

urlpatterns = [
    path('import/', JSONDataImportView.as_view(), name='data-import'),
]
