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
    q = serializers.CharField(
        min_length=2,
        max_length=100,
        error_messages={
            "required": "Escribe el nombre del juego que quieres buscar.",
            "blank": "Escribe el nombre del juego que quieres buscar.",
            "min_length": "La búsqueda debe tener al menos 2 caracteres.",
        },
    )
