"""
WhatsApp Message model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean, Integer, Enum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.db.base_class import BaseModel


class MessageDirection(str, enum.Enum):
    """Message direction"""
    INBOUND = "inbound"  # Customer -> Business
    OUTBOUND = "outbound"  # Business -> Customer


class MessageType(str, enum.Enum):
    """Message type"""
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


class MessageStatus(str, enum.Enum):
    """Message delivery status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class WhatsAppMessage(BaseModel):
    __tablename__ = "whatsapp_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    
    # WhatsApp IDs
    whatsapp_message_id = Column(String(255), unique=True, index=True)
    whatsapp_conversation_id = Column(String(255))
    
    # Message info
    direction = Column(Enum(MessageDirection), nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    
    # Content
    text = Column(Text)
    media_url = Column(String(500))
    caption = Column(Text)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    
    # Status
    status = Column(Enum(MessageStatus), default=MessageStatus.PENDING)
    status_updated_at = Column(DateTime)
    error = Column(Text)
    
    # Timestamps
    whatsapp_timestamp = Column(DateTime)  # WhatsApp's timestamp
    received_at = Column(DateTime, default=datetime.utcnow)
    
    # Processing
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    processing_attempts = Column(Integer, default=0)
    
    # Context
    in_reply_to = Column(String(255))  # ID of message being replied to
    session_id = Column(String(255))  # Session identifier
    
    # Business data
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=True)
    
    # Metadata
    extra_data = Column(JSON, default={})
    
    # Relationships
    business = relationship("Business", back_populates="whatsapp_messages")
    customer = relationship("Customer", back_populates="whatsapp_messages")
    sale = relationship(
        "Sale",
        back_populates="whatsapp_messages"
    )
    
    def __repr__(self):
        return f"<WhatsAppMessage {self.whatsapp_message_id} - {self.direction}>"
    
    def mark_as_processed(self):
        """Mark message as processed"""
        self.processed = True
        self.processed_at = datetime.utcnow()
    
    def update_status(self, new_status: MessageStatus):
        """Update message status"""
        self.status = new_status
        self.status_updated_at = datetime.utcnow()