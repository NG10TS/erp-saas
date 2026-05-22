"""
Sale and SaleItem models
"""
from sqlalchemy import (
    Column, String, Numeric, DateTime, ForeignKey, Text, 
    Integer, Enum, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from typing import Optional  # ✅ Añade esta importación

from app.db.base_class import BaseModel


class SaleStatus(str, enum.Enum):
    PENDING = "pending"      # Stock reservado
    CONFIRMED = "confirmed"   # Cliente confirmó
    PROCESSING = "processing" # En preparación
    COMPLETED = "completed"   # Pagado y entregado
    CANCELLED = "cancelled"   # Cancelada


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    CARD = "card"
    QR = "qr"
    MIXED = "mixed"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"


class Sale(BaseModel):
    __tablename__ = "sales"
    
    __table_args__ = (
        Index('ix_sales_business_number', 'business_id', 'numero_venta', unique=True),
        Index('ix_sales_business_date', 'business_id', 'fecha_venta'),
        Index('ix_sales_customer', 'customer_id'),
        Index('ix_sales_status', 'business_id', 'estado'),
        Index('ix_sales_payment_status', 'business_id', 'estado_pago'),
        # CheckConstraint('total = subtotal - descuento + iva + ice', name='ck_sale_total_calculation'),  # ← COMENTADA
        CheckConstraint('total >= 0', name='ck_sale_total_non_negative'),
    )
    
    # Foreign Keys
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Sale identifiers
    numero_venta = Column(String(50), nullable=False)
    fecha_venta = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Status
    estado = Column(Enum(SaleStatus), default=SaleStatus.PENDING)
    
    # Totals
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)
    descuento = Column(Numeric(10, 2), nullable=False, default=0)
    tipo_descuento = Column(String(10))  # percentage, fixed
    iva = Column(Numeric(10, 2), nullable=False, default=0)
    ice = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Payment
    metodo_pago = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    estado_pago = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    detalles_pago = Column(JSONB, default=dict)
    fecha_pago = Column(DateTime(timezone=True))
    
    # Invoice reference
    factura_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    
    # Receipt type (for invoice generation)
    tipo_comprobante = Column(String(50), default="CONSUMIDOR_FINAL")  # CONSUMIDOR_FINAL or FACTURA
    customer_email = Column(String(255), nullable=True)  # Email for invoice delivery
    
    # WhatsApp/Session tracking
    sesion_whatsapp_id = Column(String(255))
    # Whatsapp 
    whatsapp_messages = relationship(
        "WhatsAppMessage",
        back_populates="sale"
    )
    # Notes
    notas = Column(Text)
    notas_internas = Column(Text)
    
    # Cancellation
    motivo_cancelacion = Column(String(255))
    
    # Timestamps
    confirmado_en = Column(DateTime(timezone=True))
    completado_en = Column(DateTime(timezone=True))
    cancelado_en = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    invoice = relationship("Invoice", foreign_keys=[factura_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Sale {self.numero_venta}: ${self.total}>"
    
    def calculate_totals(self):
        """Recalculate sale totals from items"""
        self.subtotal = sum(item.subtotal for item in self.items)
        self.iva = sum(item.iva_monto for item in self.items)
        self.ice = sum(item.ice_monto for item in self.items)
        self.total = self.subtotal - self.descuento + self.iva + self.ice
    
    def can_transition_to(self, new_status):
        """Check if status transition is valid"""
        valid_transitions = {
            SaleStatus.PENDING: [SaleStatus.CONFIRMED, SaleStatus.CANCELLED],
            SaleStatus.CONFIRMED: [SaleStatus.PROCESSING, SaleStatus.CANCELLED],
            SaleStatus.PROCESSING: [SaleStatus.COMPLETED, SaleStatus.CANCELLED],
            SaleStatus.COMPLETED: [],  # Terminal state
            SaleStatus.CANCELLED: [],  # Terminal state
        }
        return new_status in valid_transitions.get(self.estado, [])
    
    # ✅ PROPERTIES PARA SALE RESPONSE (AGREGAR ESTO)
    @property
    def customer_name(self) -> Optional[str]:
        """Get customer name from relationship"""
        return self.customer.name if self.customer else None
    
    @property
    def customer_phone(self) -> Optional[str]:
        """Get customer phone from relationship"""
        return self.customer.phone_number if self.customer else None
    
    @property
    def customer_identification(self) -> Optional[str]:
        """Get customer identification from relationship"""
        return self.customer.identification if self.customer else None


class SaleItem(BaseModel):
    __tablename__ = "sale_items"
    
    __table_args__ = (
        Index('ix_sale_items_sale', 'sale_id'),
        Index('ix_sale_items_product', 'product_id'),
        CheckConstraint('cantidad > 0', name='ck_sale_item_quantity_positive'),
    )
    
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    
    # Product snapshot
    nombre_producto = Column(String(255), nullable=False)
    sku_producto = Column(String(50))
    
    # Quantities and pricing
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    descuento = Column(Numeric(10, 2), nullable=False, default=0)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    # Taxes
    iva_porcentaje = Column(Numeric(5, 2), nullable=False, default=15.00)
    iva_monto = Column(Numeric(10, 2), nullable=False, default=0)
    ice_porcentaje = Column(Numeric(5, 2), nullable=False, default=0)
    ice_monto = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Notes
    notas = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sale = relationship("Sale", back_populates="items")
    # Product
    product = relationship("Product", back_populates="sale_items")
    
    def __repr__(self):
        return f"<SaleItem {self.nombre_producto} x{self.cantidad}>"
    
    def calculate(self):
        """Calculate item totals"""
        self.subtotal = (self.cantidad * self.precio_unitario) - self.descuento
        self.iva_monto = self.subtotal * (self.iva_porcentaje / 100)
        self.ice_monto = self.subtotal * (self.ice_porcentaje / 100) if self.ice_porcentaje else 0