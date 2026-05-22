"""
Invoice and InvoiceDetail models
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base_class import BaseModel


class Invoice(BaseModel):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=True)  # FK AÑADIDA

    # Invoice numbers
    invoice_number = Column(String(50), unique=True, nullable=False)  # Clave de acceso 49 dígitos
    sequential = Column(String(50), nullable=False)                   # 001-001-000000001

    # Dates
    issue_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    authorization_date = Column(DateTime, nullable=True)

    # Totals
    subtotal = Column(Numeric(10, 2), nullable=False)
    subtotal_iva = Column(Numeric(10, 2), default=0)
    subtotal_ice = Column(Numeric(10, 2), default=0)
    discount = Column(Numeric(10, 2), default=0)
    iva = Column(Numeric(10, 2), default=0)
    ice = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)

    # SRI
    sri_status = Column(String(50), default="PENDING")  # PENDING, SENT, AUTHORIZED, REJECTED
    sri_response = Column(JSON, default={})
    sri_error = Column(Text)
    sri_attempts = Column(Integer, default=0)

    # XML / PDF
    xml_signed = Column(Text)
    xml_authorized = Column(Text)
    pdf_url = Column(String(500))

    # Payment
    payment_method = Column(String(50), default="01")
    payment_due_date = Column(DateTime, nullable=True)

    # Notes / metadata
    notes = Column(Text)
    extra_data = Column(JSON, default={})

    # Relationships
    business = relationship("Business", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    sale = relationship("Sale", foreign_keys=[sale_id])
    details = relationship("InvoiceDetail", back_populates="invoice", cascade="all, delete-orphan")
    credit_notes = relationship("CreditNote", back_populates="invoice", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Invoice {self.invoice_number} - {self.sri_status}>"

    @property
    def is_authorized(self) -> bool:
        return self.sri_status == "AUTHORIZED"


class InvoiceDetail(BaseModel):
    __tablename__ = "invoice_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(50))

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0)
    total_price = Column(Numeric(10, 2), nullable=False)

    iva_percentage = Column(Numeric(5, 2), default=15.00)
    iva_code = Column(String(2), default="4")   # "4" = 15% desde mayo 2024
    iva_amount = Column(Numeric(10, 2), default=0)

    ice_percentage = Column(Numeric(5, 2), default=0)
    ice_code = Column(String(2))
    ice_amount = Column(Numeric(10, 2), default=0)

    invoice = relationship("Invoice", back_populates="details")
    product = relationship("Product")