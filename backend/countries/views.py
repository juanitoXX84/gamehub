from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from . import soap_client
from .serializers import CountryDetailSerializer, CountryListSerializer

TAG = "SOAP"
SOAP_ERRORS = {
    401: OpenApiResponse(description="Falta el token JWT o no es válido"),
    503: OpenApiResponse(description="El servicio SOAP no está disponible"),
}


@extend_schema_view(
    get=extend_schema(
        tags=[TAG],
        summary="Listar países (SOAP: ListOfCountryNamesByName)",
        operation_id="soap_countries_list",
        responses={200: CountryListSerializer, **SOAP_ERRORS},
    )
)
class CountryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        countries = soap_client.list_countries()
        return Response({"count": len(countries), "results": countries})


@extend_schema_view(
    get=extend_schema(
        tags=[TAG],
        summary="Información de un país (SOAP: FullCountryInfo y CountryCurrency)",
        operation_id="soap_countries_detail",
        responses={
            200: CountryDetailSerializer,
            404: OpenApiResponse(description="Código ISO inexistente"),
            **SOAP_ERRORS,
        },
    )
)
class CountryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        return Response(soap_client.get_country(code))
