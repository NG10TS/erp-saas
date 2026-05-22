# app/services/permission_service.py
"""
Lógica central de verificación de permisos: combina rol por defecto + permisos personalizados + expiración
"""
import logging
from typing import List, Dict, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.user import User
from app.models.role_permission import RolePermission
from app.models.user_permission import UserPermission
from app.constants.roles import UserRole

logger = logging.getLogger(__name__)


class PermissionService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_permissions(self, user: User) -> Dict[str, bool]:
        """
        Retorna un diccionario con todos los permisos efectivos del usuario.
        Primero carga los permisos base de su rol, luego aplica sobrescrituras personalizadas.
        """
        # 1. Obtener permisos por defecto del rol
        role_perms = self.db.query(RolePermission).filter(
            RolePermission.role == user.role
        ).all()
        permissions = {rp.permission_key: rp.is_allowed for rp in role_perms}

        # 2. Obtener permisos personalizados (no expirados)
        custom_perms = self.db.query(UserPermission).filter(
            UserPermission.user_id == user.id,
            (UserPermission.expires_at.is_(None) | (UserPermission.expires_at > datetime.now(timezone.utc)))
        ).all()

        # 3. Sobrescribir
        for cp in custom_perms:
            permissions[cp.permission_key] = cp.is_allowed

        return permissions

    def has_permission(self, user: User, permission_key: str) -> bool:
        """Verifica si un usuario tiene un permiso específico."""
        perms = self.get_user_permissions(user)
        return perms.get(permission_key, False)

    def assign_custom_permission(
        self,
        user_id: UUID,
        permission_key: str,
        is_allowed: bool,
        granted_by_id: UUID,
        expires_at: Optional[datetime] = None,
    ) -> UserPermission:
        """Asigna o actualiza un permiso personalizado para un usuario."""
        existing = self.db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_key == permission_key
        ).first()

        if existing:
            existing.is_allowed = is_allowed
            existing.granted_by = granted_by_id
            existing.granted_at = datetime.now(timezone.utc)
            existing.expires_at = expires_at
            perm = existing
        else:
            perm = UserPermission(
                user_id=user_id,
                permission_key=permission_key,
                is_allowed=is_allowed,
                granted_by=granted_by_id,
                expires_at=expires_at,
            )
            self.db.add(perm)

        self.db.commit()
        self.db.refresh(perm)
        return perm

    def revoke_custom_permission(self, user_id: UUID, permission_key: str) -> bool:
        """Elimina un permiso personalizado (vuelve al valor por defecto del rol)."""
        perm = self.db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_key == permission_key
        ).first()
        if perm:
            self.db.delete(perm)
            self.db.commit()
            return True
        return False

    def get_all_available_permissions(self) -> Dict[str, List[str]]:
        """Retorna el esquema completo de permisos (para mostrar en frontend)."""
        return {
            "products": ["create", "read", "update", "delete"],
            "sales": ["create", "read", "update", "delete", "view_others"],
            "customers": ["create", "read", "update", "delete"],
            "inventory": ["read", "adjust", "audit"],
            "reports": ["sales", "inventory", "financial", "export"],
            "users": ["create", "read", "update", "delete", "change_role"],
            "invoices": ["create", "read", "void", "download"],
            "dashboard": ["view", "export"],
            "settings": ["read", "update"],
        }