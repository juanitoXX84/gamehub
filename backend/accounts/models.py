from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models

matricula_validator = RegexValidator(
    regex=r"^[A-Za-z0-9-]{4,20}$",
    message="La matrícula debe tener entre 4 y 20 caracteres (letras, números o guiones).",
)


class UserManager(BaseUserManager):
    """Gestor de usuarios que usa el correo electrónico como identificador."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        if not extra_fields.get("username"):
            raise ValueError("El nombre de usuario es obligatorio.")
        if not extra_fields.get("matricula"):
            raise ValueError("La matrícula es obligatoria.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")
        return self._create_user(email, password, **extra_fields)

    def get_by_natural_key(self, email):
        return self.get(**{f"{self.model.USERNAME_FIELD}__iexact": email})


class User(AbstractUser):
    """Usuario de GameHub: inicia sesión con su correo y tiene una matrícula única."""

    email = models.EmailField("correo electrónico", unique=True)
    matricula = models.CharField(
        "matrícula",
        max_length=20,
        unique=True,
        validators=[matricula_validator],
        help_text="Identificador escolar o de registro del usuario (4 a 20 caracteres).",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "matricula"]

    objects = UserManager()

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
        ordering = ("id",)

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if self.matricula:
            self.matricula = self.matricula.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.matricula})"
