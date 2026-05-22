"""
Category model for product categorization
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Category(BaseModel):
    __tablename__ = "categories"
    
    __table_args__ = (
        Index('ix_categories_business_name', 'business_id', 'name', unique=True),
        Index('ix_categories_parent', 'business_id', 'parent_id'),
    )
    
    # FK
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    # Fields
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    slug = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    
    image_url = Column(String(500))
    
    level = Column(Integer, default=0)
    path = Column(String(500))
    
    # Relationships
    business = relationship("Business", back_populates="categories")
    
    parent = relationship(
        "Category",
        remote_side="Category.id",   
        backref="subcategories"
    )
    
    products = relationship("Product", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"