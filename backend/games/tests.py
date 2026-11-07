from unittest.mock import MagicMock, patch

import requests
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

FAKE_KEY = "test-key-123"

GAME = {
    "id": 3498,
    "slug": "grand-theft-auto-v",
    "name": "Grand Theft Auto V",
    "background_image": "https://media.rawg.io/media/games/gtav.jpg",
    "rating": 4.47,
    "rating_top": 5,
    "ratings_count": 6000,
    "metacritic": 92,
    "released": "2013-09-17",
    "playtime": 74,
    "genres": [{"id": 4, "name": "Action", "slug": "action"}],
    "parent_platforms": [{"platform": {"id": 1, "name": "PC", "slug": "pc"}}],
}


def fake_response(status_code=200, payload=None):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = payload if payload is not None else {}
    return response


@override_settings(RAWG_API_KEY=FAKE_KEY)
class GamesEndpointTests(APITestCase):
    def setUp(self):
        cache.clear()

    @patch("games.rawg_client.requests.get")
    def test_list_games(self, mock_get):
        mock_get.return_value = fake_response(
            payload={"count": 1, "next": None, "previous": None, "results": [GAME]}
        )
        response = self.client.get(reverse("games-list"), {"ordering": "-rating", "genres": "action"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        game = response.data["results"][0]
        self.assertEqual(game["name"], "Grand Theft Auto V")
        self.assertEqual(game["genres"][0]["slug"], "action")
        self.assertEqual(game["platforms"], ["PC"])
        # La clave se envía a RAWG pero nunca aparece en la respuesta.
        self.assertEqual(mock_get.call_args.kwargs["params"]["key"], FAKE_KEY)
        self.assertNotIn(FAKE_KEY, response.content.decode())

    @patch("games.rawg_client.requests.get")
    def test_responses_are_cached(self, mock_get):
        mock_get.return_value = fake_response(payload={"count": 0, "results": []})
        self.client.get(reverse("games-list"))
        self.client.get(reverse("games-list"))
        self.assertEqual(mock_get.call_count, 1)

    def test_invalid_query_params(self):
        response = self.client.get(reverse("games-list"), {"ordering": "drop", "page": "x"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ordering", response.data)
        self.assertIn("page", response.data)

    @patch("games.rawg_client.requests.get")
    def test_search(self, mock_get):
        mock_get.return_value = fake_response(payload={"count": 1, "results": [GAME]})
        response = self.client.get(reverse("games-search"), {"q": "grand theft"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        params = mock_get.call_args.kwargs["params"]
        self.assertEqual(params["search"], "grand theft")
        self.assertEqual(params["search_precise"], "true")

    def test_search_requires_query(self):
        response = self.client.get(reverse("games-search"), {"q": "a"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("games.rawg_client.requests.get")
    def test_empty_page_returns_empty_results(self, mock_get):
        mock_get.return_value = fake_response(status_code=404)
        response = self.client.get(reverse("games-list"), {"page": 400})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    @patch("games.rawg_client.requests.get")
    def test_detail_includes_screenshots(self, mock_get):
        detail = {**GAME, "description_raw": "Un mundo abierto.", "developers": [{"id": 1, "name": "Rockstar North", "slug": "rockstar-north"}]}
        shots = {"results": [{"id": 1, "image": "https://media.rawg.io/shot.jpg"}]}
        mock_get.side_effect = [fake_response(payload=detail), fake_response(payload=shots)]
        response = self.client.get(reverse("games-detail", args=["3498"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["description"], "Un mundo abierto.")
        self.assertEqual(response.data["developers"][0]["name"], "Rockstar North")
        self.assertEqual(len(response.data["screenshots"]), 1)

    @patch("games.rawg_client.requests.get")
    def test_detail_not_found(self, mock_get):
        mock_get.return_value = fake_response(status_code=404)
        response = self.client.get(reverse("games-detail", args=["no-existe"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "game_not_found")

    @patch("games.rawg_client.requests.get")
    def test_connection_error(self, mock_get):
        mock_get.side_effect = requests.ConnectionError(f"https://api.rawg.io/?key={FAKE_KEY}")
        response = self.client.get(reverse("games-genres"))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "rawg_unavailable")
        self.assertNotIn(FAKE_KEY, response.content.decode())

    @patch("games.rawg_client.requests.get")
    def test_invalid_key(self, mock_get):
        mock_get.return_value = fake_response(status_code=401)
        response = self.client.get(reverse("games-list"))
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data["code"], "rawg_invalid_key")

    def test_public_endpoint_ignores_expired_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token-invalido")
        response = self.client.get(reverse("games-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(RAWG_API_KEY="")
class RAWGNotConfiguredTests(APITestCase):
    def test_status_reports_not_configured(self):
        response = self.client.get(reverse("games-status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["configured"])

    @patch("games.rawg_client.requests.get")
    def test_list_returns_clear_message(self, mock_get):
        response = self.client.get(reverse("games-list"))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "rawg_not_configured")
        self.assertIn("RAWG_API_KEY", response.data["detail"])
        mock_get.assert_not_called()
