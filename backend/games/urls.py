from django.urls import path

from .views import GameDetailView, GameListView, GameSearchView, GenreListView, RAWGStatusView

urlpatterns = [
    path("", GameListView.as_view(), name="games-list"),
    path("status/", RAWGStatusView.as_view(), name="games-status"),
    path("search/", GameSearchView.as_view(), name="games-search"),
    path("genres/", GenreListView.as_view(), name="games-genres"),
    path("<slug:game_id>/", GameDetailView.as_view(), name="games-detail"),
]
