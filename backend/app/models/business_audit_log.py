# app/models/business_audit_log.py
"""
Auditoría detallada de acciones importantes dentro de un negocio
"""
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import BaseModel


class BusinessAuditLog(BaseModel):
    __tablename__ = "business_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # CREATE_USER, CHANGE_ROLE, DELETE_PRODUCT, etc.
    entity_type = Column(String(50), nullable=True, index=True)  # user, product, sale, customer
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relaciones
    business = relationship("Business", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('ix_business_audit_logs_entity', 'entity_type', 'entity_id'),
    )
