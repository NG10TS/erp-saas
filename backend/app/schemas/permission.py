# app/schemas/permission.py
from pydantic import BaseModel, Field
from typing import Dict, Optional
from uuid import UUID


class PermissionSchema(BaseModel):
    permission_key: str
    is_allowed: bool
    expires_at: Optional[str] = None


class AssignPermissionsRequest(BaseModel):
    permissions: Dict[str, bool]   # ej: {"products.create": True, "sales.delete": False}


class RoleChangeRequest(BaseModel):
    role: str = Field(..., description="owner, admin, manager, seller, viewer")