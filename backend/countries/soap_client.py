"""Cliente SOAP del servicio público CountryInfoService (oorsprong.org).

Se consume con la librería zeep: el WSDL describe las operaciones y zeep
construye los mensajes SOAP (XML) y convierte las respuestas a objetos Python.
"""
import logging
import threading

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.exceptions import APIException
from zeep import Client
from zeep.exceptions import Error as ZeepError
from zeep.helpers import serialize_object
from zeep.transports import Transport

logger = logging.getLogger(__name__)

_client = None
_client_lock = threading.Lock()


class SOAPUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "No fue posible conectar con el servicio SOAP de países. Inténtalo más tarde."
    default_code = "soap_unavailable"


class CountryNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "El servicio SOAP no encontró un país con ese código ISO."
    default_code = "country_not_found"


def get_client():
    global _client
    with _client_lock:
        if _client is None:
            transport = Transport(
                timeout=settings.SOAP_TIMEOUT_SECONDS,
                operation_timeout=settings.SOAP_TIMEOUT_SECONDS,
            )
            _client = Client(settings.SOAP_COUNTRY_WSDL, transport=transport)
        return _client


def _call(operation, *args):
    key = f"soap:{operation}:{':'.join(args)}"
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        result = serialize_object(getattr(get_client().service, operation)(*args))
    except (ZeepError, OSError) as exc:
        logger.warning("Error SOAP en %s (%s)", operation, type(exc).__name__)
        raise SOAPUnavailable()
    cache.set(key, result, settings.SOAP_CACHE_SECONDS)
    return result


def list_countries():
    items = _call("ListOfCountryNamesByName") or []
    return [
        {"code": item["sISOCode"], "name": item["sName"]}
        for item in items
        if item.get("sISOCode") and item.get("sName")
    ]


def get_country(code):
    code = code.upper()
    info = _call("FullCountryInfo", code) or {}
    if not info.get("sISOCode"):
        raise CountryNotFound()
    currency = _call("CountryCurrency", code) or {}
    languages = (info.get("Languages") or {}).get("tLanguage") or []
    return {
        "code": info["sISOCode"],
        "name": info.get("sName"),
        "capital": info.get("sCapitalCity"),
        "phone_code": info.get("sPhoneCode"),
        "continent_code": info.get("sContinentCode"),
        "currency_code": info.get("sCurrencyISOCode"),
        "currency_name": currency.get("sName"),
        "flag": info.get("sCountryFlag"),
        "languages": [lang["sName"] for lang in languages if lang.get("sName")],
        "soap": {
            "wsdl": settings.SOAP_COUNTRY_WSDL,
            "operations": ["FullCountryInfo", "CountryCurrency"],
        },
    }
