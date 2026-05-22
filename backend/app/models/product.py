# app/models/product.py
"""
Product model with inventory management
"""
from typing import Optional, List, Dict, Any  # ✅ IMPORTANTE: Agregar esto
from datetime import datetime, timezone  # ✅ Para usar datetime.utcnow()
from sqlalchemy import (
    Column, String, Numeric, Integer, Boolean, DateTime, 
    ForeignKey, Text, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import text
from sqlalchemy import Computed
from sqlalchemy.dialects.postgresql import TSVECTOR
from app.db.base_class import BaseModel


class Product(BaseModel):
    __tablename__ = "products"

    # COLUMNA search_vector
    search_vector = Column(
        TSVECTOR,
        Computed(
            "to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))",
            persisted=True
        )
    )

    __table_args__ = (
        Index('ix_products_business_sku', 'business_id', 'sku', unique=True),
        Index('ix_products_business_barcode', 'business_id', 'barcode'),
        Index('ix_products_business_category', 'business_id', 'category_id'),
        Index('ix_products_business_active', 'business_id', 'is_active'),
        Index(
            'ix_products_low_stock',
            'business_id',
            'stock_actual',
            postgresql_where=text("stock_actual <= stock_minimo")
        ),
        Index(
            'ix_products_search',
            'search_vector',
            postgresql_using='gin'
        ),
        CheckConstraint('precio_venta >= 0', name='ck_product_price_positive'),
        CheckConstraint('stock_actual >= 0', name='ck_product_stock_non_negative'),
    )
    
    # Foreign Keys
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Basic Info
    sku = Column(String(50))
    barcode = Column(String(50))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Pricing
    precio_venta = Column(Numeric(10, 2), nullable=False)
    precio_mayorista = Column(Numeric(10, 2))
    costo = Column(Numeric(10, 2))
    
    # Calculated fields
    utilidad_porcentaje = Column(Numeric(5, 2), nullable=False, server_default='0')
    
    # Taxes (Ecuador SRI)
    impuesto_iva = Column(Numeric(5, 2), nullable=False, server_default='15.00')
    codigo_iva_sri = Column(String(2), nullable=False, server_default='2')
    tiene_ice = Column(Boolean, nullable=False, default=False)
    porcentaje_ice = Column(Numeric(5, 2), server_default='0')
    codigo_ice_sri = Column(String(2))
    
    # Inventory Control
    control_stock = Column(Boolean, nullable=False, default=True)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=0)
    stock_maximo = Column(Integer)
    stock_reservado = Column(Integer, default=0)
    ubicacion = Column(String(100))
    
    @property
    def stock_disponible(self):
        """Available stock for sale"""
        return self.stock_actual - self.stock_reservado
    
    # Product type
    es_servicio = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Media
    imagen_url = Column(String(500))
    imagenes = Column(JSONB, default=list)
    
    # Attributes
    atributos = Column(JSONB, default=dict)
    tags = Column(JSONB, default=list)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # ✅ Quién eliminó
    
    # Relationships
    business = relationship("Business", back_populates="products")
    category = relationship("Category", back_populates="products")
    creator = relationship("User", foreign_keys=[created_by])
    sale_items = relationship("SaleItem", back_populates="product")
    inventory_movements = relationship("InventoryMovement", back_populates="product")
    price_list_items = relationship("PriceListItem", back_populates="product")
    
    def __repr__(self):
        return f"<Product {self.name} (${self.precio_venta})>"
    
    def can_sell(self, quantity):
        """Check if product can be sold in given quantity"""
        if not self.control_stock or self.es_servicio:
            return True
        return self.stock_disponible >= quantity
    
    def reserve_stock(self, quantity):
        """Reserve stock for a sale"""
        if self.can_sell(quantity):
            self.stock_reservado += quantity
            return True
        return False
    
    def release_stock(self, quantity):
        """Release reserved stock"""
        self.stock_reservado = max(0, self.stock_reservado - quantity)
    
    def consume_stock(self, quantity):
        """Consume stock after sale completion"""
        if self.stock_actual >= quantity:
            self.stock_actual -= quantity
            self.stock_reservado = max(0, self.stock_reservado - quantity)
            return True
        return False
    
    # ============================================
    # SOFT DELETE METHODS
    # ============================================
    
    def soft_delete(self, user_id: Optional[UUID] = None) -> None:
        """
        Soft delete product - marks as inactive and sets deleted_at timestamp
        """
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        if user_id:
            self.deleted_by = user_id
    
    def restore(self) -> None:
        """
        Restore a soft-deleted product
        """
        self.is_active = True
        self.deleted_at = None
        self.deleted_by = None
    
    @property
    def is_deleted(self) -> bool:
        """Check if product is soft deleted"""
        return self.deleted_at is not None
    
    @property
    def can_be_restored(self) -> bool:
        """Check if product can be restored"""
        return self.is_deleted and not self.is_active