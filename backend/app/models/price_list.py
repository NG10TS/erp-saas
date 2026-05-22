"""
Price List models for advanced pricing
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base_class import BaseModel


class PriceListType(str, enum.Enum):
    GENERAL = "general"
    POR_CLIENTE = "por_cliente"
    POR_VOLUMEN = "por_volumen"


class PriceList(BaseModel):
    __tablename__ = "price_lists"
    
    __table_args__ = (
        Index('ix_price_lists_business_name', 'business_id', 'name', unique=True),
    )
    
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False, default=PriceListType.GENERAL)
    description = Column(String(500))
    
    is_active = Column(Boolean, default=True)
    
    # Validity period
    fecha_inicio = Column(DateTime(timezone=True))
    fecha_fin = Column(DateTime(timezone=True))
    
    # Priority (lower number = higher priority)
    priority = Column(Integer, default=0)
    
    # Relationships
    
    business = relationship("Business", back_populates="price_lists")
    items = relationship("PriceListItem", back_populates="price_list", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PriceList {self.name}>"


class PriceListItem(BaseModel):
    __tablename__ = "price_list_items"
    
    __table_args__ = (
        Index('ix_price_list_items_list_product', 'price_list_id', 'product_id', unique=True),
    )
    
    price_list_id = Column(UUID(as_uuid=True), ForeignKey("price_lists.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    
    precio = Column(Numeric(10, 2), nullable=False)
    cantidad_minima = Column(Integer, default=1)  # For volume pricing
    
    # Relationships
    price_list = relationship("PriceList", back_populates="items")
    product = relationship("Product", back_populates="price_list_items")