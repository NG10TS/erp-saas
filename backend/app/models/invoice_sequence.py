# backend/app/models/invoice_sequence.py
"""
Modelo para secuenciales de facturación SRI
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class InvoiceSequence(Base):
    """Secuenciales de facturación por establecimiento y punto de emisión"""
    
    __tablename__ = "invoice_sequences"
    
    __table_args__ = (
        Index(
            'ix_invoice_sequences_unique',
            'business_id', 'establecimiento', 'punto_emision', 'tipo_comprobante',
            unique=True
        ),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    business_id = Column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False
    )
    
    establecimiento = Column(String(3), nullable=False, default='001')
    punto_emision = Column(String(3), nullable=False, default='001')
    tipo_comprobante = Column(String(2), nullable=False, default='01')
    
    secuencial_actual = Column(Integer, nullable=False, default=0)
    secuencial_inicial = Column(Integer, nullable=False, default=1)
    secuencial_final = Column(Integer, nullable=False, default=999999999)
    
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business", back_populates="invoice_sequences")
    
    def __repr__(self):
        return f"<InvoiceSequence {self.establecimiento}-{self.punto_emision} ({self.tipo_comprobante}): {self.secuencial_actual}>"