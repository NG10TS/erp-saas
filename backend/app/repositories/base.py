"""
Base repository with common CRUD operations
"""
from typing import Generic, TypeVar, Type, Optional, List, Dict, Any, Union
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete
from pydantic import BaseModel

from app.db.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base repository with common database operations
    """
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: UUID) -> Optional[ModelType]:
        """Get by ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """Get multiple records with optional filters"""
        query = self.db.query(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        """Create new record"""
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        self.db.add(db_obj)
        self.db.flush()
        return db_obj
    
    def update(
        self, db_obj: ModelType, obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update existing record"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        self.db.add(db_obj)
        self.db.flush()
        return db_obj
    
    def delete(self, *, id: UUID) -> bool:
        """Delete record by ID"""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.flush()
            return True
        return False
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters"""
        query = self.db.query(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        return query.count()