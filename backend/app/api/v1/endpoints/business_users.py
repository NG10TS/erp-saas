"""
Endpoints exclusivos para el dueño del negocio (OWNER)
Permite gestionar empleados, roles y permisos personalizados
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies.auth import get_current_business, get_current_user
from app.models.business import Business
from app.models.user import User
from app.models.business_audit_log import BusinessAuditLog
from app.services.user_service import UserService
from app.services.permission_service import PermissionService
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.permission import AssignPermissionsRequest, RoleChangeRequest
from app.constants.roles import UserRole
from app.core.config import settings
import logging

router = APIRouter(prefix="/business", tags=["Business Users"])
logger = logging.getLogger(__name__)


# Helper para verificar permisos
def check_permission(current_user: User, db: Session, permission_key: str):
    perm_service = PermissionService(db)
    if not perm_service.has_permission(current_user, permission_key):
        raise HTTPException(403, f"No tienes permiso para '{permission_key}'")


# ============================================
# ENDPOINT CRÍTICO PARA EL FRONTEND
# ============================================
@router.get("/permissions/schema")
def get_permissions_schema(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna el esquema completo de permisos disponibles."""
    perm_service = PermissionService(db)
    return perm_service.get_all_available_permissions()


# ---------- Listar empleados del negocio ----------
@router.get("/users", response_model=List[UserResponse])
def list_business_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.read")
    user_service = UserService(db)
    return user_service.get_users_by_business(
        business_id=current_business.id,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
    )


# ---------- Detalle de un empleado ----------
@router.get("/users/{user_id}", response_model=UserResponse)
def get_business_user_detail(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.read")
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id, current_business.id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    # Obtener permisos personalizados del usuario
    perm_service = PermissionService(db)
    user_permissions = perm_service.get_user_permissions(user_id)
    
    # Convertir a diccionario y agregar al response
    user_dict = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "permissions": user_permissions,
    }
    
    return user_dict


# ---------- Obtener permisos de un empleado ----------
@router.get("/users/{user_id}/permissions")
def get_user_permissions(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Obtener permisos personalizados de un usuario"""
    check_permission(current_user, db, "users.read")
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id, current_business.id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    perm_service = PermissionService(db)
    permissions = perm_service.get_user_permissions(user_id)
    
    # ✅ Si no hay permisos, asignar los por defecto según su rol
    if not permissions:
        assigned = perm_service.assign_default_permissions(user_id, user.role)
        permissions = perm_service.get_user_permissions(user_id)
        logger.info(f"Auto-assigned {assigned} permissions to {user.email}")
    
    return permissions


# ---------- Crear nuevo empleado ----------
@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_employee(
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Crear un nuevo empleado - genera username y password automáticamente"""
    check_permission(current_user, db, "users.create")
    
    user_service = UserService(db)
    
    # Verificar límite de usuarios
    max_users = current_business.max_users
    current_count = user_service.count_users_by_business(current_business.id)
    if max_users and current_count >= max_users:
        raise HTTPException(403, f"Límite de usuarios alcanzado ({max_users})")
    
    try:
        new_user, generated_password = user_service.create_user(
            user_in=user_in,
            business_id=current_business.id,
            created_by=current_user.id,
        )
        
        # ✅ Asignar permisos por defecto según el rol
        try:
            perm_service = PermissionService(db)
            assigned = perm_service.assign_default_permissions(new_user.id, user_in.role)
            logger.info(f"✅ {assigned} default permissions assigned to {new_user.email} (role: {user_in.role})")
        except Exception as e:
            logger.error(f"❌ Failed to assign default permissions: {e}")
        
        # 1. PRIMERO registrar auditoría
        audit = BusinessAuditLog(
            business_id=current_business.id,
            user_id=current_user.id,
            action="CREATE_USER",
            entity_type="user",
            entity_id=new_user.id,
            new_values={"email": new_user.email, "role": new_user.role},
        )
        db.add(audit)
        db.commit()
        
        # 2. DESPUÉS enviar email de bienvenida
        if user_in.send_welcome_email:
            try:
                from app.services.email_service import EmailService
                EmailService.send_employee_credentials_email(
                    to_email=new_user.email,
                    name=new_user.first_name,
                    username=new_user.username,
                    password=generated_password,
                    login_url=f"{settings.FRONTEND_URL}/login"
                )
                logger.info(f"📧 Welcome email sent to {new_user.email}")
            except Exception as e:
                logger.error(f"❌ Failed to send welcome email: {e}")
        
        # 3. Devolver la contraseña generada al frontend
        return {
            "id": str(new_user.id),
            "email": new_user.email,
            "username": new_user.username,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "password": generated_password,
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


# ---------- Cambiar rol de empleado ----------
@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_employee_role(
    user_id: UUID,
    req: RoleChangeRequest,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.change_role")
    
    if user_id == current_user.id:
        raise HTTPException(400, "No puedes cambiar tu propio rol")

    user_service = UserService(db)
    target_user = user_service.get_user_by_id(user_id, current_business.id)
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    if current_user.role != UserRole.OWNER:
        raise HTTPException(403, "Solo el dueño puede cambiar roles")

    old_role = target_user.role
    try:
        updated = user_service.update_user_role(user_id, current_business.id, req.role)
        audit = BusinessAuditLog(
            business_id=current_business.id,
            user_id=current_user.id,
            action="CHANGE_ROLE",
            entity_type="user",
            entity_id=user_id,
            old_values={"role": old_role},
            new_values={"role": req.role},
        )
        db.add(audit)
        db.commit()
        return updated
    except ValueError as e:
        raise HTTPException(400, str(e))


# ---------- Habilitar/Inhabilitar empleado ----------
@router.patch("/users/{user_id}/status")
def toggle_employee_status(
    user_id: UUID,
    is_active: bool = Query(...),
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.update")
    
    if user_id == current_user.id:
        raise HTTPException(400, "No puedes modificar tu propio estado")

    user_service = UserService(db)
    target_user = user_service.get_user_by_id(user_id, current_business.id)
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    target_user.is_active = is_active
    db.commit()

    audit = BusinessAuditLog(
        business_id=current_business.id,
        user_id=current_user.id,
        action="TOGGLE_USER_STATUS",
        entity_type="user",
        entity_id=user_id,
        new_values={"is_active": is_active},
    )
    db.add(audit)
    db.commit()

    return {"message": f"Usuario {'habilitado' if is_active else 'inhabilitado'}"}


# ---------- Asignar permisos personalizados ----------
@router.put("/users/{user_id}/permissions")
def assign_custom_permissions(
    user_id: UUID,
    req: AssignPermissionsRequest,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.update")
    
    user_service = UserService(db)
    target_user = user_service.get_user_by_id(user_id, current_business.id)
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    perm_service = PermissionService(db)
    for perm_key, allowed in req.permissions.items():
        perm_service.assign_custom_permission(
            user_id=user_id,
            permission_key=perm_key,
            is_allowed=allowed,
            granted_by_id=current_user.id,
        )

    audit = BusinessAuditLog(
        business_id=current_business.id,
        user_id=current_user.id,
        action="ASSIGN_CUSTOM_PERMISSIONS",
        entity_type="user",
        entity_id=user_id,
        new_values={"permissions": req.permissions},
    )
    db.add(audit)
    db.commit()

    return {"message": "Permisos actualizados"}


# ---------- Eliminar empleado ----------
@router.delete("/users/{user_id}")
def delete_employee(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.delete")
    
    if user_id == current_user.id:
        raise HTTPException(400, "No puedes eliminarte")

    user_service = UserService(db)
    target_user = user_service.get_user_by_id(user_id, current_business.id)
    if not target_user:
        raise HTTPException(404, "Usuario no encontrado")

    success = user_service.delete_user(user_id, current_business.id, current_user.id)
    if not success:
        raise HTTPException(500, "Error al eliminar usuario")

    audit = BusinessAuditLog(
        business_id=current_business.id,
        user_id=current_user.id,
        action="DELETE_USER",
        entity_type="user",
        entity_id=user_id,
    )
    db.add(audit)
    db.commit()
    return {"message": "Usuario eliminado"}


# ---------- Logs de auditoría ----------
@router.get("/audit-logs")
def get_business_audit_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    check_permission(current_user, db, "users.read")
    logs = db.query(BusinessAuditLog).filter(
        BusinessAuditLog.business_id == current_business.id
    ).order_by(BusinessAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs