# app/api/v1/endpoints/categories.py - VERSIÓN CORREGIDA
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.dependencies.auth import get_current_business
from app.models.category import Category
from app.models.business import Business
from slugify import slugify

router = APIRouter()


# 🔹 LISTAR
@router.get("/")
def get_categories(
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """List all categories for current business"""
    return db.query(Category).filter(
        Category.business_id == current_business.id
    ).all()


# 🔹 CREAR
@router.post("/")
def create_category(
    data: dict,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """Create a new category for current business"""
    slug = slugify(data["name"])
    
    # Verificar duplicado
    existing = db.query(Category).filter(
        Category.business_id == current_business.id,
        Category.name == data["name"]
    ).first()
    
    if existing:
        raise HTTPException(400, "Ya existe una categoría con ese nombre")
    
    category = Category(
        name=data["name"],
        slug=slug,
        business_id=current_business.id
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


# 🔹 OBTENER UNA - ✅ CORREGIDO
@router.get("/{category_id}")
def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """Get a single category (validates ownership)"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.business_id == current_business.id  # ← FILTRO DE TENANT
    ).first()
    
    if not category:
        raise HTTPException(404, "Categoría no encontrada")
    
    return category


# 🔹 ACTUALIZAR - ✅ CORREGIDO
@router.put("/{category_id}")
def update_category(
    category_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """Update a category (validates ownership)"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.business_id == current_business.id  # ← FILTRO DE TENANT
    ).first()
    
    if not category:
        raise HTTPException(404, "Categoría no encontrada")
    
    category.name = data["name"]
    category.slug = slugify(data["name"])
    
    db.commit()
    db.refresh(category)
    
    return category


# 🔹 ELIMINAR - ✅ CORREGIDO
@router.delete("/{category_id}")
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business)
):
    """Delete a category (validates ownership)"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.business_id == current_business.id  # ← FILTRO DE TENANT
    ).first()
    
    if not category:
        raise HTTPException(404, "Categoría no encontrada")
    
    db.delete(category)
    db.commit()
    
    return {"message": "Categoría eliminada correctamente"}