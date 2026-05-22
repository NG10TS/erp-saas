"""
Middleware de multi-tenencia
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware para identificar y aislar datos por negocio (tenant)
    """
    
    async def dispatch(self, request: Request, call_next):
        # Inicializar tenant por defecto
        request.state.tenant_id = None
        request.state.tenant_context = {}
        
        # Identificar tenant por:
        # 1. Subdominio
        host = request.headers.get("host", "")
        subdomain = host.split(".")[0] if "." in host else None
        
        if subdomain and subdomain not in ["www", "app", "api"]:
            request.state.tenant_subdomain = subdomain
        
        # 2. Header personalizado (para APIs)
        tenant_header = request.headers.get("X-Tenant-ID")
        if tenant_header:
            request.state.tenant_id = tenant_header
        
        # 3. JWT (ya procesado en auth middleware)
        if hasattr(request.state, 'business_id'):
            request.state.tenant_id = str(request.state.business_id)
            request.state.tenant_context['business_id'] = request.state.business_id
        
        response = await call_next(request)
        
        # Añadir headers de tenant en respuesta
        if request.state.tenant_id:
            response.headers["X-Tenant-ID"] = request.state.tenant_id
        
        return response