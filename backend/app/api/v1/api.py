"""
api/v1/api.py — All routers registered
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, business, products, customers,
    sales, invoices, whatsapp, webhooks, categories,
    dashboard, reports, onboarding, health, payments,
    waybills,
    # ============================================
    # NUEVOS
    business_users, admin, #oauth, # ← AGREGAR
)

api_router = APIRouter()

api_router.include_router(auth.router,           prefix="/auth",        tags=["autenticación"])
api_router.include_router(business.router,       prefix="/business",    tags=["negocios"])
api_router.include_router(categories.router,     prefix="/categories",  tags=["categorías"])
api_router.include_router(customers.router,      prefix="/customers",   tags=["clientes"])
api_router.include_router(dashboard.router,      prefix="/dashboard",   tags=["dashboard"])
api_router.include_router(health.router,         prefix="/health",      tags=["salud"])
api_router.include_router(invoices.router,       prefix="/invoices",    tags=["facturas"])
api_router.include_router(onboarding.router,     prefix="/onboarding",  tags=["onboarding"])
api_router.include_router(products.router,       prefix="/products",    tags=["productos"])
api_router.include_router(reports.router,        prefix="/reports",     tags=["reportes"])
api_router.include_router(sales.router,          prefix="/sales",       tags=["ventas"])
api_router.include_router(webhooks.router,       prefix="/webhooks",    tags=["webhooks"])
api_router.include_router(whatsapp.router,       prefix="/whatsapp",    tags=["whatsapp"])
api_router.include_router(payments.router,       prefix="/payments",    tags=["pagos"])

# ============================================
# NUEVOS ROUTERS
# ============================================

api_router.include_router(admin.router,          prefix="/admin",       tags=["Super Admin"])
api_router.include_router(business_users.router, tags=["Business Management"])
#api_router.include_router(oauth.router,          tags=["OAuth"])
api_router.include_router(waybills.router,       prefix="/waybills",    tags=["guías de remisión"])