# accounts/api_views.py
from rest_framework import generics, status
from django.contrib.auth.models import User
from .serializers import RegistrationSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({"detail": "Login successful"})
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@method_decorator(csrf_exempt, name='dispatch')
class RegistrationAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


# --- Добавляем НОВЫЕ классы ниже ---


@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        # Удаляем сессию
        logout(request)
        return Response({"detail": "Logged out successfully"})


class WhoAmIAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,       # <-- добавляем
            "is_superuser": user.is_superuser  # <-- добавляем, если нужно
        })

