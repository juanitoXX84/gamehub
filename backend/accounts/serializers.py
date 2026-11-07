from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "date_joined", "last_login")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(
        min_length=3,
        max_length=30,
        validators=[UnicodeUsernameValidator()],
        error_messages={
            "blank": "El nombre de usuario es obligatorio.",
            "required": "El nombre de usuario es obligatorio.",
            "min_length": "El nombre de usuario debe tener al menos 3 caracteres.",
            "max_length": "El nombre de usuario no puede superar los 30 caracteres.",
        },
    )
    email = serializers.EmailField(
        max_length=254,
        error_messages={
            "blank": "El correo electrónico es obligatorio.",
            "required": "El correo electrónico es obligatorio.",
            "invalid": "Introduce un correo electrónico válido.",
        },
    )
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
        error_messages={
            "blank": "La contraseña es obligatoria.",
            "required": "La contraseña es obligatoria.",
        },
    )
    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
        error_messages={
            "blank": "Confirma tu contraseña.",
            "required": "Confirma tu contraseña.",
        },
    )

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def validate_email(self, value):
        value = User.objects.normalize_email(value.strip()).lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo electrónico.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        candidate = User(username=attrs["username"], email=attrs["email"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={
            "blank": "El correo electrónico es obligatorio.",
            "required": "El correo electrónico es obligatorio.",
            "invalid": "Introduce un correo electrónico válido.",
        }
    )
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "blank": "La contraseña es obligatoria.",
            "required": "La contraseña es obligatoria.",
        },
    )

    default_error = "Correo electrónico o contraseña incorrectos."

    def validate(self, attrs):
        request = self.context.get("request")
        email = attrs["email"].strip()
        user = None
        for candidate in User.objects.filter(email__iexact=email):
            user = authenticate(
                request, username=candidate.get_username(), password=attrs["password"]
            )
            if user:
                break

        if user is None:
            raise serializers.ValidationError({"non_field_errors": [self.default_error]})
        attrs["user"] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        error_messages={
            "blank": "Falta el token de actualización.",
            "required": "Falta el token de actualización.",
        }
    )
