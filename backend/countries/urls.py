from django.urls import re_path

from .views import CountryDetailView, CountryListView

urlpatterns = [
    re_path(r"^$", CountryListView.as_view(), name="soap-countries-list"),
    re_path(r"^(?P<code>[A-Za-z]{2})/$", CountryDetailView.as_view(), name="soap-countries-detail"),
]
