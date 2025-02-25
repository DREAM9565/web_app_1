from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def update(self, instance, validated_data):
        # Если передали password, нужно его устанавливать через set_password
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def create(self, validated_data):
        # При создании тоже обрабатываем пароль
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
    def validate(self, data):
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError("Пароли не совпадают")
        return data
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user
