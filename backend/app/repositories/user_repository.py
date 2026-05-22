# app/repositories/user_repository.py
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """Repository for User model operations"""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)  # ✅ Excluir soft-deleted
        ).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(
            User.username == username,
            User.deleted_at.is_(None)  # ✅ Excluir soft-deleted
        ).first()
    
    def get_by_id_and_business(self, user_id: UUID, business_id: UUID) -> Optional[User]:
        """Get user by ID and business ID (multi-tenant)"""
        return self.db.query(User).filter(
            User.id == user_id,
            User.business_id == business_id,
            User.deleted_at.is_(None)  # ✅ Excluir soft-deleted
        ).first()
    
    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[User]:
        """Get all users by business with filters"""
        # ✅ Excluir usuarios eliminados (soft delete)
        query = self.db.query(User).filter(
            User.business_id == business_id,
            User.deleted_at.is_(None)
        )
        
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(pattern),
                    User.username.ilike(pattern),
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                )
            )
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    def count_active_by_business(self, business_id: UUID) -> int:
        """Count active users in a business"""
        return self.db.query(User).filter(
            User.business_id == business_id,
            User.is_active == True,
            User.deleted_at.is_(None)  # ✅ Excluir soft-deleted
        ).count()