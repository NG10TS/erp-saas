"""
Endpoints package initialization
"""
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import business  
from app.api.v1.endpoints import categories  
from app.api.v1.endpoints import customers
from app.api.v1.endpoints import dashboard
from app.api.v1.endpoints import health
from app.api.v1.endpoints import invoices
from app.api.v1.endpoints import onboarding
from app.api.v1.endpoints import products
from app.api.v1.endpoints import reports
from app.api.v1.endpoints import sales
from app.api.v1.endpoints import webhooks
from app.api.v1.endpoints import whatsapp
from app.api.v1.endpoints import payments

# ============================================
# NUEVOS ENDPOINTS (roles, permisos, super admin)
# ============================================
from app.api.v1.endpoints import business_users  # ← AGREGAR
from app.api.v1.endpoints import admin           # ← AGREGAR
#from app.api.v1.endpoints import oauth            # ← AGREGAR
from app.api.v1.endpoints import waybills


__all__ = [
    "auth",
    "business",
    "categories",
    "products",
    "customers",
    "dashboard",
    "invoices",
    "onboarding",
    "reports",
    "health",
    "sales",
    "whatsapp",
    "webhooks",
    "payments",
    "business_users",  # ← AGREGAR
    "admin",           # ← AGREGAR
    #"oauth",             # ← AGREGAR
    "waybills",

]