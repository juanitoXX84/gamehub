from rest_framework import serializers

ORDERING_CHOICES = (
    "",
    "name",
    "-name",
    "released",
    "-released",
    "added",
    "-added",
    "rating",
    "-rating",
    "metacritic",
    "-metacritic",
)


class PaginationQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        max_value=500,
        error_messages={"invalid": "La página debe ser un número entero."},
    )
    page_size = serializers.IntegerField(
        required=False,
        default=20,
        min_value=1,
        max_value=40,
        error_messages={"invalid": "page_size debe ser un número entero."},
    )


class GameListQuerySerializer(PaginationQuerySerializer):
    search = serializers.CharField(required=False, allow_blank=True, max_length=100)
    genres = serializers.RegexField(
        r"^[a-z0-9-]+(,[a-z0-9-]+)*$",
        required=False,
        allow_blank=True,
        max_length=200,
        error_messages={"invalid": "El filtro de géneros no es válido."},
    )
    ordering = serializers.ChoiceField(
        choices=ORDERING_CHOICES,
        required=False,
        allow_blank=True,
        error_messages={"invalid_choice": "El orden solicitado no es válido."},
    )


class GameSearchQuerySerializer(PaginationQuerySerializer):
    """Parámetros de `GET /api/games/search/`."""

    q = serializers.CharField(
        min_length=2,
        max_length=100,
        error_messages={
            "required": "Escribe el nombre del juego que quieres buscar.",
            "blank": "Escribe el nombre del juego que quieres buscar.",
            "min_length": "La búsqueda debe tener al menos 2 caracteres.",
        },
    )


# --- Respuestas (documentación Swagger) ---------------------------------------


class NamedItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()


class GameSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    slug = serializers.CharField()
    name = serializers.CharField()
    background_image = serializers.URLField(allow_null=True)
    rating = serializers.FloatField()
    rating_top = serializers.IntegerField()
    ratings_count = serializers.IntegerField()
    metacritic = serializers.IntegerField(allow_null=True)
    released = serializers.DateField(allow_null=True)
    playtime = serializers.IntegerField()
    genres = NamedItemSerializer(many=True)
    platforms = serializers.ListField(child=serializers.CharField())


class GamePageSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()
    results = GameSummarySerializer(many=True)


class ScreenshotSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    image = serializers.URLField()


class RatingBreakdownSerializer(serializers.Serializer):
    title = serializers.CharField()
    count = serializers.IntegerField()
    percent = serializers.FloatField()


class GameDetailSerializer(GameSummarySerializer):
    description = serializers.CharField()
    tba = serializers.BooleanField()
    website = serializers.URLField(allow_null=True)
    background_image_additional = serializers.URLField(allow_null=True)
    developers = NamedItemSerializer(many=True)
    publishers = NamedItemSerializer(many=True)
    stores = serializers.ListField(child=serializers.CharField())
    tags = NamedItemSerializer(many=True)
    esrb_rating = serializers.CharField(allow_null=True)
    achievements_count = serializers.IntegerField()
    alternative_names = serializers.ListField(child=serializers.CharField())
    ratings = RatingBreakdownSerializer(many=True)
    screenshots = ScreenshotSerializer(many=True)


class GenreSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    games_count = serializers.IntegerField()
    image_background = serializers.URLField(allow_null=True)


class GenreListSerializer(serializers.Serializer):
    results = GenreSerializer(many=True)


class RAWGStatusSerializer(serializers.Serializer):
    configured = serializers.BooleanField()
    detail = serializers.CharField(allow_null=True)
