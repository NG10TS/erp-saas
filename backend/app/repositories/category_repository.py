"""
Category repository
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    
    def __init__(self, db: Session):
        super().__init__(Category, db)
    
    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        parent_id: Optional[UUID] = None,
        only_active: bool = True
    ) -> List[Category]:
        """Get categories by business with filters"""
        query = self.db.query(self.model).filter(
            self.model.business_id == business_id
        )
        
        if parent_id is not None:
            if parent_id:
                query = query.filter(self.model.parent_id == parent_id)
            else:
                query = query.filter(self.model.parent_id.is_(None))
        
        if only_active:
            query = query.filter(self.model.is_active == True)
        
        return query.order_by(self.model.name).offset(skip).limit(limit).all()
    
    def get_by_name(self, business_id: UUID, name: str) -> Optional[Category]:
        """Get category by name"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.name == name
            )
        ).first()
    
    def get_tree(self, business_id: UUID, parent_id: Optional[UUID] = None) -> List[Category]:
        """Get category tree for a business"""
        query = self.db.query(self.model).filter(
            self.model.business_id == business_id,
            self.model.is_active == True
        )
        
        if parent_id:
            query = query.filter(self.model.parent_id == parent_id)
        else:
            query = query.filter(self.model.parent_id.is_(None))
        
        return query.order_by(self.model.name).all()
    
    def get_subcategories(self, category_id: UUID) -> List[Category]:
        """Get all subcategories of a category"""
        return self.db.query(self.model).filter(
            self.model.parent_id == category_id,
            self.model.is_active == True
        ).order_by(self.model.name).all()
    
    def update_paths(self, category_id: UUID, path: str, level: int):
        """Update materialized path for a category and its children"""
        category = self.get(category_id)
        if category:
            category.path = path
            category.level = level
            self.db.flush()
            
            # Update children
            children = self.get_subcategories(category_id)
            for child in children:
                self.update_paths(child.id, f"{path}/{child.id}", level + 1)