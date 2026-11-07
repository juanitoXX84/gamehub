from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from .models import User


class GameHubUserCreationForm(AdminUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "username", "matricula")


class GameHubUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"
