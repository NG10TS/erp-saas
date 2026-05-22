# app/constants/public_paths.py
"""
Centralización de rutas para autenticación
"""
from typing import Set

# Rutas que NO requieren autenticación
PUBLIC_PATHS: Set[str] = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/resend-verification",
    "/api/v1/webhooks/whatsapp",
}

# Rutas que requieren autenticación ESTRICTA (401 si no hay token)
PROTECTED_PATHS: Set[str] = {
    "/api/v1/business",
    "/api/v1/users/me",
    "/api/v1/invoices",
    "/api/v1/products",
    "/api/v1/sales",
    "/api/v1/customers",
    "/api/v1/dashboard",
}

# Rutas que son OPTATIVAS (pueden tener token o no)
OPTIONAL_AUTH_PATHS: Set[str] = {
    "/api/v1/public",
    "/api/v1/products/public",  # Por ejemplo, catálogo público
}