from rest_framework import permissions


class IsSelfOrAdmin(permissions.BasePermission):
    """Solo el propio usuario o un administrador pueden modificar o eliminar la cuenta."""

    message = "Solo puedes modificar o eliminar tu propia cuenta."

    def has_object_permission(self, request, view, obj):
        return bool(request.user and (request.user.is_staff or obj.pk == request.user.pk))
