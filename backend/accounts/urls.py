from django.urls import include, path
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import LoginView, LogoutView, MeView, RegisterView, UserViewSet

JWT_TAG = "JWT"

TokenObtainView = extend_schema_view(
    post=extend_schema(tags=[JWT_TAG], summary="Obtener tokens JWT (correo y contraseña)")
)(TokenObtainPairView)
TokenRefreshDocView = extend_schema_view(
    post=extend_schema(tags=[JWT_TAG], summary="Renovar el access token")
)(TokenRefreshView)

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("users", UserViewSet, basename="users")

auth_urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", TokenRefreshDocView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
]

token_urlpatterns = [
    path("", TokenObtainView.as_view(), name="token-obtain"),
    path("refresh/", TokenRefreshDocView.as_view(), name="token-refresh"),
]

urlpatterns = [
    path("auth/", include(auth_urlpatterns)),
    path("token/", include(token_urlpatterns)),
    path("", include(router.urls)),
]
