from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from zeep.exceptions import TransportError

MEXICO = {
    "sISOCode": "MX",
    "sName": "Mexico",
    "sCapitalCity": "Mexico City",
    "sPhoneCode": "52",
    "sContinentCode": "AM",
    "sCurrencyISOCode": "MXN",
    "sCountryFlag": "http://www.oorsprong.org/WebSamples.CountryInfo/Flags/Mexico.jpg",
    "Languages": {"tLanguage": [{"sISOCode": "es", "sName": "Spanish"}]},
}
NOT_FOUND = {"sISOCode": None, "sName": "Country not found in the database", "Languages": None}


def fake_client(**operations):
    return SimpleNamespace(service=SimpleNamespace(**operations))


class CountryEndpointsTests(APITestCase):
    def setUp(self):
        cache.clear()
        user = get_user_model().objects.create_user(
            email="soap@example.com", username="soap", matricula="SOAP01", password="Soap-Test-2026"
        )
        self.client.force_authenticate(user)

    def test_requires_jwt(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("soap-countries-detail", args=["MX"]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("countries.soap_client.get_client")
    def test_country_detail(self, get_client):
        full_info = MagicMock(return_value=MEXICO)
        get_client.return_value = fake_client(
            FullCountryInfo=full_info,
            CountryCurrency=MagicMock(return_value={"sISOCode": "MXN", "sName": "Pesos"}),
        )
        response = self.client.get(reverse("soap-countries-detail", args=["mx"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Mexico")
        self.assertEqual(response.data["capital"], "Mexico City")
        self.assertEqual(response.data["currency_name"], "Pesos")
        self.assertEqual(response.data["languages"], ["Spanish"])
        self.assertIn("FullCountryInfo", response.data["soap"]["operations"])
        full_info.assert_called_once_with("MX")

        self.client.get(reverse("soap-countries-detail", args=["MX"]))
        full_info.assert_called_once()

    @patch("countries.soap_client.get_client")
    def test_country_list(self, get_client):
        get_client.return_value = fake_client(
            ListOfCountryNamesByName=MagicMock(
                return_value=[{"sISOCode": "AR", "sName": "Argentina"}, {"sISOCode": "MX", "sName": "Mexico"}]
            )
        )
        response = self.client.get(reverse("soap-countries-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(response.data["results"][1], {"code": "MX", "name": "Mexico"})

    @patch("countries.soap_client.get_client")
    def test_unknown_country_returns_404(self, get_client):
        get_client.return_value = fake_client(FullCountryInfo=MagicMock(return_value=NOT_FOUND))
        response = self.client.get(reverse("soap-countries-detail", args=["ZZ"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "country_not_found")

    @patch("countries.soap_client.get_client")
    def test_soap_failure_returns_503(self, get_client):
        get_client.return_value = fake_client(
            FullCountryInfo=MagicMock(side_effect=TransportError("caído", status_code=500))
        )
        response = self.client.get(reverse("soap-countries-detail", args=["MX"]))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "soap_unavailable")

    def test_invalid_code_format_is_not_routed(self):
        response = self.client.get("/api/soap/countries/MEX/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
