"""
User schemas - Profesional con generación automática
"""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime
import re


class UserBase(BaseModel):
    """Base schema con validaciones comunes"""
    email: EmailStr = Field(..., description="Email del usuario")
    first_name: str = Field(..., min_length=2, max_length=100, description="Nombre")
    last_name: str = Field(..., min_length=2, max_length=100, description="Apellido")
    phone: Optional[str] = Field(None, max_length=20, description="Teléfono")
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[0-9]{10,15}$', v):
            raise ValueError('Formato de teléfono inválido')
        return v


class UserCreate(UserBase):
    """Schema para creación de usuarios (empleados) - PROFESIONAL"""
    username: Optional[str] = Field(
        None, 
        min_length=3, 
        max_length=100,
        description="Nombre de usuario (opcional - se genera automáticamente)"
    )
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=72,
        description="Contraseña (opcional - se genera automáticamente)"
    )
    role: str = Field(
        default="seller",
        pattern="^(admin|manager|seller|viewer|accountant)$",
        description="Rol del usuario"
    )
    send_welcome_email: bool = Field(
        default=True,
        description="Enviar email de bienvenida con credenciales"
    )
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """Validar username (si se proporciona)"""
        if v and not re.match(r'^[a-zA-Z0-9_.-]+$', v):
            raise ValueError('Usuario solo puede contener letras, números, guiones y puntos')
        return v


class UserResponse(UserBase):
    """Schema para respuestas de API"""
    id: UUID
    username: str
    role: str
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    permissions: Optional[Dict[str, bool]] = Field(
        default_factory=dict,
        description="Permisos personalizados del usuario"
    )
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema para actualización parcial"""
    first_name: Optional[str] = Field(None, min_length=2)
    last_name: Optional[str] = Field(None, min_length=2)
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    
    class Config:
        extra = "forbid"


class UserInDB(UserResponse):
    """Schema para usuario en DB (con campos internos)"""
    password_hash: str
    business_id: UUID