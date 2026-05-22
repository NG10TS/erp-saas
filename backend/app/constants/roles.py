"""
Constantes para roles y permisos
"""
from enum import Enum

class UserRole(str, Enum):
    """Roles de usuario en el sistema"""
    SUPERADMIN = "SUPERADMIN" # Dueño del sistema (todos los permisos)
    OWNER = "owner"          # Dueño del negocio (todos los permisos)
    ADMIN = "admin"          # Administrador (gestión completa)
    MANAGER = "manager"      # Gerente (ventas, inventario)
    SELLER = "seller"        # Vendedor (solo ventas)
    VIEWER = "viewer"        # Visualizador (solo reportes)
    ACCOUNTANT = "accountant" # Contador (facturas, reportes)

# Permisos por rol
ROLE_PERMISSIONS = {
    UserRole.OWNER: [
        "business:manage",
        "users:manage",
        "products:manage",
        "sales:manage",
        "invoices:manage",
        "reports:view",
        "settings:manage",
        "subscription:manage",
        "whatsapp:configure",
    ],
    UserRole.ADMIN: [
        "products:manage",
        "sales:manage",
        "invoices:manage",
        "reports:view",
        "customers:manage",
        "whatsapp:view",
    ],
    UserRole.MANAGER: [
        "products:view",
        "products:update",
        "sales:manage",
        "invoices:view",
        "reports:view",
        "customers:view",
    ],
    UserRole.SELLER: [
        "products:view",
        "sales:create",
        "sales:view",
        "customers:view",
        "whatsapp:send",
    ],
    UserRole.VIEWER: [
        "reports:view",
        "sales:view",
    ],
    UserRole.ACCOUNTANT: [
        "invoices:view",
        "invoices:export",
        "reports:view",
        "sales:view",
    ],
}

# Acciones disponibles
ACTIONS = {
    "create": "Crear",
    "read": "Ver",
    "update": "Actualizar",
    "delete": "Eliminar",
    "manage": "Gestionar",
    "export": "Exportar",
    "import": "Importar",
    "configure": "Configurar",
}