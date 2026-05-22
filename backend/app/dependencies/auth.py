# app/dependencies/auth.py
"""
Authentication dependencies - VERSIÓN CORREGIDA
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.business import Business
from app.repositories.user_repository import UserRepository
from app.constants.roles import UserRole, ROLE_PERMISSIONS

# Configuración de OAuth2
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)

# HTTP Bearer para API Keys
http_bearer = HTTPBearer(auto_error=False)


# 🔥 FUNCIÓN FALTANTE - get_optional_user
async def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Obtiene el usuario actual si está autenticado, retorna None si no.
    Útil para endpoints que pueden funcionar con o sin autenticación.
    """
    if not token:
        return None
    
    from app.core.security import security_service
    payload = security_service.verify_token(token, token_type="access")
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user_repo = UserRepository(db)
    user = user_repo.get(UUID(user_id))
    
    if user and user.is_active and user.is_verified:
        return user
    
    return None


async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Obtiene el usuario actual si está autenticado, retorna None si no.
    Utiliza request.state como caché para evitar consultas repetidas.
    """
    # Verificar si ya está en request.state (del middleware)
    if hasattr(request.state, 'user') and request.state.user:
        return request.state.user
    
    # Si no está en state pero tenemos token, intentar validar
    if token:
        from app.core.security import security_service
        payload = security_service.verify_token(token, token_type="access")
        
        if payload:
            user_id = payload.get("sub")
            if user_id:
                user_repo = UserRepository(db)
                user = user_repo.get(UUID(user_id))
                if user and user.is_active and user.is_verified:
                    return user
    
    return None


# app/dependencies/auth.py - CORREGIDO

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Obtiene el usuario actual con la sesión activa
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decodificar token
    from app.core.security import security_service
    payload = security_service.verify_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # ✅ IMPORTANTE: Obtener usuario con la sesión activa
    user_repo = UserRepository(db)
    user = user_repo.get(UUID(user_id))
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # ✅ Guardar en request.state para usar en otros lugares
    request.state.user = user
    request.state.user_id = user_id
    request.state.business_id = payload.get("business_id")
    
    return user


async def get_current_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),  # ✅ Agregar db para mantener sesión
    request: Request = None
) -> Business:
    """
    Obtiene el negocio del usuario actual con sesión activa
    """
    # ✅ Refresh para mantener la sesión activa
    db.refresh(current_user)
    
    # ✅ Acceder a business con la sesión activa
    if not current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found for user"
        )
    
    # ✅ Obtener business explícitamente con la sesión
    from app.repositories.business_repository import BusinessRepository
    business_repo = BusinessRepository(db)
    business = business_repo.get(current_user.business_id)
    
    if not business or not business.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business is inactive or not found"
        )
    
    return business

async def get_current_user_strict(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(http_bearer)
) -> User:
    """
    Versión estricta que requiere token en header (para APIs externas)
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validar token
    from app.core.security import security_service
    payload = security_service.verify_token(token.credentials, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user_repo = UserRepository(db)
    user = user_repo.get(UUID(user_id))
    
    if not user or not user.is_active or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Obtiene el usuario actual verificando que esté activo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account. Please contact support."
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Obtiene el usuario actual verificando que tenga el email confirmado.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not verified. Please verify your email address."
        )
    return current_user



def require_permissions(required_permissions: List[str]):
    """
    Dependency factory para verificar permisos
    """
    async def permission_dependency(
        current_user: User = Depends(get_current_user)
    ):
        user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])
        
        # Verificar cada permiso requerido
        for permission in required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {permission}"
                )
        
        return current_user
    
    return permission_dependency


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency factory para verificar roles
    """
    async def role_dependency(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {current_user.role} not allowed. Required: {[r.value for r in allowed_roles]}"
            )
        return current_user
    
    return role_dependency


# Role shortcuts
require_admin = require_role([UserRole.OWNER, UserRole.ADMIN])
require_manager = require_role([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER])
require_seller = require_role([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER])