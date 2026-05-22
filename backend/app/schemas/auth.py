"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re
from app.constants.roles import UserRole

class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """Token payload schema"""
    sub: str  # user_id
    exp: datetime
    type: str
    business_id: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request schema"""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9@.+_-]+$', v):
            raise ValueError('Username must be alphanumeric')
        return v

class RegisterRequest(BaseModel):
    # Business info
    ruc: str = Field(..., min_length=10, max_length=13)
    business_name: str = Field(..., min_length=3)
    commercial_name: Optional[str] = None
    business_email: EmailStr  # ✅ AGREGAR ESTE CAMPO
    business_phone: Optional[str] = None
    address: Optional[str] = None
    
    # User info
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    
    @validator('ruc')
    def validate_ruc(cls, v):
        if not v.isdigit():
            raise ValueError('RUC must contain only numbers')
        if len(v) != 13:
            raise ValueError('RUC must be 13 digits')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers and underscores')
        return v


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"
    business: "BusinessResponse"


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class VerifyEmailRequest(BaseModel):
    """Verify email request"""
    token: str




# Avoid circular imports
from app.schemas.user import UserResponse
from app.schemas.business import BusinessResponse

LoginResponse.update_forward_refs()