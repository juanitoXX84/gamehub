from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Añade un campo `code` a los errores simples para que el frontend
    pueda distinguir casos como `rawg_not_configured`."""
    response = exception_handler(exc, context)
    if response is None:
        return response

    detail = getattr(exc, "detail", None)
    if isinstance(response.data, dict) and isinstance(detail, str):
        code = getattr(detail, "code", None)
        if code:
            response.data["code"] = code
    return response
