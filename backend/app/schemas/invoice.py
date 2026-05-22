"""
Invoice schemas
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class InvoiceDetailBase(BaseModel):
    """Base invoice detail schema"""
    product_id: UUID
    quantity: int = Field(..., ge=1)
    unit_price: Decimal
    discount: Decimal = Field(0, ge=0, decimal_places=2)
    iva_percentage: Decimal = Field(15.00, ge=0, le=15, decimal_places=2)


class InvoiceDetailResponse(InvoiceDetailBase):
    """Invoice detail response schema"""
    id: UUID
    product_name: str
    product_sku: Optional[str]
    total_price: Decimal
    iva_amount: Decimal
    
    model_config = ConfigDict(from_attributes=True)


class InvoiceBase(BaseModel):
    """Base invoice schema"""
    customer_id: Optional[UUID] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """Invoice creation schema"""
    sale_id: UUID  # Invoice is created from a sale
    send_whatsapp: bool = True


class InvoiceResponse(InvoiceBase):
    """Invoice response schema"""
    id: UUID
    business_id: UUID
    invoice_number: str
    sequential: str
    issue_date: datetime
    authorization_date: Optional[datetime]
    subtotal: Decimal
    discount: Decimal
    iva: Decimal
    ice: Decimal
    total: Decimal
    sri_status: str
    pdf_url: Optional[str]
    
    # Customer info
    customer_name: Optional[str]
    customer_identification: Optional[str]
    
    # Details
    details: List[InvoiceDetailResponse]
    
    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    """Invoice list response schema"""
    id: UUID
    invoice_number: str
    sequential: str
    issue_date: datetime
    customer_name: Optional[str]
    total: Decimal
    sri_status: str
    authorization_date: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class SriStatusResponse(BaseModel):
    """SRI status response"""
    status: str
    authorization_number: Optional[str]
    authorization_date: Optional[datetime]
    errors: Optional[List[Dict[str, Any]]]