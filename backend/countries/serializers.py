from rest_framework import serializers


class CountrySummarySerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()


class CountryListSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    results = CountrySummarySerializer(many=True)


class SOAPSourceSerializer(serializers.Serializer):
    wsdl = serializers.URLField()
    operations = serializers.ListField(child=serializers.CharField())


class CountryDetailSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    capital = serializers.CharField(allow_null=True)
    phone_code = serializers.CharField(allow_null=True)
    continent_code = serializers.CharField(allow_null=True)
    currency_code = serializers.CharField(allow_null=True)
    currency_name = serializers.CharField(allow_null=True)
    flag = serializers.URLField(allow_null=True)
    languages = serializers.ListField(child=serializers.CharField())
    soap = SOAPSourceSerializer()
