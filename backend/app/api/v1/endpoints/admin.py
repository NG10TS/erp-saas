# app/api/v1/endpoints/admin.py
"""
Endpoints exclusivos para SUPER_ADMIN – control global
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.models.business import Business
from app.constants.roles import UserRole
from app.services.super_admin_service import SuperAdminService
from app.schemas.business import BusinessResponse
from app.schemas.user import UserResponse
from app.schemas.subscription import SubscriptionPlanUpdate

router = APIRouter(prefix="/admin", tags=["Super Admin"])


# ---------- Verificación de rol SUPER_ADMIN ----------
def require_super_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Se requiere rol SUPER_ADMIN")
    return current_user


# ---------- Listar todos los negocios ----------
@router.get("/businesses", response_model=List[BusinessResponse])
def list_all_businesses(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    return service.get_all_businesses(skip, limit, search, is_active)


# ---------- Detalle de un negocio ----------
@router.get("/businesses/{business_id}", response_model=BusinessResponse)
def get_business_detail(
    business_id: UUID,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    biz = service.get_business_detail(business_id)
    if not biz:
        raise HTTPException(404, "Negocio no encontrado")
    return biz


# ---------- Usuarios de un negocio ----------
@router.get("/businesses/{business_id}/users", response_model=List[UserResponse])
def get_business_users(
    business_id: UUID,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    return service.get_business_users(business_id)


# ---------- Cambiar dueño de un negocio ----------
@router.patch("/businesses/{business_id}/change-owner")
def change_business_owner(
    business_id: UUID,
    new_owner_id: UUID,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    try:
        success = service.change_business_owner(business_id, new_owner_id)
        if not success:
            raise HTTPException(404, "Negocio no encontrado")
        return {"message": "Dueño cambiado exitosamente"}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ---------- Activar/Desactivar negocio ----------
@router.patch("/businesses/{business_id}/status")
def set_business_status(
    business_id: UUID,
    is_active: bool,
    reason: Optional[str] = None,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    success = service.set_business_status(business_id, is_active, reason)
    if not success:
        raise HTTPException(404, "Negocio no encontrado")
    return {"message": f"Negocio {'activado' if is_active else 'suspendido'}"}


# ---------- Asignar plan de suscripción a un negocio ----------
@router.put("/businesses/{business_id}/subscription")
def assign_subscription(
    business_id: UUID,
    plan: SubscriptionPlanUpdate,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    success = service.assign_subscription_plan(business_id, plan.plan_name, plan.days_valid or 30)
    if not success:
        raise HTTPException(404, "Negocio no encontrado")
    return {"message": f"Plan {plan.plan_name} asignado"}


# ---------- Métricas globales ----------
@router.get("/metrics")
def get_global_metrics(
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    return service.get_global_metrics()


# ---------- Auditoría global ----------
@router.get("/audit-logs")
def get_global_audit_logs(
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    return service.get_global_audit_logs(skip, limit)


# ---------- Listar SUPER_ADMINS ----------
@router.get("/super-admins", response_model=List[UserResponse])
def list_super_admins(
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    return service.list_super_admins()


# ---------- Crear nuevo SUPER_ADMIN ----------
@router.post("/super-admins", status_code=status.HTTP_201_CREATED)
def create_super_admin(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    _: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    service = SuperAdminService(db)
    try:
        new_admin = service.create_super_admin(email, password, first_name, last_name)
        return {"message": "Super Admin creado", "user_id": str(new_admin.id)}
    except ValueError as e:
        raise HTTPException(400, str(e))