"""
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime  # 🔥 IMPORTANTE: faltaba esta importación

from app.api.router import api_router
from app.core.config import settings
from app.core.database import engine, init_db
from app.core.logging import setup_logging
from app.middlewares.rate_limit import RateLimitMiddleware
from app.middlewares.tenant_middleware import TenantMiddleware
from app.middlewares.auth_middleware import AuthMiddleware  
from app.core.exceptions import setup_exception_handlers
from app.core.documentation import custom_openapi

# Configurar logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manejo del ciclo de vida de la aplicación
    """
    logger.info("🚀 Iniciando ERP Conversacional...")
    
    # Inicializar base de datos
    init_db()

    # Startup
    logger.info("✅ Base de datos conectada")
    logger.info(f"✅ Entorno: {settings.ENVIRONMENT}")
    logger.info(f"✅ Versión: {settings.VERSION}")
    logger.info(f"✅ API Docs: {'/api/docs' if settings.ENVIRONMENT != 'production' else 'disabled'}")
    
    yield
    
    # Shutdown
    logger.info("👋 Apagando ERP Conversacional...")
    engine.dispose()

# Crear aplicación
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    API para gestión de facturación electrónica SRI,
    inventario y ventas por WhatsApp para PYMES ecuatorianas.
    
    ## Características
    * Facturación electrónica compatible con SRI Ecuador
    * Gestión de inventario en tiempo real
    * Integración con WhatsApp Business API
    * Multi-tenencia por negocio
    * Reportes y analytics
    
    ## Autenticación
    Utiliza JWT Bearer token obtenido de `/api/v1/auth/login`
    
    ## Rate Limiting
    100 requests por minuto por IP/API Key
    
    ## Middlewares
    La aplicación utiliza los siguientes middlewares en orden:
    1. CORS
    2. Trusted Hosts
    3. Rate Limiting
    4. Authentication (JWT validation)
    5. Tenant isolation
    """,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    contact={
        "name": "Soporte ERP",
        "email": "soporte@erp.com",
        "url": "https://erp.com/support",
    },
    license_info={
        "name": "Proprietary",
        "url": "https://erp.com/license",
    },
)

# Custom OpenAPI
app.openapi = custom_openapi(app)

# ============================================
# 1. MIDDLEWARES DE SEGURIDAD (más externos)
# ============================================

# CORS - Debe ser el primero para manejar preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=[
        "X-Tenant-ID", 
        "X-User-ID", 
        "X-RateLimit-Limit", 
        "X-RateLimit-Remaining",
        "Location"  # ✅ Permitir header Location para redirecciones
    ],
    max_age=600,  # ✅ Cache de preflight por 10 minutos
)

# Trusted Hosts - Protección contra host header attacks
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# ============================================
# 2. MIDDLEWARES DE APLICACIÓN (orden crítico)
# ============================================

# Rate Limiting - Debe ir ANTES de auth para proteger contra ataques
app.add_middleware(RateLimitMiddleware)

# Authentication - Procesa JWT y establece request.state.user
# 🔥 IMPORTANTE: Este middleware debe estar HABILITADO y antes que TenantMiddleware
app.add_middleware(AuthMiddleware) 

# Tenant - Aísla datos por negocio usando request.state.user
app.add_middleware(TenantMiddleware)

# ============================================
# 3. CONFIGURACIÓN ADICIONAL
# ============================================

# Configurar manejadores de excepciones
setup_exception_handlers(app)

# Incluir routers
app.include_router(api_router, prefix="/api")

# ============================================
# 4. ENDPOINTS PÚBLICOS
# ============================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint para monitoreo
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected",
            "api": "operational"
        }
    }

@app.get("/")
async def root():
    """
    Root endpoint con información de la API
    """
    return {
        "message": "ERP Conversacional API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/api/docs" if settings.ENVIRONMENT != "production" else "disabled",
        "health": "/health",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Configuración para desarrollo
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.ENVIRONMENT == "development",
    )