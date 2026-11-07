"""Cliente de la API de RAWG (https://rawg.io/apidocs).

La API KEY solo se usa en el servidor: nunca se envía al navegador ni se
escribe en los logs.
"""
import hashlib
import json
import logging

import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class RAWGNotConfigured(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = (
        "La conexión con RAWG aún no está activada. Agrega tu RAWG_API_KEY en "
        "el archivo backend/.env y reinicia el servidor de Django."
    )
    default_code = "rawg_not_configured"


class RAWGUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = (
        "No fue posible conectar con RAWG en este momento. Inténtalo de nuevo en unos minutos."
    )
    default_code = "rawg_unavailable"


class RAWGInvalidKey(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = (
        "RAWG rechazó la API KEY configurada. Revisa el valor de RAWG_API_KEY en backend/.env."
    )
    default_code = "rawg_invalid_key"


class RAWGBadResponse(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "RAWG devolvió una respuesta inesperada. Inténtalo más tarde."
    default_code = "rawg_bad_response"


class GameNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "No encontramos el videojuego solicitado."
    default_code = "game_not_found"


def is_configured():
    return bool(settings.RAWG_API_KEY)


def _cache_key(path, params):
    payload = json.dumps([path, sorted(params.items())], default=str)
    return "rawg:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _request(path, params=None):
    api_key = settings.RAWG_API_KEY
    if not api_key:
        raise RAWGNotConfigured()

    params = {k: v for k, v in (params or {}).items() if v not in (None, "")}
    key = _cache_key(path, params)
    cached = cache.get(key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            f"{settings.RAWG_BASE_URL}{path}",
            params={**params, "key": api_key},
            timeout=settings.RAWG_TIMEOUT_SECONDS,
            headers={"User-Agent": "GameHub/1.0", "Accept": "application/json"},
        )
    except requests.Timeout:
        logger.warning("RAWG timeout en %s", path)
        raise RAWGUnavailable("RAWG tardó demasiado en responder. Inténtalo de nuevo.")
    except requests.RequestException as exc:
        # No se registra el mensaje de la excepción porque incluye la URL con la clave.
        logger.warning("Error de conexión con RAWG en %s (%s)", path, type(exc).__name__)
        raise RAWGUnavailable()

    if response.status_code == 404:
        raise GameNotFound()
    if response.status_code in (401, 403):
        raise RAWGInvalidKey()
    if response.status_code == 429:
        raise RAWGUnavailable(
            "Se alcanzó el límite de solicitudes a RAWG. Espera un momento e inténtalo de nuevo."
        )
    if response.status_code >= 400:
        logger.warning("RAWG respondió %s en %s", response.status_code, path)
        raise RAWGBadResponse()

    try:
        data = response.json()
    except ValueError:
        raise RAWGBadResponse()

    cache.set(key, data, settings.RAWG_CACHE_SECONDS)
    return data


# --- Normalización ------------------------------------------------------------


def _named_list(items):
    return [
        {"id": item.get("id"), "name": item.get("name"), "slug": item.get("slug")}
        for item in items or []
        if isinstance(item, dict) and item.get("name")
    ]


def _platform_names(items):
    names = []
    for item in items or []:
        platform = (item or {}).get("platform") or {}
        if platform.get("name"):
            names.append(platform["name"])
    return names


def normalize_game_summary(game):
    return {
        "id": game.get("id"),
        "slug": game.get("slug"),
        "name": game.get("name") or "Sin título",
        "background_image": game.get("background_image"),
        "rating": game.get("rating") or 0,
        "rating_top": game.get("rating_top") or 5,
        "ratings_count": game.get("ratings_count") or 0,
        "metacritic": game.get("metacritic"),
        "released": game.get("released"),
        "playtime": game.get("playtime") or 0,
        "genres": _named_list(game.get("genres")),
        "platforms": _platform_names(game.get("parent_platforms")),
    }


def normalize_game_detail(game, screenshots):
    summary = normalize_game_summary(game)
    tags = [
        tag
        for tag in game.get("tags") or []
        if isinstance(tag, dict) and tag.get("language", "eng") == "eng"
    ]
    summary.update(
        {
            "description": (game.get("description_raw") or "").strip(),
            "tba": bool(game.get("tba")),
            "website": game.get("website") or None,
            "background_image_additional": game.get("background_image_additional"),
            "platforms": _platform_names(game.get("platforms")),
            "developers": _named_list(game.get("developers")),
            "publishers": _named_list(game.get("publishers")),
            "stores": [
                (store.get("store") or {}).get("name")
                for store in game.get("stores") or []
                if (store or {}).get("store")
            ],
            "tags": _named_list(tags)[:12],
            "esrb_rating": (game.get("esrb_rating") or {}).get("name"),
            "achievements_count": game.get("achievements_count") or 0,
            "alternative_names": game.get("alternative_names") or [],
            "ratings": [
                {
                    "title": r.get("title"),
                    "count": r.get("count", 0),
                    "percent": r.get("percent", 0),
                }
                for r in game.get("ratings") or []
                if isinstance(r, dict)
            ],
            "screenshots": screenshots,
        }
    )
    return summary


def _paginated(data, page, page_size):
    results = data.get("results") or []
    return {
        "count": data.get("count") or 0,
        "page": page,
        "page_size": page_size,
        "has_next": bool(data.get("next")),
        "has_previous": bool(data.get("previous")),
        "results": [normalize_game_summary(g) for g in results if isinstance(g, dict)],
    }


def _empty_page(page, page_size):
    return {
        "count": 0,
        "page": page,
        "page_size": page_size,
        "has_next": False,
        "has_previous": page > 1,
        "results": [],
    }


# --- Operaciones públicas -----------------------------------------------------


def list_games(page=1, page_size=20, search=None, genres=None, ordering=None, precise=False):
    params = {
        "page": page,
        "page_size": page_size,
        "search": search,
        "genres": genres,
        "ordering": ordering,
    }
    if search and precise:
        params["search_precise"] = "true"
    try:
        data = _request("/games", params)
    except GameNotFound:
        # RAWG responde 404 cuando la página solicitada no existe.
        return _empty_page(page, page_size)
    return _paginated(data, page, page_size)


def get_game(game_id):
    game = _request(f"/games/{game_id}")
    try:
        shots = _request(f"/games/{game_id}/screenshots", {"page_size": 8})
        screenshots = [
            {"id": s.get("id"), "image": s.get("image")}
            for s in shots.get("results") or []
            if isinstance(s, dict) and s.get("image")
        ]
    except APIException:
        screenshots = []
    return normalize_game_detail(game, screenshots)


def list_genres():
    data = _request("/genres", {"page_size": 40, "ordering": "-games_count"})
    return [
        {
            "id": g.get("id"),
            "name": g.get("name"),
            "slug": g.get("slug"),
            "games_count": g.get("games_count") or 0,
            "image_background": g.get("image_background"),
        }
        for g in data.get("results") or []
        if isinstance(g, dict) and g.get("slug")
    ]
