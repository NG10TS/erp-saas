# backend/app/schemas/subscription.py
"""
Esquemas Pydantic para suscripciones y planes
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class SubscriptionPlanUpdate(BaseModel):
    """Esquema para actualizar el plan de suscripción de un negocio."""
    plan_name: str = Field(..., description="Nombre del plan: micro, startup, business, enterprise")
    days_valid: Optional[int] = Field(30, description="Días de validez del plan")


class SubscriptionResponse(BaseModel):
    """Respuesta de información de suscripción."""
    id: UUID
    business_id: UUID
    plan_name: str
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool = False
    
    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    """Esquema para crear una nueva suscripción."""
    business_id: UUID
    plan_name: str = "free"
    status: str = "active"
    current_period_end: Optional[datetime] = None


class SubscriptionUpdate(BaseModel):
    """Esquema para actualizar una suscripción existente."""
    plan_name: Optional[str] = None
    status: Optional[str] = None
    current_period_end: Optional[datetime] = None