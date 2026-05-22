# backend/scripts/seed_permissions.py
"""
Script para poblar la tabla role_permissions con la matriz de permisos por defecto
Ejecutar: python -m scripts.seed_permissions
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.role_permission import RolePermission
from app.constants.roles import UserRole


# Matriz de permisos por defecto (Owner, Admin, Manager, Seller, Viewer)
# Formato: (permission_key, [roles_con_acceso])
PERMISSION_MATRIX = [
    # products
    ("products.create", ["owner", "admin"]),
    ("products.read", ["owner", "admin", "manager", "seller", "viewer"]),
    ("products.update", ["owner", "admin"]),
    ("products.delete", ["owner"]),
    # sales
    ("sales.create", ["owner", "admin", "manager", "seller"]),
    ("sales.read", ["owner", "admin", "manager", "seller", "viewer"]),
    ("sales.update", ["owner", "admin"]),
    ("sales.delete", ["owner"]),
    ("sales.view_others", ["owner", "admin", "manager"]),
    # customers
    ("customers.create", ["owner", "admin", "manager", "seller"]),
    ("customers.read", ["owner", "admin", "manager", "seller", "viewer"]),
    ("customers.update", ["owner", "admin", "manager"]),
    ("customers.delete", ["owner"]),
    # inventory
    ("inventory.read", ["owner", "admin", "manager", "seller", "viewer"]),
    ("inventory.adjust", ["owner", "admin"]),
    ("inventory.audit", ["owner", "admin"]),
    # reports
    ("reports.sales", ["owner", "admin", "manager"]),
    ("reports.inventory", ["owner", "admin", "manager"]),
    ("reports.financial", ["owner", "admin"]),
    ("reports.export", ["owner", "admin", "manager"]),
    # users
    ("users.create", ["owner"]),
    ("users.read", ["owner", "admin"]),
    ("users.update", ["owner", "admin"]),
    ("users.delete", ["owner"]),
    ("users.change_role", ["owner"]),
    # invoices
    ("invoices.create", ["owner", "admin"]),
    ("invoices.read", ["owner", "admin", "manager"]),
    ("invoices.void", ["owner"]),
    ("invoices.download", ["owner", "admin", "manager"]),
    # dashboard
    ("dashboard.view", ["owner", "admin", "manager", "seller", "viewer"]),
    ("dashboard.export", ["owner", "admin"]),
    # settings
    ("settings.read", ["owner", "admin"]),
    ("settings.update", ["owner"]),
]

# Lista de todos los roles (excluyendo SUPERADMIN que tiene acceso total)
ALL_ROLES = ["owner", "admin", "manager", "seller", "viewer"]


def seed_role_permissions():
    db = SessionLocal()
    try:
        # Limpiar existentes
        db.query(RolePermission).delete()
        
        for permission_key, allowed_roles in PERMISSION_MATRIX:
            for role in ALL_ROLES:
                is_allowed = role in allowed_roles
                rp = RolePermission(
                    role=role,
                    permission_key=permission_key,
                    is_allowed=is_allowed
                )
                db.add(rp)
        
        db.commit()
        print(f"✅ {len(PERMISSION_MATRIX) * len(ALL_ROLES)} permisos insertados correctamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_role_permissions()