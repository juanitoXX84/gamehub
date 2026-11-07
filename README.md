# GameHub

GameHub es una plataforma web para descubrir videojuegos. Permite explorar un catálogo con datos e imágenes reales de **RAWG Video Games Database**, buscar juegos por nombre, filtrarlos por género, ver su ficha completa y gestionar una cuenta de usuario con autenticación segura.

- **Frontend:** React (Vite) con diseño oscuro en negro y morado, adaptable a computadora y celular.
- **Backend:** Django + Django REST Framework con usuario personalizado (correo + matrícula), autenticación JWT, CRUD de usuarios, documentación Swagger y base de datos SQLite.
- **Seguridad:** la API KEY de RAWG solo vive en el servidor; el navegador nunca la recibe. Ninguna respuesta de la API incluye la contraseña ni su hash.

## Funcionalidades

| Página | Ruta | Acceso |
| --- | --- | --- |
| Inicio | `/` | Público |
| Catálogo (buscador, géneros, orden y paginación) | `/catalogo` | Público |
| Detalle del videojuego | `/juegos/:id` | Público |
| Registro | `/registro` | Solo visitantes |
| Inicio de sesión | `/login` | Solo visitantes |
| Perfil | `/perfil` | **Privada** (requiere sesión) |

Además incluye buscador con sugerencias en la barra de navegación, galería de capturas, distribución de opiniones, página 404 y mensajes claros ante errores de conexión, resultados vacíos o falta de configuración de RAWG.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, React Router 7, Axios, Vite 8, CSS propio (sin plantillas) |
| Backend | Python 3.10+, Django 5.1, Django REST Framework, SimpleJWT (con lista negra de tokens), drf-spectacular (Swagger), django-cors-headers, python-dotenv, requests |
| Base de datos | SQLite |
| API externa | [RAWG Video Games Database](https://rawg.io/apidocs) |

## Estructura de carpetas

```
gamehub/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example          # Variables necesarias (sin claves reales)
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/               # Configuración del proyecto Django
│   │   ├── settings.py       # Lee todo lo sensible desde .env
│   │   ├── urls.py           # URLs de la API, admin y Swagger
│   │   ├── exceptions.py     # Formato de errores de la API
│   │   ├── wsgi.py / asgi.py
│   ├── accounts/             # App de usuarios personalizados
│   │   ├── models.py         # User (correo como login + matrícula) y su UserManager
│   │   ├── admin.py          # Usuario en el administrador de Django
│   │   ├── forms.py          # Formularios del admin para el usuario personalizado
│   │   ├── serializers.py    # Lectura (sin contraseña), registro y actualización
│   │   ├── permissions.py    # Solo el propio usuario o un admin pueden editar/eliminar
│   │   ├── views.py          # Registro, login, logout, CRUD y /users/me/
│   │   ├── urls.py           # /api/auth/, /api/token/ y /api/users/
│   │   ├── migrations/
│   │   └── tests.py
│   └── games/                # App de videojuegos (proxy hacia RAWG)
│       ├── rawg_client.py    # Cliente RAWG: API KEY, caché y manejo de errores
│       ├── serializers.py    # Validación de parámetros de búsqueda
│       ├── views.py
│       ├── urls.py
│       └── tests.py
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx / App.jsx      # Arranque y rutas
        ├── config/                 # URL de la API
        ├── context/                # Estado de autenticación (AuthProvider)
        ├── hooks/                  # useAuth, useFetch, useDebounce
        ├── services/               # Cliente HTTP, auth, juegos, tokens
        ├── components/             # Navbar, GameCard, formularios, rutas privadas...
        ├── pages/                  # Inicio, Catálogo, Detalle, Login, Registro, Perfil, 404
        ├── utils/                  # Validaciones, formatos y errores
        └── styles/                 # Estilos globales, layout, componentes y páginas
```

## Requisitos

- Python 3.10 o superior
- Node.js 20 o superior (incluye npm)

## Instalación

### 1. Backend (Django)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate            # En macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env             # En macOS/Linux: cp .env.example .env
```

Genera una clave secreta y pégala en `DJANGO_SECRET_KEY` dentro de `backend/.env`:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Crea la base de datos y, si quieres entrar al administrador, un superusuario (pedirá correo, nombre de usuario, matrícula y contraseña):

```powershell
python manage.py migrate
python manage.py createsuperuser
```

### 2. Frontend (React)

```powershell
cd frontend
npm install
copy .env.example .env             # En macOS/Linux: cp .env.example .env
```

## Configuración del archivo .env

### `backend/.env`

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Clave secreta de Django (**obligatoria**) | cadena aleatoria larga |
| `DJANGO_DEBUG` | Modo desarrollo | `True` |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend autorizados | `http://localhost:5173,http://127.0.0.1:5173` |
| `RAWG_API_KEY` | API KEY de RAWG (opcional al inicio) | `tu_clave` |
| `RAWG_CACHE_SECONDS` | Segundos que se guardan en caché las respuestas de RAWG | `600` |
| `RAWG_TIMEOUT_SECONDS` | Tiempo máximo de espera a RAWG | `10` |
| `JWT_ACCESS_MINUTES` | Duración del token de acceso | `30` |
| `JWT_REFRESH_DAYS` | Duración del token de actualización | `7` |

### `frontend/.env`

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API de Django | `http://127.0.0.1:8000/api` |

> Todo lo que empieza con `VITE_` se incluye en el código del navegador. **Nunca** pongas claves privadas en `frontend/.env`.

## Cómo configurar RAWG

1. Crea una cuenta gratuita en [rawg.io](https://rawg.io/signup) y solicita tu clave en [rawg.io/apidocs](https://rawg.io/apidocs).
2. Abre `backend/.env` y escribe la clave:
   ```
   RAWG_API_KEY=tu_clave_de_rawg
   ```
3. Reinicia el servidor de Django.

Si la clave no está configurada, GameHub sigue funcionando (registro, login y perfil) y en el lugar del catálogo muestra el aviso **“Conecta GameHub con RAWG”** con estos mismos pasos. Si la clave es incorrecta, se muestra un mensaje indicándolo.

## Cómo ejecutar Django

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

La API queda disponible en `http://127.0.0.1:8000/api/`.

| Recurso | URL |
| --- | --- |
| Swagger (documentación interactiva, título **GameHub API**) | `http://127.0.0.1:8000/api/docs/` |
| ReDoc | `http://127.0.0.1:8000/api/redoc/` |
| Esquema OpenAPI | `http://127.0.0.1:8000/api/schema/` |
| Administrador de Django | `http://127.0.0.1:8000/admin/` |

**Probar endpoints protegidos en Swagger:** ejecuta `POST /api/token/` con tu correo y contraseña, copia el valor de `access`, pulsa **Authorize** y pégalo. Desde ese momento Swagger envía `Authorization: Bearer <token>` en cada petición.

## Cómo ejecutar React

En otra terminal:

```powershell
cd frontend
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Usuario personalizado

El modelo `accounts.User` (configurado en `AUTH_USER_MODEL`) extiende el usuario de Django:

- `USERNAME_FIELD = "email"`: se inicia sesión con **correo electrónico** y contraseña.
- `REQUIRED_FIELDS = ["username", "matricula"]`.
- Campo adicional **`matricula`**: obligatorio, único, de 4 a 20 caracteres (letras, números o guiones) y guardado en mayúsculas.
- El correo es único y se guarda en minúsculas.
- Visible y editable en el administrador de Django (lista, búsqueda, alta y edición).

## Endpoints de la API

### JWT (SimpleJWT)

| Método | Endpoint | Descripción | Autenticación |
| --- | --- | --- | --- |
| POST | `/api/token/` | Obtener `access` y `refresh` con `email` y `password` | No |
| POST | `/api/token/refresh/` | Renovar el `access` con el `refresh` | No |

La duración del token de acceso se define con `ACCESS_TOKEN_LIFETIME` (variable `JWT_ACCESS_MINUTES`, 30 minutos por defecto).

### Usuarios (CRUD)

| Método | Endpoint | Descripción | Autenticación |
| --- | --- | --- | --- |
| POST | `/api/users/` | Registrar usuario (`email`, `username`, `matricula`, `password`, `password_confirm`) | No |
| GET | `/api/users/` | Listar usuarios | **Bearer JWT** |
| GET | `/api/users/{id}/` | Consultar un usuario | **Bearer JWT** |
| PUT / PATCH | `/api/users/{id}/` | Actualizar usuario (propio o como administrador) | **Bearer JWT** |
| DELETE | `/api/users/{id}/` | Eliminar usuario (propio o como administrador) | **Bearer JWT** |
| GET | `/api/users/me/` | Datos personales del usuario autenticado | **Bearer JWT** |

Reglas de contraseña al actualizar:

- Si la petición **no** incluye `password`, la contraseña actual **no cambia**.
- Si incluye `password`, se valida y se guarda con `set_password()` (hash) **solo** en el usuario que se está editando; nunca se toma la contraseña de quien hace la petición.
- Ninguna respuesta incluye `password` ni su hash.

### Autenticación usada por el frontend

| Método | Endpoint | Descripción | Autenticación |
| --- | --- | --- | --- |
| POST | `/api/auth/register/` | Registro (`username`, `email`, `matricula`, `password`, `password_confirm`); devuelve usuario y tokens | No |
| POST | `/api/auth/login/` | Inicio de sesión con `email` y `password`; devuelve tokens JWT | No |
| POST | `/api/auth/refresh/` | Renueva el token de acceso con el `refresh` | No |
| POST | `/api/auth/logout/` | Cierra sesión invalidando el `refresh` (lista negra) | No (requiere el refresh token) |
| GET | `/api/auth/me/` | Datos del usuario autenticado | **Bearer JWT** |

### Videojuegos (RAWG)

| Método | Endpoint | Descripción | Autenticación |
| --- | --- | --- | --- |
| GET | `/api/games/` | Lista de juegos. Parámetros: `page`, `page_size`, `search`, `genres`, `ordering` | No |
| GET | `/api/games/search/?q=` | Búsqueda por nombre | No |
| GET | `/api/games/<id o slug>/` | Detalle del juego con capturas | No |
| GET | `/api/games/genres/` | Lista de géneros | No |
| GET | `/api/games/status/` | Indica si RAWG está configurado | No |

## Seguridad implementada

- Contraseñas almacenadas con el hash seguro de Django (PBKDF2 + SHA256); nunca en texto plano.
- Validación de contraseñas de Django (longitud mínima, contraseñas comunes, solo numéricas, similitud con el usuario).
- Validación en el frontend **y** en el backend; correos, nombres de usuario y matrículas únicos (sin distinguir mayúsculas).
- Los serializers de respuesta nunca incluyen `password`; en Swagger la contraseña solo aparece en los cuerpos de petición.
- Solo el propio usuario o un administrador pueden editar o eliminar una cuenta.
- Autenticación JWT con rotación de tokens y lista negra al cerrar sesión.
- Rutas privadas protegidas en React y endpoints protegidos en Django.
- Límite de intentos en registro e inicio de sesión (10 por minuto).
- La API KEY de RAWG solo se usa en Django y no se escribe en los logs.
- CORS restringido a los orígenes definidos en `.env`.
- Archivos `.env`, entornos virtuales, `node_modules` y la base de datos excluidos en `.gitignore`.

## Pruebas

```powershell
cd backend
.\venv\Scripts\activate
python manage.py test
```

```powershell
cd frontend
npm run lint
npm run build
```

## Puesta en producción (notas)

- Usa `DJANGO_DEBUG=False`, una `DJANGO_SECRET_KEY` nueva y define `DJANGO_ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` con tus dominios reales.
- Genera el frontend con `npm run build` y publica la carpeta `frontend/dist`.
- Para mayor volumen de tráfico se recomienda una caché compartida (por ejemplo, Redis) en lugar de la caché en memoria.
