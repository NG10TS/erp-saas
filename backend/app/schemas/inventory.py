"""
Inventory movement schemas
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class InventoryMovementBase(BaseModel):
    product_id: UUID
    movement_type: str
    cantidad: int = Field(..., description="Positive or negative integer")
    motivo: str = Field(..., max_length=255)
    notas: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    reference_number: Optional[str] = None
    costo_unitario: Optional[Decimal] = None


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovementResponse(InventoryMovementBase):
    id: UUID
    business_id: UUID
    user_id: Optional[UUID]
    stock_anterior: int
    stock_nuevo: int
    costo_total: Optional[Decimal]
    created_at: datetime
    product_name: str
    
    model_config = ConfigDict(from_attributes=True)


class InventorySummary(BaseModel):
    total_products: int
    total_items: int
    total_value_cost: Decimal
    total_value_retail: Decimal
    low_stock_count: int
    out_of_stock_count: int