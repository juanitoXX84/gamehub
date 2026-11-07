from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import rawg_client
from .serializers import GameListQuerySerializer, GameSearchQuerySerializer


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


class GameDetailView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, game_id):
        return Response(rawg_client.get_game(game_id))


class GenreListView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": rawg_client.list_genres()})
