import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

VALID_PASSWORD = "Pixel-Galaxy-2026"
NEW_PASSWORD = "Nebula-Violeta-2027"


def assert_no_password(testcase, response):
    """Ninguna respuesta debe contener la contraseña ni su hash."""
    body = response.content.decode()
    testcase.assertNotIn('"password"', body)
    testcase.assertNotIn("pbkdf2_sha256$", body)
    testcase.assertNotIn(VALID_PASSWORD, body)
    testcase.assertNotIn(NEW_PASSWORD, body)


def make_user(email="gamer@example.com", username="gamer", matricula="A0001", **extra):
    return User.objects.create_user(
        email=email, username=username, matricula=matricula, password=VALID_PASSWORD, **extra
    )


class UserModelTests(TestCase):
    def test_email_is_login_identifier(self):
        self.assertEqual(User.USERNAME_FIELD, "email")
        self.assertEqual(User.REQUIRED_FIELDS, ["username", "matricula"])

    def test_create_user_normalizes_and_hashes(self):
        user = make_user(email="Gamer@Example.COM", matricula="a-123")
        self.assertEqual(user.email, "gamer@example.com")
        self.assertEqual(user.matricula, "A-123")
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(VALID_PASSWORD))

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@example.com", username="admin", matricula="ADM01", password=VALID_PASSWORD
        )
        self.assertTrue(admin.is_staff and admin.is_superuser)


class AdminTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@example.com", username="admin", matricula="ADM01", password=VALID_PASSWORD
        )
        self.client.force_login(self.admin)

    def test_admin_list_and_change_show_matricula(self):
        user = make_user()
        response = self.client.get(reverse("admin:accounts_user_changelist"))
        self.assertContains(response, "A0001")
        response = self.client.get(reverse("admin:accounts_user_change", args=[user.pk]))
        self.assertContains(response, 'name="matricula"')

    def test_admin_can_create_user(self):
        response = self.client.post(
            reverse("admin:accounts_user_add"),
            {
                "email": "nuevo@example.com",
                "username": "nuevo",
                "matricula": "N0001",
                "usable_password": "true",
                "password1": VALID_PASSWORD,
                "password2": VALID_PASSWORD,
            },
        )
        self.assertEqual(response.status_code, 302, response.content[:500])
        user = User.objects.get(email="nuevo@example.com")
        self.assertEqual(user.matricula, "N0001")
        self.assertTrue(user.check_password(VALID_PASSWORD))


class RegisterTests(APITestCase):
    url = reverse("auth-register")

    def setUp(self):
        cache.clear()

    def payload(self, **overrides):
        data = {
            "username": "jugador1",
            "email": "Jugador1@Example.com",
            "matricula": "a01234",
            "password": VALID_PASSWORD,
            "password_confirm": VALID_PASSWORD,
        }
        data.update(overrides)
        return data

    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data["tokens"])
        self.assertEqual(response.data["user"]["matricula"], "A01234")
        assert_no_password(self, response)

        user = User.objects.get(username="jugador1")
        self.assertEqual(user.email, "jugador1@example.com")
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(VALID_PASSWORD))

    def test_register_accepts_optional_names(self):
        response = self.client.post(
            self.url, self.payload(first_name="Juan José", last_name="Martínez"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["first_name"], "Juan José")
        self.assertEqual(User.objects.get(username="jugador1").last_name, "Martínez")

    def test_passwords_must_match(self):
        response = self.client.post(self.url, self.payload(password_confirm="Otra-Clave-2026"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url, self.payload(password="12345678", password_confirm="12345678"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_invalid_fields(self):
        response = self.client.post(
            self.url, self.payload(email="no-es-correo", username="", matricula="x!"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("email", "username", "matricula"):
            self.assertIn(field, response.data)

    def test_duplicates_rejected(self):
        self.client.post(self.url, self.payload(), format="json")
        response = self.client.post(
            self.url,
            self.payload(username="JUGADOR1", email="jugador1@example.com", matricula="A01234"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("email", "username", "matricula"):
            self.assertIn(field, response.data)


class LoginAndJWTTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user()

    def login(self, email="gamer@example.com", password=VALID_PASSWORD):
        return self.client.post(reverse("auth-login"), {"email": email, "password": password}, format="json")

    def test_login_with_email(self):
        response = self.login(email="GAMER@example.com")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["matricula"], "A0001")
        assert_no_password(self, response)

    def test_login_wrong_password(self):
        response = self.login(password="incorrecta")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    def test_simplejwt_token_obtain_with_email(self):
        response = self.client.post(
            reverse("token-obtain"), {"email": "gamer@example.com", "password": VALID_PASSWORD}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        refresh = self.client.post(reverse("token-refresh"), {"refresh": response.data["refresh"]}, format="json")
        self.assertEqual(refresh.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh.data)

    def test_token_obtain_wrong_password(self):
        response = self.client.post(
            reverse("token-obtain"), {"email": "gamer@example.com", "password": "mal"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_me_requires_jwt(self):
        self.assertEqual(self.client.get("/api/users/me/").status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token-falso")
        self.assertEqual(self.client.get("/api/users/me/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_me_returns_personal_data(self):
        access = self.login().data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "gamer@example.com")
        self.assertEqual(response.data["matricula"], "A0001")
        assert_no_password(self, response)

        legacy = self.client.get(reverse("auth-me"))
        self.assertEqual(legacy.data["matricula"], "A0001")
        assert_no_password(self, legacy)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.login().data["tokens"]
        response = self.client.post(reverse("auth-logout"), {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(reverse("auth-refresh"), {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_invalid_token(self):
        response = self.client.post(reverse("auth-logout"), {"refresh": "no-es-un-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserCRUDTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.alice = make_user(email="alice@example.com", username="alice", matricula="A0001")
        self.bob = make_user(email="bob@example.com", username="bob", matricula="B0002")
        self.admin = User.objects.create_superuser(
            email="admin@example.com", username="admin", matricula="ADM01", password=NEW_PASSWORD
        )

    def auth(self, user):
        self.client.force_authenticate(user)

    def test_create_user(self):
        response = self.client.post(
            "/api/users/",
            {
                "email": "carla@example.com",
                "username": "carla",
                "matricula": "c0003",
                "password": VALID_PASSWORD,
                "password_confirm": VALID_PASSWORD,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["matricula"], "C0003")
        assert_no_password(self, response)
        self.assertTrue(User.objects.get(email="carla@example.com").check_password(VALID_PASSWORD))

    def test_list_requires_auth(self):
        self.assertEqual(self.client.get("/api/users/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_and_retrieve(self):
        self.auth(self.alice)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertIn("matricula", response.data[0])
        assert_no_password(self, response)

        response = self.client.get(f"/api/users/{self.bob.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["matricula"], "B0002")
        assert_no_password(self, response)

    def test_update_without_password_keeps_password(self):
        self.auth(self.alice)
        old_hash = self.alice.password
        response = self.client.patch(
            f"/api/users/{self.alice.pk}/", {"first_name": "Alicia", "matricula": "a9999"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["matricula"], "A9999")
        assert_no_password(self, response)
        self.alice.refresh_from_db()
        self.assertEqual(self.alice.first_name, "Alicia")
        self.assertEqual(self.alice.password, old_hash)
        self.assertTrue(self.alice.check_password(VALID_PASSWORD))

    def test_full_update_without_password_keeps_password(self):
        self.auth(self.alice)
        old_hash = self.alice.password
        response = self.client.put(
            f"/api/users/{self.alice.pk}/",
            {"email": "alice2@example.com", "username": "alice2", "matricula": "A0001",
             "first_name": "A", "last_name": "B"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.alice.refresh_from_db()
        self.assertEqual(self.alice.email, "alice2@example.com")
        self.assertEqual(self.alice.password, old_hash)

    def test_update_with_new_password_is_hashed(self):
        self.auth(self.alice)
        response = self.client.patch(f"/api/users/{self.alice.pk}/", {"password": NEW_PASSWORD}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert_no_password(self, response)
        self.alice.refresh_from_db()
        self.assertTrue(self.alice.password.startswith("pbkdf2_sha256$"))
        self.assertNotIn(NEW_PASSWORD, self.alice.password)
        self.assertTrue(self.alice.check_password(NEW_PASSWORD))
        self.assertFalse(self.alice.check_password(VALID_PASSWORD))

        login = self.client.post(
            reverse("token-obtain"), {"email": "alice@example.com", "password": NEW_PASSWORD}, format="json"
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_admin_update_never_copies_admin_password(self):
        self.auth(self.admin)
        bob_hash = self.bob.password
        response = self.client.patch(f"/api/users/{self.bob.pk}/", {"last_name": "Builder"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bob.refresh_from_db()
        self.assertEqual(self.bob.password, bob_hash)
        self.assertTrue(self.bob.check_password(VALID_PASSWORD))
        self.assertFalse(self.bob.check_password(NEW_PASSWORD))

        self.client.patch(f"/api/users/{self.bob.pk}/", {"password": "Otra-Clave-Bob-1"}, format="json")
        self.bob.refresh_from_db()
        self.admin.refresh_from_db()
        self.assertTrue(self.bob.check_password("Otra-Clave-Bob-1"))
        self.assertTrue(self.admin.check_password(NEW_PASSWORD))

    def test_weak_password_on_update_rejected(self):
        self.auth(self.alice)
        response = self.client.patch(f"/api/users/{self.alice.pk}/", {"password": "123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.alice.refresh_from_db()
        self.assertTrue(self.alice.check_password(VALID_PASSWORD))

    def test_update_duplicate_matricula_rejected(self):
        self.auth(self.alice)
        response = self.client.patch(f"/api/users/{self.alice.pk}/", {"matricula": "b0002"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("matricula", response.data)

    def test_cannot_modify_or_delete_other_users(self):
        self.auth(self.alice)
        self.assertEqual(
            self.client.patch(f"/api/users/{self.bob.pk}/", {"first_name": "X"}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(self.client.delete(f"/api/users/{self.bob.pk}/").status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_own_account_and_admin_delete(self):
        self.auth(self.alice)
        self.assertEqual(self.client.delete(f"/api/users/{self.alice.pk}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.alice.pk).exists())

        self.auth(self.admin)
        self.assertEqual(self.client.delete(f"/api/users/{self.bob.pk}/").status_code, status.HTTP_204_NO_CONTENT)

    def test_no_endpoint_exposes_password(self):
        self.auth(self.admin)
        for url in ("/api/users/", f"/api/users/{self.bob.pk}/", "/api/users/me/", "/api/auth/me/"):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            assert_no_password(self, response)
            self.assertNotIn("password", json.dumps(response.data))


class SwaggerTests(APITestCase):
    def test_schema_and_docs(self):
        schema = self.client.get("/api/schema/?format=json")
        self.assertEqual(schema.status_code, 200)
        data = json.loads(schema.content)
        self.assertEqual(data["info"]["title"], "GameHub API")
        for path in ("/api/token/", "/api/token/refresh/", "/api/users/", "/api/users/{id}/",
                     "/api/users/me/", "/api/games/"):
            self.assertIn(path, data["paths"])
        user_schema = data["components"]["schemas"]["User"]
        self.assertNotIn("password", user_schema["properties"])
        self.assertIn("matricula", user_schema["properties"])

        self.assertEqual(self.client.get("/api/docs/").status_code, 200)
