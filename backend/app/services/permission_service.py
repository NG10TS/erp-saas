# backend/app/services/permission_service.py
from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.user_permission import UserPermission
from app.models.role_permission import RolePermission
import logging

logger = logging.getLogger(__name__)


class PermissionService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_available_permissions(self) -> Dict[str, List[str]]:
        """Retorna el esquema completo de permisos disponibles."""
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
            "whatsapp": ["send", "read", "configure_templates"],
            "audit": ["view", "export"],
        }
    
    def has_permission(self, user, permission_key: str) -> bool:
        """Verifica si un usuario tiene un permiso específico."""
        if user.role in ["super_admin", "owner", "admin"]:
            return True
        
        permission = self.db.query(UserPermission).filter(
            UserPermission.user_id == user.id,
            UserPermission.permission_key == permission_key,
            UserPermission.is_allowed == True,
            (UserPermission.expires_at.is_(None) | (UserPermission.expires_at > datetime.now(timezone.utc)))
        ).first()
        
        return permission is not None
    
    def get_user_permissions(self, user_id: UUID) -> Dict[str, bool]:
        """Obtiene todos los permisos personalizados de un usuario."""
        permissions = self.db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            (UserPermission.expires_at.is_(None) | (UserPermission.expires_at > datetime.now(timezone.utc)))
        ).all()
        
        return {p.permission_key: p.is_allowed for p in permissions}
    
    def assign_default_permissions(self, user_id: UUID, role: str) -> int:
        """
        Asigna permisos por defecto según el rol del usuario.
        Retorna el número de permisos asignados.
        """
        ROLE_PERMISSIONS = {
            'seller': [
                'products.read',
                'sales.create', 'sales.read',
                'customers.create', 'customers.read',
                'dashboard.view',
                'whatsapp.send', 'whatsapp.read',
            ],
            'manager': [
                'products.create', 'products.read', 'products.update',
                'sales.create', 'sales.read', 'sales.update', 'sales.view_others',
                'customers.create', 'customers.read', 'customers.update',
                'inventory.read', 'inventory.adjust',
                'reports.sales', 'reports.inventory', 'reports.export',
                'dashboard.view', 'dashboard.export',
                'whatsapp.send', 'whatsapp.read', 'whatsapp.configure_templates',
            ],
            'admin': [
                'products.create', 'products.read', 'products.update', 'products.delete',
                'sales.create', 'sales.read', 'sales.update', 'sales.delete', 'sales.view_others',
                'customers.create', 'customers.read', 'customers.update', 'customers.delete',
                'inventory.read', 'inventory.adjust', 'inventory.audit',
                'reports.sales', 'reports.inventory', 'reports.financial', 'reports.export',
                'users.create', 'users.read', 'users.update',
                'invoices.create', 'invoices.read', 'invoices.download',
                'dashboard.view', 'dashboard.export',
                'settings.read', 'settings.update',
                'whatsapp.send', 'whatsapp.read', 'whatsapp.configure_templates',
            ],
            'accountant': [
                'invoices.create', 'invoices.read', 'invoices.download',
                'reports.financial', 'reports.export',
                'customers.read',
                'dashboard.view',
                'settings.read',
            ],
            'viewer': [
                'products.read',
                'sales.read',
                'customers.read',
                'dashboard.view',
                'invoices.read',
            ],
        }
        
        permissions = ROLE_PERMISSIONS.get(role, [])
        count = 0
        
        for perm_key in permissions:
            self.assign_custom_permission(
                user_id=user_id,
                permission_key=perm_key,
                is_allowed=True,
                granted_by_id=None,
            )
            count += 1
        
        logger.info(f"Assigned {count} default permissions to user {user_id} (role: {role})")
        return count
    
    def assign_custom_permission(
        self, 
        user_id: UUID, 
        permission_key: str, 
        is_allowed: bool, 
        granted_by_id: Optional[UUID] = None,  # ✅ Acepta None
        expires_at: Optional[datetime] = None,
    ):
        """Asigna un permiso personalizado a un usuario."""
        existing = self.db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_key == permission_key
        ).first()
        
        if existing:
            existing.is_allowed = is_allowed
            existing.granted_by = granted_by_id
            existing.expires_at = expires_at
        else:
            new_perm = UserPermission(
                user_id=user_id,
                permission_key=permission_key,
                is_allowed=is_allowed,
                granted_by=granted_by_id,
                expires_at=expires_at,
            )
            self.db.add(new_perm)
        
        self.db.commit()