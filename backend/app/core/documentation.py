"""
Custom OpenAPI documentation
"""
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def custom_openapi(app: FastAPI):
    """
    Customize OpenAPI schema
    """
    def openapi():
        if app.openapi_schema:
            return app.openapi_schema
        
        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            contact=app.contact,
            license_info=app.license_info,
        )
        
        # Customize tags
        openapi_schema["tags"] = [
            {
                "name": "autenticación",
                "description": "Operaciones de autenticación y gestión de usuarios"
            },
            {
                "name": "negocios",
                "description": "Configuración y gestión del negocio"
            },
            {
                "name": "productos",
                "description": "Gestión de productos e inventario"
            },
            {
                "name": "clientes",
                "description": "Gestión de clientes"
            },
            {
                "name": "ventas",
                "description": "Registro y gestión de ventas"
            },
            {
                "name": "facturas",
                "description": "Facturación electrónica SRI"
            },
            {
                "name": "whatsapp",
                "description": "Integración con WhatsApp Business"
            },
            {
                "name": "webhooks",
                "description": "Webhooks para integraciones externas"
            }
        ]
        
        # Security schemes
        openapi_schema["components"]["securitySchemes"] = {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter JWT token: eyJhbGc..."
            },
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "Enter your API key"
            }
        }
        
        # Global security
        openapi_schema["security"] = [{"BearerAuth": []}]
        
        # Add servers
        openapi_schema["servers"] = [
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            },
            {
                "url": "https://api.erp.com",
                "description": "Production server"
            }
        ]
        
        app.openapi_schema = openapi_schema
        return app.openapi_schema
    
    return openapi