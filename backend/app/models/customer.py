"""
Customer model
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base_class import BaseModel


class Customer(BaseModel):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    
    # Contact info
    phone_number = Column(String(20), nullable=False, index=True)
    name = Column(String(255))
    identification = Column(String(20), index=True)  # Cédula or RUC
    email = Column(String(255))
    address = Column(Text)
    
    # Additional info
    birth_date = Column(DateTime, nullable=True)
    gender = Column(String(10))
    occupation = Column(String(100))
    
    # Social media
    whatsapp_opted_in = Column(Boolean, default=True)
    facebook_id = Column(String(100))
    instagram_username = Column(String(100))
    
    # Statistics
    total_purchases = Column(Integer, default=0)
    total_spent = Column(Numeric(10, 2), default=0)
    average_purchase = Column(Numeric(10, 2), default=0)
    last_purchase_date = Column(DateTime, nullable=True)
    
    # Preferences
    preferences = Column(JSON, default={
        "notifications": True,
        "marketing": False,
        "language": "es"
    })
    
    # Metadata
    notes = Column(Text)
    extra_data = Column(JSON, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business", back_populates="customers")
    carts = relationship("Cart", back_populates="customer", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    whatsapp_messages = relationship("WhatsAppMessage", back_populates="customer")
    
    def __repr__(self):
        return f"<Customer {self.phone_number} - {self.name}>"
    
    @property
    def identification_type(self) -> str:
        """Get identification type based on length"""
        if not self.identification:
            return "07"  # Consumidor Final
        elif len(self.identification) == 10:
            return "05"  # Cédula
        elif len(self.identification) == 13:
            return "04"  # RUC
        else:
            return "06"  # Pasaporte
    
    def update_stats(self, sale_amount: float):
        """Update customer statistics after a purchase"""
        self.total_purchases += 1
        self.total_spent = float(self.total_spent or 0) + sale_amount
        self.average_purchase = self.total_spent / self.total_purchases
        self.last_purchase_date = datetime.utcnow()