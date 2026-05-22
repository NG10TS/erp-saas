"""
Constantes para el módulo de ventas
"""
from enum import Enum


class SaleStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    CARD = "card"
    QR = "qr"
    MIXED = "mixed"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"


class MovementType(str, Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"
    DEVOLUCION = "devolucion"
    RESERVA = "reserva"
    LIBERACION = "liberacion"

# Canales de venta
SALE_CHANNELS = {
    "whatsapp": "WhatsApp",
    "web": "Web",
    "pos": "Punto de Venta",
    "mobile": "App Móvil",
    "facebook": "Facebook",
    "instagram": "Instagram",
}

# Estados de pedido en WhatsApp
WHATSAPP_ORDER_STATUS = {
    "new": "Nuevo pedido",
    "processing": "Procesando",
    "ready": "Listo para entrega",
    "delivered": "Entregado",
    "cancelled": "Cancelado",
}