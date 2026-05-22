"""
Business (tenant) model
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base_class import BaseModel


class Business(BaseModel):
    __tablename__ = "businesses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    ruc = Column(String(13), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=False)
    commercial_name = Column(String(255))
    email = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    logo_url = Column(String(500))
    
    # SRI Configuration
    sri_environment = Column(String(1), default="1")  # 1: Pruebas, 2: Producción
    sri_emisor_type = Column(String(2), nullable=False, default="01")  # 01: Persona Natural
    sri_resolution_number = Column(String(50))
    sri_has_digital_certificate = Column(Boolean, default=False)
    
    # Encrypted fields
    digital_certificate = Column(Text)  # Encrypted .p12
    digital_certificate_password_encrypted = Column(Text)  # Encrypted password
    digital_certificate_expires_at = Column(DateTime, nullable=True)
    
    # WhatsApp Configuration
    whatsapp_business_phone = Column(String(20))
    whatsapp_business_id = Column(String(100))
    whatsapp_access_token_encrypted = Column(Text)
    whatsapp_webhook_verified = Column(Boolean, default=False)
    
    # Subscription
    subscription_plan = Column(String(50), default="free")  # free, basic, pro, enterprise
    subscription_status = Column(String(20), default="active")  # active, past_due, canceled
    subscription_start_date = Column(DateTime, default=datetime.utcnow)
    subscription_end_date = Column(DateTime, nullable=True)
    subscription_payment_method = Column(String(50))
    
     # Invoice sequences
    invoice_sequences = relationship("InvoiceSequence", back_populates="business", cascade="all, delete-orphan")

    # Limits based on plan
    max_users = Column(Integer, default=1)
    max_products = Column(Integer, default=50)
    max_invoices_monthly = Column(Integer, default=50)
    max_storage_mb = Column(Integer, default=100)
    
    # Usage counters
    current_users = Column(Integer, default=0)
    current_products = Column(Integer, default=0)
    current_invoices_month = Column(Integer, default=0)
    current_storage_mb = Column(Integer, default=0)
    
    # Settings
    settings = Column(JSON, default={
        "language": "es",
        "timezone": "America/Guayaquil",
        "currency": "USD",
        "tax_included": True,
        "whatsapp_auto_reply": True,
        "notify_low_stock": True,
        "low_stock_threshold": 5
    })
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspended_reason = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Onboarding
    onboarding_completed = Column(Boolean, default=False)
    onboarding_step = Column(Integer, default=0)
    

    # Relationships
    users = relationship("User", back_populates="business", cascade="all, delete-orphan", foreign_keys="User.business_id")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_business")  # ← NUEVA
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="business", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="business", cascade="all, delete-orphan")
    whatsapp_messages = relationship("WhatsAppMessage", back_populates="business", cascade="all, delete-orphan")
    audit_logs = relationship("BusinessAuditLog", back_populates="business", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="business", cascade="all, delete-orphan")
    inventory_movements = relationship("InventoryMovement", back_populates="business", cascade="all, delete-orphan")
    price_lists = relationship("PriceList", back_populates="business", cascade="all, delete-orphan")
    credit_notes = relationship("CreditNote", back_populates="business", cascade="all, delete-orphan")
    # Categories
    categories = relationship("Category", back_populates="business", cascade="all, delete-orphan")

    # Inventory movements
    inventory_movements = relationship("InventoryMovement", back_populates="business", cascade="all, delete-orphan")

    # Price lists
    price_lists = relationship("PriceList", back_populates="business", cascade="all, delete-orphan")


    def __repr__(self):
        return f"<Business {self.ruc} - {self.business_name}>"
    
    def increment_usage(self, resource: str):
        """Increment usage counter"""
        if resource == "users":
            self.current_users += 1
        elif resource == "products":
            self.current_products += 1
        elif resource == "invoices":
            self.current_invoices_month += 1
    
    def can_add_resource(self, resource: str) -> bool:
        """Check if can add more of a resource based on plan limits"""
        if resource == "users":
            return self.current_users < self.max_users
        elif resource == "products":
            return self.current_products < self.max_products
        elif resource == "invoices":
            return self.current_invoices_month < self.max_invoices_monthly
        return True