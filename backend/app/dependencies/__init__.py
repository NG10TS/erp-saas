"""
Dependencies initialization
"""
from app.dependencies.auth import (
    get_current_user,
    get_current_business,
    get_optional_user,
    require_permissions,
    require_role,
    require_admin,
    require_manager,
    require_seller
)
from app.dependencies.database import get_db, get_read_only_db
from app.dependencies.business import (
    get_product,
    get_customer,
    get_sale,
    get_invoice
)

__all__ = [
    "get_current_user",
    "get_current_business",
    "get_optional_user",
    "require_permissions",
    "require_role",
    "require_admin",
    "require_manager",
    "require_seller",
    "get_db",
    "get_read_only_db",
    "get_product",
    "get_customer",
    "get_sale",
    "get_invoice",
]