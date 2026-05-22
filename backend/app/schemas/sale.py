"""
Sale schemas
"""
from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.constants.sales import SaleStatus, PaymentMethod, PaymentStatus


class SaleItemBase(BaseModel):
    product_id: UUID
    cantidad: int = Field(..., gt=0)
    precio_unitario: Optional[Decimal] = Field(None, gt=0)
    descuento: Decimal = Field(0, ge=0, decimal_places=2)


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(BaseModel):
    id: UUID
    nombre_producto: str
    sku_producto: Optional[str]
    cantidad: int
    precio_unitario: Decimal
    descuento: Decimal
    subtotal: Decimal
    iva_porcentaje: Decimal
    iva_monto: Decimal
    ice_porcentaje: Decimal
    ice_monto: Decimal
    
    model_config = ConfigDict(from_attributes=True)


class SaleBase(BaseModel):
    customer_id: Optional[UUID] = None
    customer_email: Optional[str] = None
    metodo_pago: PaymentMethod = PaymentMethod.CASH
    tipo_comprobante: Optional[str] = None  # CONSUMIDOR_FINAL o FACTURA
    notas: Optional[str] = None
    notas_internas: Optional[str] = None


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    descuento: Decimal = Field(0, ge=0, decimal_places=2)
    tipo_descuento: Optional[str] = None
    send_whatsapp: bool = True


class SaleUpdate(BaseModel):
    estado: Optional[SaleStatus] = None
    metodo_pago: Optional[PaymentMethod] = None
    estado_pago: Optional[PaymentStatus] = None
    notas: Optional[str] = None
    notas_internas: Optional[str] = None
    motivo_cancelacion: Optional[str] = None


class SaleResponse(SaleBase):
    id: UUID
    business_id: UUID
    numero_venta: str
    fecha_venta: datetime
    estado: SaleStatus
    subtotal: Decimal
    descuento: Decimal
    iva: Decimal
    ice: Decimal
    total: Decimal
    estado_pago: PaymentStatus
    factura_id: Optional[UUID]
    pdf_url: Optional[str] = None
    
    items: List[SaleItemResponse] = []
    
    # Customer info - usando property para acceder a la relación
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_identification: Optional[str] = None
    
    created_at: datetime
    created_by: Optional[UUID]
    confirmado_en: Optional[datetime]
    completado_en: Optional[datetime]
    cancelado_en: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_customer(cls, sale):
        """Método factory para crear response con datos del customer"""
        data = sale.__dict__.copy()
        # Incluir pdf_url desde factura si existe
        if hasattr(sale, 'factura') and sale.factura:
            data['pdf_url'] = sale.factura.pdf_url if hasattr(sale.factura, 'pdf_url') else None
        if sale.customer:
            data['customer_name'] = sale.customer.name
            data['customer_phone'] = sale.customer.phone_number
            data['customer_email'] = sale.customer.email
            data['customer_identification'] = sale.customer.identification
        return cls(**data)
        

class SaleListResponse(BaseModel):
    id: UUID
    numero_venta: str
    fecha_venta: datetime
    customer_name: Optional[str]
    customer_phone: Optional[str]
    estado: SaleStatus
    total: Decimal
    estado_pago: PaymentStatus
    factura_id: Optional[UUID]
    
    model_config = ConfigDict(from_attributes=True)


class SaleStatusUpdate(BaseModel):
    estado: SaleStatus
    motivo_cancelacion: Optional[str] = Field(None, min_length=3)
    
    @validator('motivo_cancelacion')
    def validate_cancellation_reason(cls, v, values):
        if values.get('estado') == SaleStatus.CANCELLED and not v:
            raise ValueError('Cancellation reason is required when cancelling a sale')
        return v