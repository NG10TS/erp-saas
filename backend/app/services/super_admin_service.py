# backend/app/services/super_admin_service.py
"""
Servicio exclusivo para súper administradores – control global de negocios y sus dueños
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.business import Business
from app.models.user import User
from app.constants.roles import UserRole

logger = logging.getLogger(__name__)


class SuperAdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_businesses(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Business]:
        """Lista todos los negocios con filtros opcionales."""
        query = self.db.query(Business)
        if search:
            query = query.filter(
                Business.business_name.ilike(f"%{search}%") |
                Business.email.ilike(f"%{search}%") |
                Business.ruc.ilike(f"%{search}%")
            )
        if is_active is not None:
            query = query.filter(Business.is_active == is_active)
        return query.order_by(Business.created_at.desc()).offset(skip).limit(limit).all()

    def get_business_detail(self, business_id: UUID) -> Optional[Business]:
        """Obtiene detalle de un negocio específico."""
        return self.db.query(Business).filter(Business.id == business_id).first()

    def get_business_users(self, business_id: UUID) -> List[User]:
        """Obtiene todos los usuarios de un negocio."""
        return self.db.query(User).filter(User.business_id == business_id).all()

    def change_business_owner(self, business_id: UUID, new_owner_id: UUID) -> bool:
        """Cambia el dueño de un negocio."""
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if not business:
            return False
        
        new_owner = self.db.query(User).filter(
            User.id == new_owner_id,
            User.business_id == business_id,
            User.role == UserRole.OWNER
        ).first()
        
        if not new_owner:
            raise ValueError("El nuevo dueño debe existir y tener rol 'owner' en el mismo negocio")
        
        business.owner_id = new_owner_id
        self.db.commit()
        logger.info(f"SuperAdmin changed owner of business {business_id} to {new_owner_id}")
        return True

    def set_business_status(self, business_id: UUID, is_active: bool, reason: Optional[str] = None) -> bool:
        """Activa o suspende un negocio."""
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if not business:
            return False
        
        business.is_active = is_active
        if not is_active:
            business.suspended_at = datetime.now(timezone.utc)
            business.suspended_reason = reason
        else:
            business.suspended_at = None
            business.suspended_reason = None
        
        self.db.commit()
        logger.info(f"SuperAdmin set business {business_id} active={is_active}")
        return True

    def assign_subscription_plan(self, business_id: UUID, plan_name: str, days_valid: int = 30) -> bool:
        """Asigna un plan de suscripción manualmente (desde admin)."""
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if not business:
            return False
        
        business.subscription_plan = plan_name
        business.subscription_status = "active"
        business.subscription_end_date = datetime.now(timezone.utc) + timedelta(days=days_valid)
        
        self.db.commit()
        logger.info(f"SuperAdmin assigned plan {plan_name} to business {business_id}")
        return True

    def get_global_metrics(self) -> Dict[str, Any]:
        """Retorna métricas globales del sistema."""
        total_businesses = self.db.query(Business).count()
        active_businesses = self.db.query(Business).filter(Business.is_active == True).count()
        total_users = self.db.query(User).count()
        
        # Intentar obtener ventas totales (si la tabla existe)
        try:
            from app.models.sale import Sale
            total_sales = self.db.query(Sale).count()
            total_revenue = self.db.query(func.sum(Sale.total)).scalar() or 0.0
        except:
            total_sales = 0
            total_revenue = 0.0

        return {
            "total_businesses": total_businesses,
            "active_businesses": active_businesses,
            "total_users": total_users,
            "total_sales": total_sales,
            "total_revenue": float(total_revenue),
        }

    def get_global_audit_logs(self, skip: int = 0, limit: int = 100) -> List:
        """Retorna logs de auditoría globales."""
        from app.models.business_audit_log import BusinessAuditLog
        return self.db.query(BusinessAuditLog).order_by(
            desc(BusinessAuditLog.created_at)
        ).offset(skip).limit(limit).all()

    def create_super_admin(self, email: str, password: str, first_name: str, last_name: str) -> User:
        """Crea un nuevo super administrador."""
        from app.core.security import get_password_hash
        
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise ValueError("Email ya registrado")
        
        user = User(
            email=email,
            username=email.split('@')[0],
            first_name=first_name,
            last_name=last_name,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
            business_id=None,
            password_hash=get_password_hash(password),
        )
        self.db.add(user)
        self.db.commit()
        logger.info(f"SuperAdmin created new super admin: {email}")
        return user

    def list_super_admins(self) -> List[User]:
        """Lista todos los super administradores."""
        return self.db.query(User).filter(User.role == UserRole.SUPER_ADMIN).all()