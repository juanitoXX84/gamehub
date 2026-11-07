from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import rawg_client
from .serializers import (
    GameDetailSerializer,
    GameListQuerySerializer,
    GamePageSerializer,
    GameSearchQuerySerializer,
    GenreListSerializer,
    RAWGStatusSerializer,
)

TAG = "Videojuegos"
RAWG_ERRORS = {
    502: OpenApiResponse(description="RAWG rechazó la API KEY o respondió con un error"),
    503: OpenApiResponse(description="RAWG no está configurado o no está disponible"),
}


@extend_schema(tags=[TAG], summary="Estado de la integración con RAWG", responses=RAWGStatusSerializer)
class RAWGStatusView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        configured = rawg_client.is_configured()
        return Response(
            {
                "configured": configured,
                "detail": None if configured else rawg_client.RAWGNotConfigured.default_detail,
            }
        )


@extend_schema_view(
    get=extend_schema(
        tags=[TAG],
        summary="Listar videojuegos",
        operation_id="games_list",
        parameters=[GameListQuerySerializer],
        responses={200: GamePageSerializer, **RAWG_ERRORS},
    )
)
class GameListView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = GameListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data
        data = rawg_client.list_games(
            page=params["page"],
            page_size=params["page_size"],
            search=params.get("search", "").strip() or None,
            genres=params.get("genres") or None,
            ordering=params.get("ordering") or None,
        )
        return Response(data)


@extend_schema(
    tags=[TAG],
    summary="Buscar videojuegos por nombre",
    parameters=[GameSearchQuerySerializer],
    responses={200: GamePageSerializer, **RAWG_ERRORS},
)
class GameSearchView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = GameSearchQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data
        data = rawg_client.list_games(
            page=params["page"],
            page_size=params["page_size"],
            search=params["q"].strip(),
            precise=True,
        )
        return Response(data)


@extend_schema_view(
    get=extend_schema(
        tags=[TAG],
        summary="Detalle de un videojuego (id o slug)",
        operation_id="games_detail",
        responses={200: GameDetailSerializer, 404: OpenApiResponse(description="No encontrado"), **RAWG_ERRORS},
    )
)
class GameDetailView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, game_id):
        return Response(rawg_client.get_game(game_id))


@extend_schema(tags=[TAG], summary="Listar géneros", responses={200: GenreListSerializer, **RAWG_ERRORS})
class GenreListView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": rawg_client.list_genres()})
