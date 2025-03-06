class CsrfExemptForImportMiddleware:
    """
    Middleware, который отключает CSRF-проверку только для эндпоинта /api/db/import/.
    Для всех остальных запросов CSRF остаётся включённым.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Если путь запроса начинается с /api/db/import/, пропускаем проверку CSRF
        if request.path.startswith('/api/db/import/'):
            setattr(request, '_dont_enforce_csrf_checks', True)

        response = self.get_response(request)
        return response
