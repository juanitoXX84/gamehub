"""Configuración de Django para GameHub.

Todos los valores sensibles se leen desde variables de entorno (archivo .env).
"""
import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def env_int(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# --- Núcleo -----------------------------------------------------------------

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise ImproperlyConfigured(
        "Falta DJANGO_SECRET_KEY. Copia backend/.env.example como backend/.env "
        "y define una clave secreta."
    )

DEBUG = env_bool("DJANGO_DEBUG", False)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    # Aplicaciones de GameHub
    "accounts",
    "games",
    "countries",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Base de datos ----------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --- Usuario personalizado (inicia sesión con correo y tiene matrícula) ------

AUTH_USER_MODEL = "accounts.User"

# --- Contraseñas (hash seguro PBKDF2 por defecto de Django) ------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Internacionalización ---------------------------------------------------

LANGUAGE_CODE = "es"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Django REST Framework ----------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": (
        ("rest_framework.renderers.JSONRenderer",)
        + (("rest_framework.renderers.BrowsableAPIRenderer",) if DEBUG else ())
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "user": "240/min",
        "auth": "10/min",
    },
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# --- Swagger / OpenAPI ---------------------------------------------------------

SPECTACULAR_SETTINGS = {
    "TITLE": "GameHub API",
    "DESCRIPTION": (
        "API de GameHub: usuarios personalizados con matrícula, autenticación JWT, "
        "consulta de videojuegos a través de RAWG y consumo de un servicio SOAP de países.\n\n"
        "Para probar endpoints protegidos: obtén un token en `POST /api/token/`, pulsa "
        "**Authorize** y pega el valor de `access`."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SWAGGER_UI_SETTINGS": {"persistAuthorization": True, "displayRequestDuration": True},
    "TAGS": [
        {"name": "JWT", "description": "Obtención y renovación de tokens."},
        {"name": "Usuarios", "description": "CRUD de usuarios y datos personales."},
        {"name": "Autenticación", "description": "Registro, inicio y cierre de sesión usados por el frontend."},
        {"name": "Videojuegos", "description": "Consulta de videojuegos mediante RAWG."},
        {"name": "SOAP", "description": "Países consultados en un Web Service SOAP público con zeep."},
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int("JWT_ACCESS_MINUTES", 30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int("JWT_REFRESH_DAYS", 7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- CORS -------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_ALLOW_CREDENTIALS = False

# --- Caché (respuestas de RAWG) ---------------------------------------------

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "gamehub-cache",
    }
}

# --- RAWG -------------------------------------------------------------------

RAWG_API_KEY = os.getenv("RAWG_API_KEY", "").strip()
RAWG_BASE_URL = os.getenv("RAWG_BASE_URL", "https://api.rawg.io/api").rstrip("/")
RAWG_CACHE_SECONDS = env_int("RAWG_CACHE_SECONDS", 600)
RAWG_TIMEOUT_SECONDS = env_int("RAWG_TIMEOUT_SECONDS", 10)

# --- Web Service SOAP (países) ------------------------------------------------

SOAP_COUNTRY_WSDL = os.getenv(
    "SOAP_COUNTRY_WSDL",
    "http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL",
)
SOAP_CACHE_SECONDS = env_int("SOAP_CACHE_SECONDS", 3600)
SOAP_TIMEOUT_SECONDS = env_int("SOAP_TIMEOUT_SECONDS", 15)

# --- Cabeceras de seguridad -------------------------------------------------

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_REFERRER_POLICY = "same-origin"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {
        "games": {"handlers": ["console"], "level": "INFO"},
        "countries": {"handlers": ["console"], "level": "INFO"},
    },
}
