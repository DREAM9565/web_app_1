# accounts/api_views_admin.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import AdminUserSerializer
from rest_framework.permissions import IsAdminUser
from django.contrib.sessions.models import Session

# Список пользователей + создание
class AdminUserListAPIView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    # Только админ (is_staff=True) имеет доступ
    permission_classes = [permissions.IsAdminUser]

# Детальная вьюха для получения / редактирования / удаления конкретного пользователя
class AdminUserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        old_password = user.password
        old_username = user.username  # если надо

        response = super().update(request, *args, **kwargs)

        # После успешного update сериализатор уже изменил user
        user.refresh_from_db()

        # Если пароль изменился:
        if user.password != old_password:
            self._kill_user_sessions(user)

        # Если нужно "выкидывать" и при смене логина - проверяем:
        if user.username != old_username:
            self._kill_user_sessions(user)

        return response

    def _kill_user_sessions(self, user):
        # Удаляем все сессии, где _auth_user_id == user.id
        for session in Session.objects.all():
            data = session.get_decoded()
            if data.get('_auth_user_id') == str(user.id):
                session.delete()