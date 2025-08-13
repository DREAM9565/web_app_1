# accounts/api_views.py
from rest_framework import generics, status, viewsets, permissions
from django.contrib.auth.models import User
from .serializers import (
    RegistrationSerializer, 
    UserSerializer, 
    UserUpdateSerializer, 
    AdminUserSerializer
)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import action
from .models import UserProfile


class IsAdminOrSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.username == 'admin' or
            (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')
        )


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "detail": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "is_superuser": user.is_superuser,
                    "role": user.profile.role if hasattr(user, 'profile') else 'user'
                }
            })
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@method_decorator(csrf_exempt, name='dispatch')
class RegistrationAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]


# --- Добавляем НОВЫЕ классы ниже ---


@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, format=None):
        # Удаляем сессию
        logout(request)
        return Response({"detail": "Logged out successfully"})


class WhoAmIAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, format=None):
        user = request.user
        # Определяем роль
        role = 'admin'
        if not user.is_superuser and user.username != 'admin':
            role = user.profile.role if hasattr(user, 'profile') else 'user'

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": role,
            "profile": {
                "role": role
            }
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['GET'])
    def current_user(self, request):
        user = request.user
        # Определяем роль для текущего пользователя
        role = 'admin'
        if not user.is_superuser and user.username != 'admin':
            role = user.profile.role if hasattr(user, 'profile') else 'user'

        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile': {
                'role': role
            }
        }
        return Response(data)

    @action(detail=False, methods=['GET'])
    def km_users(self, request):
        users = User.objects.filter(profile__role='km')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def buyer_users(self, request):
        users = User.objects.filter(profile__role='buyer')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    def perform_update(self, serializer):
        if not (self.request.user.is_superuser or 
                self.request.user.username == 'admin' or
                (hasattr(self.request.user, 'profile') and 
                 self.request.user.profile.role == 'admin')):
            if 'profile' in serializer.validated_data:
                raise permissions.PermissionDenied("Только администратор может изменять роли пользователей")
        serializer.save()


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminOrSuperUser]

    def get_queryset(self):
        return User.objects.all().select_related('profile')

    @action(detail=False, methods=['GET'])
    def roles(self, request):
        return Response(dict(UserProfile.USER_ROLES))

