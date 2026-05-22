"""
Category service
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import re
from slugify import slugify

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    """Service for category operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)
    
    def get(self, category_id: UUID) -> Optional[Category]:
        """Get category by ID"""
        return self.repo.get(category_id)
    
    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        parent_id: Optional[UUID] = None
    ) -> List[Category]:
        """Get categories by business"""
        return self.repo.get_by_business(
            business_id=business_id,
            skip=skip,
            limit=limit,
            parent_id=parent_id
        )
    
    def get_tree(self, business_id: UUID) -> List[Dict[str, Any]]:
        """Get hierarchical category tree"""
        def build_tree(parent_id=None):
            categories = self.repo.get_tree(business_id, parent_id)
            tree = []
            for cat in categories:
                cat_dict = cat.dict()
                cat_dict['subcategories'] = build_tree(cat.id)
                tree.append(cat_dict)
            return tree
        
        return build_tree()
    
    def create(self, business_id: UUID, category_in: CategoryCreate) -> Category:
        """Create new category"""
        # Generate slug
        slug = slugify(category_in.name)
        base_slug = slug
        counter = 1
        
        # Ensure slug uniqueness
        while self.repo.get_by_name(business_id, slug.replace('-', ' ')):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        category = Category(
            business_id=business_id,
            name=category_in.name,
            description=category_in.description,
            parent_id=category_in.parent_id,
            image_url=category_in.image_url,
            slug=slug
        )
        
        self.db.add(category)
        self.db.flush()
        
        # Set path and level
        if category.parent_id:
            parent = self.get(category.parent_id)
            category.path = f"{parent.path}/{category.id}"
            category.level = parent.level + 1
        else:
            category.path = str(category.id)
            category.level = 0
        
        self.db.commit()
        self.db.refresh(category)
        
        return category
    
    def update(self, category_id: UUID, category_in: CategoryUpdate) -> Category:
        """Update category"""
        category = self.repo.get(category_id)
        if not category:
            raise ValueError("Category not found")
        
        update_data = category_in.model_dump(exclude_unset=True)
        
        # Update slug if name changed
        if 'name' in update_data and update_data['name'] != category.name:
            slug = slugify(update_data['name'])
            base_slug = slug
            counter = 1
            while self.repo.get_by_name(category.business_id, slug.replace('-', ' ')):
                slug = f"{base_slug}-{counter}"
                counter += 1
            update_data['slug'] = slug
        
        category = self.repo.update(category, update_data)
        
        # Update children paths if parent changed
        if 'parent_id' in update_data:
            if category.parent_id:
                parent = self.get(category.parent_id)
                category.path = f"{parent.path}/{category.id}"
                category.level = parent.level + 1
            else:
                category.path = str(category.id)
                category.level = 0
            
            self.db.flush()
            # Update all children paths
            self.repo.update_paths(category.id, category.path, category.level)
            self.db.commit()
        
        return category
    
    def delete(self, category_id: UUID) -> bool:
        """Soft delete category"""
        category = self.repo.get(category_id)
        if category:
            category.is_active = False
            self.db.commit()
            return True
        return False