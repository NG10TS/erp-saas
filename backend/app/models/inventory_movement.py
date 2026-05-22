"""
Inventory Movement model for traceability
"""
from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime, ForeignKey, 
    Text, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from sqlalchemy import Column, Integer, JSON, ForeignKey

from app.db.base_class import BaseModel


class MovementType(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"
    DEVOLUCION = "devolucion"
    RESERVA = "reserva"
    LIBERACION = "liberacion"


class InventoryMovement(BaseModel):
    __tablename__ = "inventory_movements"
    
    __table_args__ = (
        Index('ix_inventory_movements_product', 'product_id', 'created_at'),
        Index('ix_inventory_movements_reference', 'reference_type', 'reference_id'),
        Index('ix_inventory_movements_type', 'movement_type'),
        CheckConstraint('cantidad != 0', name='ck_movement_quantity_non_zero'),
    )
    
    # Foreign Keys
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Movement Info
    movement_type = Column(String(20), nullable=False)  # Usar MovementType
    cantidad = Column(Integer, nullable=False)
    
    # Stock snapshot
    stock_anterior = Column(Integer, nullable=False)
    stock_nuevo = Column(Integer, nullable=False)
    
    # Cost info
    costo_unitario = Column(Numeric(10, 2))
    costo_total = Column(Numeric(10, 2))
    
    # Reference (sale, purchase, adjustment)
    reference_type = Column(String(20))  # 'venta', 'compra', 'ajuste'
    reference_id = Column(UUID(as_uuid=True))
    reference_number = Column(String(50))
    
    # Location tracking
    from_location = Column(String(100))
    to_location = Column(String(100))
    
    # Reason
    motivo = Column(String(255))
    notas = Column(Text)
    
    # Metadata
    extra_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    business = relationship("Business")
    product = relationship("Product", back_populates="inventory_movements")
    user = relationship("User")
    
    def __repr__(self):
        return f"<InventoryMovement {self.movement_type}: {self.cantidad}>"