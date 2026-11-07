from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

VALID_PASSWORD = "Pixel-Galaxy-2026"


class RegisterTests(APITestCase):
    url = reverse("auth-register")

    def setUp(self):
        cache.clear()

    def payload(self, **overrides):
        data = {
            "username": "jugador1",
            "email": "Jugador1@Example.com",
            "password": VALID_PASSWORD,
            "password_confirm": VALID_PASSWORD,
        }
        data.update(overrides)
        return data

    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertNotIn("password", response.data["user"])

        user = User.objects.get(username="jugador1")
        self.assertEqual(user.email, "jugador1@example.com")
        self.assertNotEqual(user.password, VALID_PASSWORD)
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(VALID_PASSWORD))

    def test_passwords_must_match(self):
        response = self.client.post(
            self.url, self.payload(password_confirm="Otra-Clave-2026"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url, self.payload(password="12345678", password_confirm="12345678"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_invalid_email_and_missing_username(self):
        response = self.client.post(
            self.url, self.payload(email="no-es-correo", username=""), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("username", response.data)

    def test_duplicate_email_and_username_rejected(self):
        self.client.post(self.url, self.payload(), format="json")
        response = self.client.post(
            self.url,
            self.payload(username="JUGADOR1", email="jugador1@example.com"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("username", response.data)


class LoginLogoutTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="gamer", email="gamer@example.com", password=VALID_PASSWORD
        )

    def login(self, email="gamer@example.com", password=VALID_PASSWORD):
        return self.client.post(
            reverse("auth-login"), {"email": email, "password": password}, format="json"
        )

    def test_login_with_email(self):
        response = self.login(email="GAMER@example.com")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["username"], "gamer")

    def test_login_wrong_password(self):
        response = self.login(password="incorrecta")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_login_unknown_email(self):
        response = self.login(email="nadie@example.com")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        tokens = self.login().data["tokens"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "gamer@example.com")

    def test_logout_blacklists_refresh_token(self):
        tokens = self.login().data["tokens"]
        response = self.client.post(
            reverse("auth-logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            reverse("auth-refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_invalid_token(self):
        response = self.client.post(
            reverse("auth-logout"), {"refresh": "no-es-un-token"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_returns_new_access(self):
        tokens = self.login().data["tokens"]
        response = self.client.post(
            reverse("auth-refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
