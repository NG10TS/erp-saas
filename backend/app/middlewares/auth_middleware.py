# app/middlewares/auth_middleware.py - VERSIÓN CORREGIDA FINAL

"""
Middleware de autenticación - VERSIÓN CORREGIDA
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Optional, Set
import logging
from uuid import UUID

from app.core.config import settings
from app.core.security import SecurityService
from app.core.database import SessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

# Definición centralizada de rutas públicas
PUBLIC_PATHS: Set[str] = {
    "/health",
    "/",
    "/api/docs",
    "/api/redoc",
    "/openapi.json",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/resend-verification",
    "/api/v1/webhooks/whatsapp",
    "/api/v1/webhooks",
}

# Rutas que requieren autenticación estricta
PROTECTED_PATHS: Set[str] = {
    "/api/v1/business",
    "/api/v1/users/me",
    "/api/v1/invoices",
    "/api/v1/products",
    "/api/v1/sales",
    "/api/v1/customers",
    "/api/v1/dashboard",
    "/api/v1/reports",
}

class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware para validar tokens JWT en cada request
    """
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Verificar si es ruta pública
        is_public = any(path.startswith(public_path) for public_path in PUBLIC_PATHS)
        is_protected = any(path.startswith(protected_path) for protected_path in PROTECTED_PATHS)
        
        # Inicializar estado
        request.state.user = None
        request.state.user_id = None
        request.state.business_id = None
        request.state.is_authenticated = False
        
        # Obtener token del header
        auth_header = request.headers.get("Authorization")
        token = None
        
        if auth_header:
            try:
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
                else:
                    logger.warning(f"Invalid auth header format for {path}")
            except Exception as e:
                logger.warning(f"Error parsing auth header for {path}: {e}")
        
        # ✅ CORREGIDO: Solo UNA sesión de base de datos
        if token:
            db = SessionLocal()
            try:
                payload = SecurityService.verify_token(token, token_type="access", db_session=db)
                
                if payload:
                    user_id = payload.get("sub")
                    business_id = payload.get("business_id")
                    
                    if user_id:
                        # ✅ REUTILIZAR la misma db, NO crear una nueva
                        user_repo = UserRepository(db)
                        user = user_repo.get(UUID(user_id))
                        
                        if user and user.is_active and user.is_verified:
                            request.state.user = user
                            request.state.user_id = user_id
                            request.state.business_id = business_id or str(user.business_id)
                            request.state.is_authenticated = True
                            
                            logger.debug(f"User authenticated: {user.email} for {path}")
                        else:
                            logger.warning(f"User {user_id} inactive/unverified for {path}")
                    else:
                        logger.warning(f"No user_id in token for {path}")
                else:
                    logger.debug(f"Invalid token for {path}")
            except Exception as e:
                logger.warning(f"Token validation error for {path}: {e}")
            finally:
                db.close()  # ✅ Cerrar la ÚNICA conexión
        
        # Decidir si permitir acceso
        if is_public:
            # Rutas públicas: siempre permitir
            return await call_next(request)
        
        elif is_protected or (not is_public and not path.startswith("/api/v1/webhooks")):
            # Rutas protegidas requieren autenticación
            if not request.state.is_authenticated:
                logger.warning(f"Unauthorized access to {path} from {request.client.host}")
                
                return JSONResponse(
                    status_code=401,
                    content={
                        "detail": "Not authenticated",
                        "path": path,
                        "auth_required": True
                    },
                    headers={"WWW-Authenticate": "Bearer"}
                )
        
        # Continuar con la petición
        response = await call_next(request)
        
        # Agregar headers informativos si está autenticado
        if request.state.is_authenticated:
            response.headers["X-User-ID"] = str(request.state.user_id)
            if request.state.business_id:
                response.headers["X-Tenant-ID"] = request.state.business_id
        
        return response