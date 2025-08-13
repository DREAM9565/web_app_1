from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    USER_ROLES = (
        ('admin', 'Администратор'),
        ('km', 'Категорийный менеджер'),
        ('buyer', 'Байер'),
        ('user', 'Пользователь'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(
        max_length=20, 
        choices=USER_ROLES, 
        default='user',
        verbose_name="Роль пользователя"
    )

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"
