# backend/app/schemas/whatsapp.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum


# ===============================
# Enums
# ===============================

class MessageDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    DOCUMENT = "document"
    AUDIO = "audio"
    VIDEO = "video"
    LOCATION = "location"
    CONTACTS = "contacts"
    INTERACTIVE = "interactive"
    BUTTON = "button"
    TEMPLATE = "template"


class MessageStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


# ===============================
# WhatsApp Message Schemas
# ===============================

class WhatsAppMessageBase(BaseModel):
    """Base schema for WhatsApp messages"""
    direction: MessageDirection
    message_type: MessageType = MessageType.TEXT
    text: Optional[str] = None
    media_url: Optional[str] = None
    caption: Optional[str] = None
    status: MessageStatus = MessageStatus.PENDING


class WhatsAppMessageCreate(WhatsAppMessageBase):
    """Schema for creating a message record (inbound)"""
    business_id: UUID
    customer_id: UUID
    whatsapp_message_id: str
    whatsapp_timestamp: Optional[datetime] = None


class WhatsAppMessageResponse(WhatsAppMessageBase):
    """Schema for returning WhatsApp messages (matches model fields)"""
    id: UUID
    business_id: UUID
    customer_id: UUID
    whatsapp_message_id: Optional[str]
    whatsapp_conversation_id: Optional[str]
    direction: MessageDirection
    message_type: MessageType
    text: Optional[str]
    media_url: Optional[str]
    caption: Optional[str]
    status: MessageStatus
    error: Optional[str]
    whatsapp_timestamp: Optional[datetime]
    received_at: datetime
    processed: bool
    processed_at: Optional[datetime]
    sale_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    """Request to send a WhatsApp text message"""
    to: str = Field(..., description="Recipient phone number (e.g., 59399XXXXXXX)")
    text: str = Field(..., max_length=4096, description="Message text")


class SendTemplateRequest(BaseModel):
    """Request to send a WhatsApp template message"""
    to: str = Field(..., description="Recipient phone number")
    template_name: str = Field(..., description="Template name registered in WhatsApp")
    language: str = Field("es", description="Language code (es, en, etc.)")
    components: Optional[List[Dict[str, Any]]] = Field(
        None, description="Template components for variables and buttons"
    )


# ===============================
# WhatsApp Template Schemas
# ===============================

class WhatsAppTemplateBase(BaseModel):
    """Base schema for WhatsApp templates"""
    name: str
    category: str = "UTILITY"
    language: str = "es"
    components: List[Dict[str, Any]] = []
    is_default: bool = False


class WhatsAppTemplateCreate(WhatsAppTemplateBase):
    """Schema for creating a template"""
    pass


class WhatsAppTemplateResponse(WhatsAppTemplateBase):
    """Schema for returning templates"""
    id: UUID
    business_id: UUID
    status: str  # PENDING, APPROVED, REJECTED
    wa_template_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===============================
# Conversation & Stats Schemas
# ===============================

class ConversationSummary(BaseModel):
    """Summary of a WhatsApp conversation with a customer"""
    customer_id: UUID
    customer_name: Optional[str]
    customer_phone: str
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int = 0


class WhatsAppStatsResponse(BaseModel):
    """Statistics for WhatsApp usage"""
    total_messages: int
    recent_messages: int
    total_conversations: int
    whatsapp_configured: bool
    last_activity: Optional[datetime]