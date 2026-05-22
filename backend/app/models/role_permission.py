# app/models/role_permission.py
"""
Permisos por defecto asignados a cada rol (owner, admin, manager, seller, viewer)
"""
import uuid
from sqlalchemy import Column, String, Boolean, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import BaseModel


class RolePermission(BaseModel):
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(50), nullable=False, index=True)  # owner, admin, manager, seller, viewer
    permission_key = Column(String(100), nullable=False, index=True)
    is_allowed = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint('role', 'permission_key', name='uq_role_permission'),
    )
