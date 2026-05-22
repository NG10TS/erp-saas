# app/schemas/business.py

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class BusinessBase(BaseModel):
    """Base business schema"""
    ruc: str = Field(..., pattern=r'^[0-9]{13}$')
    business_name: str = Field(..., min_length=3, max_length=255)
    commercial_name: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r'^\+?[0-9]{10,15}$')
    address: Optional[str] = None
    
    @field_validator("ruc")
    @classmethod
    def validate_ruc(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 13:
            raise ValueError("RUC must be 13 digits")
        return v


class BusinessCreate(BusinessBase):
    """Business creation schema"""
    sri_environment: str = "1"
    sri_emisor_type: str = "01"


class BusinessUpdate(BaseModel):
    """Business update schema - ALL FIELDS OPTIONAL"""
    business_name: Optional[str] = Field(None, min_length=3, max_length=255)
    commercial_name: Optional[str] = Field(None, max_length=255)
    ruc: Optional[str] = Field(None, pattern=r'^[0-9]{13}$')
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r'^\+?[0-9]{10,15}$')
    address: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    
    @field_validator("ruc")
    @classmethod
    def validate_ruc(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v.isdigit() or len(v) != 13):
            raise ValueError("RUC must be 13 digits")
        return v


class SriConfigUpdate(BaseModel):
    """SRI configuration update"""
    sri_environment: str = Field("1", pattern=r'^[12]$')
    sri_emisor_type: str = Field("01", pattern=r'^[0-9]{2}$')
    sri_resolution_number: Optional[str] = None


class WhatsAppConfigUpdate(BaseModel):
    """WhatsApp configuration update"""
    whatsapp_business_phone: str = Field(..., pattern=r'^\+?[0-9]{10,15}$')
    whatsapp_business_id: str
    whatsapp_access_token: str


class CertificateUpload(BaseModel):
    """Digital certificate upload"""
    certificate: str
    password: str


class BusinessResponse(BaseModel):
    """Business response schema"""
    id: UUID
    ruc: str
    business_name: str
    commercial_name: Optional[str] = None
    email: str = ""
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    
    sri_environment: str
    sri_emisor_type: str
    sri_has_digital_certificate: bool
    digital_certificate_expires_at: Optional[datetime]
    
    whatsapp_business_phone: Optional[str]
    whatsapp_webhook_verified: bool
    
    subscription_plan: str
    subscription_status: str
    settings: Dict[str, Any]
    
    is_active: bool
    is_verified: bool
    onboarding_completed: bool
    
    current_users: int
    current_products: int
    current_invoices_month: int
    max_users: int
    max_products: int
    max_invoices_monthly: int
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)