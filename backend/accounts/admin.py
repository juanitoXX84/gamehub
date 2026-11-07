from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import GameHubUserChangeForm, GameHubUserCreationForm
from .models import User


@admin.register(User)
class GameHubUserAdmin(UserAdmin):
    form = GameHubUserChangeForm
    add_form = GameHubUserCreationForm

    list_display = ("email", "username", "matricula", "is_active", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("email", "username", "matricula", "first_name", "last_name")
    ordering = ("id",)
    readonly_fields = ("last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Datos personales", {"fields": ("username", "matricula", "first_name", "last_name")}),
        (
            "Permisos",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Fechas importantes", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "matricula",
                    "usable_password",
                    "password1",
                    "password2",
                ),
            },
        ),
    )
