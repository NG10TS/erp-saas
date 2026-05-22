# backend/app/dependencies/permissions.py
"""
Decorador y dependencia para verificar permisos finos en endpoints
"""
from fastapi import Depends, HTTPException, status
from functools import wraps
from typing import List, Optional

from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.services.permission_service import PermissionService
from app.core.database import get_db
from sqlalchemy.orm import Session


def require_permission(permission_key: str):
    """
    Decorador que verifica si el usuario actual tiene el permiso especificado.
    Uso:
        @router.post("/products")
        @require_permission("products.create")
        def create_product(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener current_user de los kwargs (fastapi lo inyecta)
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            # Si no hay current_user, intentar obtenerlo de los args
            if current_user is None:
                # Buscar en los argumentos posicionales
                for arg in args:
                    if isinstance(arg, User):
                        current_user = arg
                        break
            
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autenticado"
                )
            
            # Obtener db de kwargs
            if db is None:
                for arg in args:
                    if isinstance(arg, Session):
                        db = arg
                        break
            
            # Verificar permiso
            perm_service = PermissionService(db)
            if not perm_service.has_permission(current_user, permission_key):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tienes permiso para '{permission_key}'"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def has_permission_sync(current_user: User, db: Session, permission_key: str) -> bool:
    """Función síncrona para verificar permisos dentro de servicios."""
    perm_service = PermissionService(db)
    return perm_service.has_permission(current_user, permission_key)