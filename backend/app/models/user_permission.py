# app/models/user_permission.py
"""
Modelo para permisos personalizados por usuario (sobrescribe permisos por defecto del rol)
"""
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import BaseModel


class UserPermission(BaseModel):
    __tablename__ = "user_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_key = Column(String(100), nullable=False, index=True)
    is_allowed = Column(Boolean, nullable=False, default=True)
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="user_permissions"
    )
    grantor = relationship(
        "User",
        foreign_keys=[granted_by],
        back_populates="granted_permissions"
    )

    __table_args__ = (
        UniqueConstraint('user_id', 'permission_key', name='uq_user_permission'),
    )