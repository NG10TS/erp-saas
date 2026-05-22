"""
User model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.constants.roles import UserRole
from app.db.base_class import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    # 🔹 Identificadores
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=True)
    
    # 🔹 Datos de usuario
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # 🔹 Roles y estado
    role = Column(Enum(UserRole), default=UserRole.SELLER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # 🔹 API Key
    api_key_hash = Column(String(255), unique=True, nullable=True)
    api_key_last_used = Column(DateTime, nullable=True)
    
    # 🔹 Password reset
    reset_password_token = Column(String(255), nullable=True)
    reset_password_expires = Column(DateTime, nullable=True)
    
    # 🔹 Email verification
    verification_token = Column(String(255), nullable=True)
    verification_code = Column(String(10), nullable=True)
    verification_expires = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # 🔹 Último login
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    
    # 🔹 Datos extra
    extra_data = Column(JSON, default=dict)
    
    # 🔹 Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # 🔹 Relaciones (SOLO UN BLOQUE)
    business = relationship("Business", back_populates="users", foreign_keys=[business_id])
    owned_business = relationship("Business", back_populates="owner", foreign_keys="Business.owner_id", uselist=False)
    created_sales = relationship("Sale", foreign_keys="Sale.created_by", back_populates="creator")
    
    # Relaciones para permisos y auditoría
    granted_permissions = relationship(
        "UserPermission",
        foreign_keys="UserPermission.granted_by",
        back_populates="grantor"
    )
    user_permissions = relationship(
        "UserPermission",
        foreign_keys="UserPermission.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    audit_logs = relationship("BusinessAuditLog", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
    
    def update_last_login(self, ip_address: str = None):
        self.last_login_at = datetime.utcnow()
        self.last_login_ip = ip_address

    def soft_delete(self, deleted_by_user_id: UUID) -> None:
        """Soft delete user"""
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by = deleted_by_user_id