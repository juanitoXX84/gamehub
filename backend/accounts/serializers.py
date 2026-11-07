from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import matricula_validator

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


# --- Validaciones compartidas ---------------------------------------------------


def _others(instance):
    queryset = User.objects.all()
    return queryset.exclude(pk=instance.pk) if instance is not None else queryset


def clean_username(value, instance=None):
    value = value.strip()
    if _others(instance).filter(username__iexact=value).exists():
        raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
    return value


def clean_email(value, instance=None):
    value = User.objects.normalize_email(value.strip()).lower()
    if _others(instance).filter(email__iexact=value).exists():
        raise serializers.ValidationError("Ya existe una cuenta con este correo electrónico.")
    return value


def clean_matricula(value, instance=None):
    value = value.strip().upper()
    if _others(instance).filter(matricula__iexact=value).exists():
        raise serializers.ValidationError("Esta matrícula ya está registrada.")
    return value


def check_password_strength(password, user):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError({"password": list(exc.messages)})


USERNAME_ERRORS = {
    "blank": "El nombre de usuario es obligatorio.",
    "required": "El nombre de usuario es obligatorio.",
    "min_length": "El nombre de usuario debe tener al menos 3 caracteres.",
    "max_length": "El nombre de usuario no puede superar los 30 caracteres.",
}
EMAIL_ERRORS = {
    "blank": "El correo electrónico es obligatorio.",
    "required": "El correo electrónico es obligatorio.",
    "invalid": "Introduce un correo electrónico válido.",
}
MATRICULA_ERRORS = {
    "blank": "La matrícula es obligatoria.",
    "required": "La matrícula es obligatoria.",
}
PASSWORD_ERRORS = {
    "blank": "La contraseña es obligatoria.",
    "required": "La contraseña es obligatoria.",
}


# --- Lectura ------------------------------------------------------------------------


class UserSerializer(serializers.ModelSerializer):
    """Representación pública de un usuario. Nunca incluye la contraseña ni su hash."""

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "matricula",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
        )
        read_only_fields = fields


# --- Registro -----------------------------------------------------------------------


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(
        min_length=3,
        max_length=30,
        validators=[UnicodeUsernameValidator()],
        error_messages=USERNAME_ERRORS,
    )
    email = serializers.EmailField(max_length=254, error_messages=EMAIL_ERRORS)
    matricula = serializers.CharField(
        max_length=20, validators=[matricula_validator], error_messages=MATRICULA_ERRORS
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
        style={"input_type": "password"},
        error_messages=PASSWORD_ERRORS,
    )
    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
        style={"input_type": "password"},
        error_messages={"blank": "Confirma tu contraseña.", "required": "Confirma tu contraseña."},
    )

    def validate_username(self, value):
        return clean_username(value)

    def validate_email(self, value):
        return clean_email(value)

    def validate_matricula(self, value):
        return clean_matricula(value)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        candidate = User(username=attrs["username"], email=attrs["email"], matricula=attrs["matricula"])
        check_password_strength(attrs["password"], candidate)
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)

    def to_representation(self, instance):
        return UserSerializer(instance).data


# --- Actualización ------------------------------------------------------------------


class UserUpdateSerializer(serializers.ModelSerializer):
    """Actualiza un usuario.

    - Si no se envía `password`, la contraseña actual permanece intacta.
    - Si se envía, se valida y se guarda con `set_password()` (hash), solo en el
      usuario que se está editando.
    """

    username = serializers.CharField(
        min_length=3,
        max_length=30,
        validators=[UnicodeUsernameValidator()],
        error_messages=USERNAME_ERRORS,
    )
    email = serializers.EmailField(max_length=254, error_messages=EMAIL_ERRORS)
    matricula = serializers.CharField(
        max_length=20, validators=[matricula_validator], error_messages=MATRICULA_ERRORS
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        trim_whitespace=False,
        max_length=128,
        style={"input_type": "password"},
        error_messages={"blank": "La nueva contraseña no puede estar vacía."},
    )

    class Meta:
        model = User
        fields = ("email", "username", "matricula", "first_name", "last_name", "password")

    def validate_username(self, value):
        return clean_username(value, self.instance)

    def validate_email(self, value):
        return clean_email(value, self.instance)

    def validate_matricula(self, value):
        return clean_matricula(value, self.instance)

    def validate(self, attrs):
        password = attrs.get("password")
        if password:
            target = self.instance
            check_password_strength(
                password,
                User(
                    username=attrs.get("username", target.username),
                    email=attrs.get("email", target.email),
                    matricula=attrs.get("matricula", target.matricula),
                ),
            )
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance

    def to_representation(self, instance):
        return UserSerializer(instance).data


# --- Sesión ------------------------------------------------------------------------


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages=EMAIL_ERRORS)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
        error_messages=PASSWORD_ERRORS,
    )

    default_error = "Correo electrónico o contraseña incorrectos."

    def validate(self, attrs):
        user = authenticate(
            self.context.get("request"),
            email=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
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


# --- Solo para documentación (Swagger) ----------------------------------------


class TokenPairSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()


class AuthResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    tokens = TokenPairSerializer()


class DetailSerializer(serializers.Serializer):
    detail = serializers.CharField()
