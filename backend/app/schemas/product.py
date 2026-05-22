"""
Product schemas
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class ProductBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    sku: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    
    # Para Decimal, solo usa gt, ge, lt, le
    precio_venta: Decimal = Field(..., gt=0)
    precio_mayorista: Optional[Decimal] = Field(None, gt=0)
    costo: Optional[Decimal] = Field(None, ge=0)
    
    impuesto_iva: Decimal = Field(15.00, ge=0, le=15)
    codigo_iva_sri: str = Field("2", max_length=2)
    tiene_ice: bool = False
    porcentaje_ice: Optional[Decimal] = Field(None, ge=0)
    codigo_ice_sri: Optional[str] = Field(None, max_length=2)
    
    control_stock: bool = True
    stock_actual: int = Field(0, ge=0)
    stock_minimo: int = Field(0, ge=0)
    stock_maximo: Optional[int] = Field(None, ge=0)
    ubicacion: Optional[str] = Field(None, max_length=100)
    
    es_servicio: bool = False
    imagen_url: Optional[str] = None
    imagenes: List[str] = []
    atributos: Dict[str, Any] = {}
    tags: List[str] = []
    
    @field_validator('stock_actual')
    @classmethod
    def validate_stock(cls, v: int, info) -> int:
        if info.data.get('control_stock') and v is None:
            raise ValueError('stock_actual is required when control_stock is True')
        return v


class ProductCreate(BaseModel):
    """Schema for creating a product"""
    model_config = ConfigDict(from_attributes=True)
    
    sku: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    
    # Prices
    precio_venta: Decimal = Field(..., gt=0, description="Sales price")
    precio_mayorista: Optional[Decimal] = Field(None, ge=0)
    costo: Optional[Decimal] = Field(None, ge=0, description="Cost price")
    
    # Taxes
    impuesto_iva: Optional[Decimal] = Field(0, ge=0, le=100)
    codigo_iva_sri: Optional[str] = Field("0", description="SRI tax code")
    tiene_ice: bool = False
    porcentaje_ice: Optional[Decimal] = Field(None, ge=0, le=100)
    
    # Stock
    control_stock: bool = True
    stock_actual: int = Field(0, ge=0, description="Current stock")
    stock_minimo: int = Field(0, ge=0, description="Minimum stock alert")
    stock_maximo: Optional[int] = Field(None, ge=0)
    ubicacion: Optional[str] = Field(None, max_length=100)
    
    # Flags
    es_servicio: bool = False
    is_active: bool = True
    
    # Media
    imagen_url: Optional[str] = None
    imagenes: Optional[List[str]] = []
    
    # Metadata
    atributos: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []
    
    @field_validator('precio_venta')
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('Sales price must be greater than 0')
        return v
    
    @field_validator('stock_minimo', 'stock_actual')
    @classmethod
    def validate_stock(cls, v: Optional[int], info) -> Optional[int]:
        if v is not None and v < 0:
            field_name = info.field_name
            raise ValueError(f'{field_name} cannot be negative')
        return v


class ProductUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    sku: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    
    precio_venta: Optional[Decimal] = Field(None, gt=0)
    precio_mayorista: Optional[Decimal] = Field(None, gt=0)
    costo: Optional[Decimal] = Field(None, ge=0)
    
    impuesto_iva: Optional[Decimal] = Field(None, ge=0, le=15)
    codigo_iva_sri: Optional[str] = Field(None, max_length=2)
    tiene_ice: Optional[bool] = None
    porcentaje_ice: Optional[Decimal] = Field(None, ge=0)
    
    control_stock: Optional[bool] = None
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    stock_maximo: Optional[int] = Field(None, ge=0)
    ubicacion: Optional[str] = Field(None, max_length=100)
    
    es_servicio: Optional[bool] = None
    imagen_url: Optional[str] = None
    imagenes: Optional[List[str]] = None
    atributos: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    business_id: UUID
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    
    # Prices
    precio_venta: Decimal
    precio_mayorista: Optional[Decimal] = None
    costo: Optional[Decimal] = None
    utilidad_porcentaje: Decimal = 0
    
    # Taxes
    impuesto_iva: Decimal = 15
    codigo_iva_sri: str = "2"
    tiene_ice: bool = False
    porcentaje_ice: Optional[Decimal] = None
    
    # Stock
    control_stock: bool = True
    stock_actual: int = 0
    stock_reservado: int = 0
    stock_disponible: int = 0
    stock_minimo: int = 0
    stock_maximo: Optional[int] = None
    ubicacion: Optional[str] = None
    
    # Flags
    es_servicio: bool = False
    is_active: bool = True
    
    # Media
    imagen_url: Optional[str] = None
    imagenes: List[str] = []
    
    # Metadata
    atributos: Dict[str, Any] = {}
    tags: List[str] = []
    
    # Audit
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProductListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    sku: Optional[str]
    name: str
    precio_venta: Decimal
    stock_actual: int
    stock_disponible: int
    category_name: Optional[str] = None
    is_active: bool
    es_servicio: bool


class StockAdjustment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    cantidad: int = Field(..., description="Positive for increase, negative for decrease")
    motivo: str = Field(..., max_length=255)
    notas: Optional[str] = None