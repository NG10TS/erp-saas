# app/dependencies/rbac.py - CREAR

from fastapi import Depends, HTTPException, status
from typing import List, Optional
from functools import wraps

from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.constants.roles import UserRole


class RoleChecker:
    """Verificador de roles para endpoints protegidos"""
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_active_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos roles: {', '.join(self.allowed_roles)}",
            )
        return current_user


def require_roles(allowed_roles: List[str]):
    """
    Decorador para proteger endpoints por rol.
    
    Uso:
        @require_roles([UserRole.OWNER, UserRole.ADMIN])
        @router.get("/admin-only")
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_active_user), **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Se requiere uno de estos roles: {', '.join(allowed_roles)}",
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator