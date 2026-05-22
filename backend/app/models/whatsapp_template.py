# app/models/whatsapp_template.py
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
import uuid
from datetime import datetime

from app.db.base_class import Base  # o tu Base global

class WhatsAppTemplate(Base):
    __tablename__ = "whatsapp_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="UTILITY")
    language = Column(String, default="es")
    components = Column(JSON, default=[])
    status = Column(String, default="PENDING")
    wa_template_id = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "name": self.name,
            "category": self.category,
            "language": self.language,
            "components": self.components,
            "status": self.status,
            "wa_template_id": self.wa_template_id,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }