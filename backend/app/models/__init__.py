"""
Models initialization
"""
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice, InvoiceDetail
from app.models.whatsapp_message import WhatsAppMessage
from app.models.price_list import PriceList, PriceListItem
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from app.models.whatsapp_template import WhatsAppTemplate
from app.models.onboarding_progress import OnboardingProgress
from app.models.token_blacklist import TokenBlacklist
from app.models.cart import Cart, CartItem
from app.models.subscription import Subscription

# ============================================
# NUEVOS MODELOS PARA ROLES, PERMISOS Y AUDITORÍA
# ============================================
from app.models.user_permission import UserPermission
from app.models.role_permission import RolePermission
from app.models.business_audit_log import BusinessAuditLog
from app.models.invoice_sequence import InvoiceSequence
from app.models.credit_note import CreditNote
from app.models.waybill import Waybill


__all__ = [
    "User",
    "Business",
    "Cart",
    "CartItem",
    "Category",
    "Customer",
    "InventoryMovement",
    "Invoice",
    "InvoiceDetail",
    "OnboardingProgress",
    "PriceList",
    "PriceListItem",
    "Product",
    "Sale",
    "SaleItem",
    "Subscription",
    "TokenBlacklist",
    "WhatsAppMessage",
    "WhatsAppTemplate",
    # NUEVOS
    "UserPermission",
    "RolePermission",
    "BusinessAuditLog",
    "InvoiceSequence",
    "CreditNote",
    "Waybill",

]