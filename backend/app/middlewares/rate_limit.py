# app/middlewares/rate_limit.py
"""
Middleware de rate limiting profesional
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict
from typing import Dict, List, Set, Optional
import asyncio
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter profesional con soporte para múltiples estrategias"""
    
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(
        self, 
        key: str, 
        requests_per_minute: int = 60,
        window_seconds: int = 60
    ) -> tuple[bool, int]:
        """
        Verifica rate limit con ventana deslizante
        Returns: (allowed, retry_after)
        """
        async with self.lock:
            now = time.time()
            window = window_seconds
            
            # Limpiar requests antiguos
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > now - window
            ]
            
            # Verificar límite
            if len(self.requests[key]) >= requests_per_minute:
                oldest = min(self.requests[key]) if self.requests[key] else now
                retry_after = int(window - (now - oldest))
                return False, max(0, retry_after)
            
            # Añadir request actual
            self.requests[key].append(now)
            return True, 0
    
    async def clear(self, key: str) -> None:
        """Limpiar requests para una clave específica"""
        async with self.lock:
            if key in self.requests:
                self.requests[key] = []
                logger.debug(f"Cleared rate limit for {key}")


# Instancia global
rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware de rate limiting profesional
    
    Características:
    - Rate limiting solo para endpoints sensibles
    - Límites diferenciados por tipo de endpoint
    - Limpieza automática después de login exitoso
    - No afecta a usuarios autenticados
    """
    
    # Rutas sensibles que requieren rate limiting
    SENSITIVE_PATHS: Set[str] = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
    }
    
    # Configuración de límites por tipo de endpoint
    RATE_LIMIT_CONFIG = {
        "login": {"limit": 10, "window": 60},      # 10 intentos/minuto
        "register": {"limit": 5, "window": 60},    # 5 registros/minuto
        "password": {"limit": 3, "window": 60},    # 3 recuperaciones/minuto
        "default": {"limit": 30, "window": 60},    # 30 requests/minuto por defecto
    }
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # ✅ Verificar si es una ruta sensible
        is_sensitive = any(path.startswith(sensitive_path) for sensitive_path in self.SENSITIVE_PATHS)
        
        # Rutas no sensibles: pasar sin rate limit
        if not is_sensitive:
            return await call_next(request)
        
        # Determinar tipo de endpoint
        if "/login" in path:
            endpoint_type = "login"
        elif "/register" in path:
            endpoint_type = "register"
        else:
            endpoint_type = "password"
        
        # Obtener configuración
        config = self.RATE_LIMIT_CONFIG.get(endpoint_type, self.RATE_LIMIT_CONFIG["default"])
        
        # Clave única para rate limiting (IP)
        client_ip = request.client.host
        key = f"auth:{client_ip}:{endpoint_type}"
        
        # Verificar rate limit
        allowed, retry_after = await rate_limiter.check_rate_limit(
            key, 
            requests_per_minute=config["limit"],
            window_seconds=config["window"]
        )
        
        if not allowed:
            logger.warning(f"Rate limit excedido para {key}")
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos. Por favor espera {retry_after} segundos.",
                headers={"Retry-After": str(retry_after)}
            )
        
        # Procesar la petición
        response = await call_next(request)
        
        # ✅ Limpiar rate limit después de login exitoso
        if endpoint_type == "login" and response.status_code == 200:
            await rate_limiter.clear(key)
            logger.info(f"Rate limit cleared for {client_ip} after successful login")
        
        return response