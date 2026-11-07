from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsSelfOrAdmin
from .serializers import (
    AuthResponseSerializer,
    DetailSerializer,
    LoginSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
    tokens_for_user,
)

User = get_user_model()

AUTH_TAG = "Autenticación"
USERS_TAG = "Usuarios"


# --- Autenticación usada por el frontend ----------------------------------------


@extend_schema(
    tags=[AUTH_TAG],
    summary="Registrar usuario e iniciar sesión",
    request=RegisterSerializer,
    responses={201: AuthResponseSerializer},
)
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        update_last_login(None, user)
        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=[AUTH_TAG],
    summary="Iniciar sesión con correo y contraseña",
    request=LoginSerializer,
    responses={200: AuthResponseSerializer, 400: OpenApiResponse(description="Credenciales incorrectas")},
)
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        update_last_login(None, user)
        return Response({"user": UserSerializer(user).data, "tokens": tokens_for_user(user)})


@extend_schema(
    tags=[AUTH_TAG],
    summary="Cerrar sesión (invalida el refresh token)",
    request=LogoutSerializer,
    responses={200: DetailSerializer, 400: DetailSerializer},
)
class LogoutView(APIView):
    """Invalida el refresh token. Poseer el refresh token prueba la sesión,
    así que no se exige un access token vigente."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            return Response(
                {"detail": "El token de sesión no es válido o ya expiró."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Sesión cerrada correctamente."})


@extend_schema(tags=[AUTH_TAG], summary="Datos del usuario autenticado")
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- CRUD de usuarios -------------------------------------------------------------


@extend_schema_view(
    list=extend_schema(tags=[USERS_TAG], summary="Listar usuarios"),
    retrieve=extend_schema(tags=[USERS_TAG], summary="Consultar un usuario"),
    create=extend_schema(
        tags=[USERS_TAG],
        summary="Registrar usuario",
        request=RegisterSerializer,
        responses={201: UserSerializer},
    ),
    update=extend_schema(
        tags=[USERS_TAG],
        summary="Actualizar usuario",
        description="Si no se envía `password`, la contraseña actual no cambia.",
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
    ),
    partial_update=extend_schema(
        tags=[USERS_TAG],
        summary="Actualizar parcialmente un usuario",
        description="Si no se envía `password`, la contraseña actual no cambia.",
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
    ),
    destroy=extend_schema(tags=[USERS_TAG], summary="Eliminar usuario"),
    me=extend_schema(tags=[USERS_TAG], summary="Datos personales del usuario autenticado (JWT)"),
)
class UserViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all().order_by("id")

    def get_serializer_class(self):
        if self.action == "create":
            return RegisterSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsSelfOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        self.throttle_scope = "auth" if self.action == "create" else None
        return super().get_throttles()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        return Response(UserSerializer(request.user).data)
