"""
Customer schemas
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class CustomerBase(BaseModel):
    """Base customer schema"""
    phone_number: str = Field(..., pattern=r'^\+?[0-9]{10,15}$')
    name: Optional[str] = Field(None, max_length=255)
    identification: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    
    @validator('phone_number')
    def normalize_phone(cls, v):
        # Remove non-digit characters except leading +
        cleaned = ''.join(c for c in v if c.isdigit() or c == '+')
        if not cleaned.startswith('+'):
            # Add Ecuador country code if missing
            if cleaned.startswith('0'):
                cleaned = '+593' + cleaned[1:]
            elif len(cleaned) == 9:
                cleaned = '+593' + cleaned
        return cleaned


class CustomerCreate(CustomerBase):
    """Customer creation schema"""
    pass


class CustomerUpdate(BaseModel):
    """Customer update schema"""
    name: Optional[str] = Field(None, max_length=255)
    identification: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: UUID
    business_id: UUID
    total_purchases: int
    total_spent: Decimal
    average_purchase: Decimal
    last_purchase_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    notes: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class CustomerListResponse(BaseModel):
    """Customer list response schema"""
    id: UUID
    phone_number: str
    name: Optional[str]
    identification: Optional[str]
    total_purchases: int
    last_purchase_date: Optional[datetime]
    is_active: bool  # ✅ AGREGAR este campo
    is_blocked: bool  # ✅ También sería bueno incluir
    model_config = ConfigDict(from_attributes=True)