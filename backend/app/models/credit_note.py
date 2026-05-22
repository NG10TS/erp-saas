"""
Modelo para Notas de Crédito SRI
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class CreditNote(BaseModel):
    """Nota de Crédito Electrónica SRI"""
    
    __tablename__ = "credit_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    
    # Secuencial
    sequential = Column(String(20), nullable=False)
    credit_note_number = Column(String(49))  # Clave de acceso 49 dígitos
    
    # Tipo: 01=Anulación, 02=Devolución, 03=Descuento, 04=Bonificación
    tipo_nota = Column(String(2), nullable=False, default="01")
    motivo = Column(Text, nullable=False)
    
    # Valores
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)
    iva = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Fechas
    issue_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # SRI Status
    sri_status = Column(String(20), default="draft")  # draft, pending, sent, authorized, rejected
    sri_error = Column(Text)
    authorization_date = Column(DateTime)
    authorization_number = Column(String(50))
    
    # XML
    xml_content = Column(Text)
    xml_signed = Column(Text)
    xml_authorized = Column(Text)
    
    # PDF
    pdf_url = Column(String(500))
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    business = relationship("Business", back_populates="credit_notes")
    invoice = relationship("Invoice", back_populates="credit_notes")
    details = relationship("CreditNoteDetail", back_populates="credit_note", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CreditNote {self.sequential} ({self.tipo_nota})>"


class CreditNoteDetail(BaseModel):
    """Detalle de Nota de Crédito"""
    
    __tablename__ = "credit_note_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credit_note_id = Column(UUID(as_uuid=True), ForeignKey("credit_notes.id"), nullable=False)
    
    product_sku = Column(String(50))
    product_name = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0)
    total_price = Column(Numeric(10, 2), nullable=False)
    iva_percentage = Column(Numeric(5, 2), default=15)
    iva_amount = Column(Numeric(10, 2), default=0)
    
    credit_note = relationship("CreditNote", back_populates="details")