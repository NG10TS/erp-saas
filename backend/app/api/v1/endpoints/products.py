"""
Product endpoints
"""
# app/api/v1/endpoints/products.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
from app.dependencies.auth import get_current_user, get_current_business, require_manager
from app.core.database import get_db
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    StockAdjustment,
)
from app.services.product_service import ProductService
from app.dependencies.business import get_product
from app.models.business import Business
from app.models.product import Product

router = APIRouter()

@router.get("/", response_model=List[ProductListResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    low_stock: bool = False,
    search: Optional[str] = None,
    include_deleted: bool = Query(False, description="Include soft-deleted products"),  # ✅ Nuevo
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    List products with filters
    """
    product_service = ProductService(db)
    
    products = product_service.get_by_business(
        business_id=current_business.id,
        skip=skip,
        limit=limit,
        category_id=category,
        is_active=is_active,
        low_stock=low_stock,
        search=search,
        include_deleted=include_deleted  # ✅ Nuevo
    )
    
    return products

@router.delete("/{product_id}")
async def delete_product(
    product: Product = Depends(get_product),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Soft delete product (can be restored)
    """
    product_service = ProductService(db)
    
    # Soft delete
    deleted_product = product_service.soft_delete(product.id, current_user.id)
    
    if not deleted_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update business counter
    business = product.business
    if business:
        business.current_products = max(0, business.current_products - 1)
        db.commit()
    
    return {
        "message": "Product deleted successfully",
        "product_id": str(product.id),
        "can_be_restored": True,
        "deleted_at": deleted_product.deleted_at.isoformat() if deleted_product.deleted_at else None
    }

@router.post("/{product_id}/restore")
async def restore_product(
    product_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Restore a soft-deleted product
    """
    product_service = ProductService(db)
    
    restored_product = product_service.restore_product(product_id)
    
    if not restored_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not deleted"
        )
    
    # Update business counter
    restored_product.business.current_products += 1
    db.commit()
    
    return {
        "message": "Product restored successfully",
        "product_id": str(product_id),
        "product_name": restored_product.name
    }

@router.delete("/{product_id}/permanent")
async def permanent_delete_product(
    product: Product = Depends(get_product),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Permanently delete product (HARD DELETE - cannot be undone)
    Use with caution!
    """
    product_service = ProductService(db)
    
    # Check if product has sales
    if product.sale_items and len(product.sale_items) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot permanently delete product with existing sales. Use soft delete instead."
        )
    
    product_name = product.name
    success = product_service.permanent_delete(product.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update business counter
    business = product.business
    if business:
        business.current_products = max(0, business.current_products - 1)
        db.commit()
    
    return {
        "message": f"Product '{product_name}' permanently deleted",
        "product_id": str(product.id),
        "permanent": True
    }

@router.get("/deleted")
async def get_deleted_products(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all soft-deleted products for the current business
    """
    product_service = ProductService(db)
    products = product_service.get_deleted_products(current_business.id)
    
    return {
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "deleted_at": p.deleted_at.isoformat() if p.deleted_at else None,
                "can_be_restored": True
            }
            for p in products
        ]
    }

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    current_business: Business = Depends(get_current_business),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Create new product
    """
    # Check business limits
    if not current_business.can_add_resource("products"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Product limit reached for your plan"
        )
    
    product_service = ProductService(db)
    
    product = product_service.create(
        product_in=product_in,
        business_id=current_business.id,
        user_id=current_user.id
    )
    
    # Update business counter
    current_business.current_products += 1
    db.commit()
    
    # ✅ Refresh the product to ensure it's attached to the session
    db.refresh(product)
    
    # ✅ Obtener category_name si existe
    category_name = None
    if product.category_id:
        category = product_service.category_repo.get(product.category_id)
        if category:
            category_name = category.name
    
    # ✅ Construir respuesta con datos de la sesión activa
    return ProductResponse(
        id=product.id,
        business_id=product.business_id,
        sku=product.sku,
        barcode=product.barcode,
        name=product.name,
        description=product.description,
        category_id=product.category_id,
        category_name=category_name,
        precio_venta=product.precio_venta,
        precio_mayorista=product.precio_mayorista,
        costo=product.costo,
        utilidad_porcentaje=product.utilidad_porcentaje or 0,
        impuesto_iva=product.impuesto_iva or 15,
        codigo_iva_sri=product.codigo_iva_sri or "2",
        tiene_ice=product.tiene_ice or False,
        porcentaje_ice=product.porcentaje_ice,
        control_stock=product.control_stock,
        stock_actual=product.stock_actual or 0,
        stock_reservado=product.stock_reservado or 0,
        stock_disponible=(product.stock_actual or 0) - (product.stock_reservado or 0),
        stock_minimo=product.stock_minimo or 0,
        stock_maximo=product.stock_maximo,
        ubicacion=product.ubicacion,
        es_servicio=product.es_servicio,
        is_active=product.is_active,
        imagen_url=product.imagen_url,
        imagenes=product.imagenes or [],
        atributos=product.atributos or {},
        tags=product.tags or [],
        created_at=product.created_at,
        updated_at=product.updated_at or product.created_at  # ✅ Usar created_at si updated_at es None
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product: Product = Depends(get_product)
) -> Any:
    """
    Get product by ID
    """
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_in: ProductUpdate,
    product: Product = Depends(get_product),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Update product
    """
    product_service = ProductService(db)
    product = product_service.update(
        product_id=product.id,
        product_in=product_in,
        user_id=current_user.id
    )
    return product




# app/api/v1/endpoints/products.py

@router.post("/{product_id}/stock")
async def update_stock(
    stock_update: StockAdjustment,
    product: Product = Depends(get_product),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Update product stock
    """
    product_service = ProductService(db)
    product = product_service.adjust_stock(
        product_id=product.id,
        adjustment=stock_update,
        user_id=current_user.id
    )
    
    return {
        "product_id": product.id,
        "new_stock": product.stock_actual,  # ✅ CORREGIDO
        "message": "Stock updated successfully"
    }


@router.post("/{product_id}/toggle-active")
async def toggle_product_active(
    product: Product = Depends(get_product),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """
    Toggle product active status
    """
    product.is_active = not product.is_active
    db.commit()
    
    return {
        "product_id": product.id,
        "is_active": product.is_active,
        "message": f"Product {'activated' if product.is_active else 'deactivated'}"
    }


# app/api/v1/endpoints/products.py
@router.get("/stats/low-stock")
async def get_low_stock_products(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get low stock products summary
    """
    product_service = ProductService(db)
    products = product_service.get_low_stock_products(current_business.id)
    
    return {
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "stock": p.stock_actual,      # ✅ CORREGIDO: usar stock_actual
                "min_stock": p.stock_minimo   # ✅ CORREGIDO: usar stock_minimo
            }
            for p in products
        ]
    }

@router.get("/categories/list")
async def get_categories(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all product categories
    """
    product_service = ProductService(db)
    categories = product_service.get_categories(current_business.id)
    
    return {"categories": categories}