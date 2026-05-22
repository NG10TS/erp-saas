"""
Product repository with inventory management
"""
# app/repositories/product_repository.py

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, select

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.base import BaseRepository
from app.core.config import settings


class ProductRepository(BaseRepository[Product, ProductCreate, ProductUpdate]):
    
    def __init__(self, db: Session):
        super().__init__(Product, db)
    
    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
        low_stock: bool = False,
        search: Optional[str] = None,
        include_deleted: bool = False  # ✅ Nuevo parámetro
    ) -> List[Product]:
        """Get products by business with filters"""
        query = self.db.query(self.model).filter(
            self.model.business_id == business_id
        )
        
        # ✅ Filter deleted products
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        
        if category_id:
            query = query.filter(self.model.category_id == category_id)
        
        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)
        
        if low_stock:
            query = query.filter(
                and_(
                    self.model.control_stock == True,
                    self.model.es_servicio == False,
                    self.model.stock_actual <= self.model.stock_minimo
                )
            )
        
        if search:
            if settings.IS_POSTGRESQL:
                # Full-text search
                search_query = func.plainto_tsquery('spanish', search)
                query = query.filter(
                    self.model.search_vector.op('@@')(search_query)
                ).order_by(
                    func.ts_rank_cd(self.model.search_vector, search_query).desc()
                )
            else:
                # Simple search
                pattern = f"%{search}%"
                query = query.filter(
                    or_(
                        self.model.name.ilike(pattern),
                        self.model.sku.ilike(pattern),
                        self.model.barcode.ilike(pattern)
                    )
                )
        
        return query.order_by(self.model.name).offset(skip).limit(limit).all()
    
    def get_deleted_products(self, business_id: UUID) -> List[Product]:
        """Get only soft-deleted products"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.deleted_at.isnot(None)
            )
        ).order_by(self.model.deleted_at.desc()).all()
    
    def get_by_sku(self, business_id: UUID, sku: str, include_deleted: bool = False) -> Optional[Product]:
        """Get product by SKU"""
        query = self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.sku == sku
            )
        )
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        return query.first()
    
    def get_by_barcode(self, business_id: UUID, barcode: str, include_deleted: bool = False) -> Optional[Product]:
        """Get product by barcode"""
        query = self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.barcode == barcode
            )
        )
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        return query.first()
    
    def soft_delete(self, product_id: UUID, user_id: Optional[UUID] = None) -> Optional[Product]:
        """Soft delete a product"""
        product = self.get(product_id)
        if product:
            product.soft_delete(user_id)
            self.db.commit()
            self.db.refresh(product)
            return product
        return None
    
    def restore(self, product_id: UUID) -> Optional[Product]:
        """Restore a soft-deleted product"""
        product = self.db.query(self.model).filter(
            and_(
                self.model.id == product_id,
                self.model.deleted_at.isnot(None)
            )
        ).first()
        if product:
            product.restore()
            self.db.commit()
            self.db.refresh(product)
            return product
        return None
    
    def permanent_delete(self, product_id: UUID) -> bool:
        """Permanently delete a product (hard delete)"""
        product = self.get(product_id)
        if product:
            self.db.delete(product)
            self.db.commit()
            return True
        return False
    
    def update_stock(
        self, 
        product_id: UUID, 
        quantity: int,
        movement_type: str,
        user_id: Optional[UUID] = None,
        reference: Optional[Dict] = None
    ) -> Optional[Product]:
        """Update product stock and create movement record"""
        product = self.get(product_id)
        if not product:
            return None
        
        old_stock = product.stock_actual
        
        # Update stock
        if movement_type in ['entrada', 'devolucion']:
            product.stock_actual += quantity
        elif movement_type == 'salida':
            if product.stock_actual < quantity:
                raise ValueError("Insufficient stock")
            product.stock_actual -= quantity
        elif movement_type == 'ajuste':
            product.stock_actual = quantity
        
        self.db.flush()
        
        # Create inventory movement record
        from app.models.inventory_movement import InventoryMovement
        movement = InventoryMovement(
            business_id=product.business_id,
            product_id=product_id,
            user_id=user_id,
            movement_type=movement_type,
            cantidad=quantity,
            stock_anterior=old_stock,
            stock_nuevo=product.stock_actual,
            reference_type=reference.get('type') if reference else None,
            reference_id=reference.get('id') if reference else None,
            reference_number=reference.get('number') if reference else None,
            motivo=reference.get('motivo', movement_type) if reference else movement_type,
        )
        self.db.add(movement)
        self.db.flush()
        
        return product
    
    def reserve_stock(self, product_id: UUID, quantity: int) -> bool:
        """Reserve stock for a sale"""
        product = self.get(product_id)
        if product and product.can_sell(quantity):
            product.stock_reservado += quantity
            self.db.flush()
            
            # Create reservation movement
            from app.models.inventory_movement import InventoryMovement
            movement = InventoryMovement(
                business_id=product.business_id,
                product_id=product_id,
                movement_type='reserva',
                cantidad=quantity,
                stock_anterior=product.stock_actual,
                stock_nuevo=product.stock_actual,
                motivo=f"Reserva para venta",
            )
            self.db.add(movement)
            self.db.flush()
            
            return True
        return False
    
    def release_stock(self, product_id: UUID, quantity: int) -> bool:
        """Release reserved stock"""
        product = self.get(product_id)
        if product:
            product.stock_reservado = max(0, product.stock_reservado - quantity)
            self.db.flush()
            
            # Create release movement
            from app.models.inventory_movement import InventoryMovement
            movement = InventoryMovement(
                business_id=product.business_id,
                product_id=product_id,
                movement_type='liberacion',
                cantidad=-quantity,
                stock_anterior=product.stock_actual,
                stock_nuevo=product.stock_actual,
                motivo=f"Liberación de stock reservado",
            )
            self.db.add(movement)
            self.db.flush()
            
            return True
        return False
    
    def consume_reserved_stock(self, product_id: UUID, quantity: int) -> bool:
        """Consume reserved stock (sale completed)"""
        product = self.get(product_id)
        if product and product.stock_actual >= quantity:
            product.stock_actual -= quantity
            product.stock_reservado = max(0, product.stock_reservado - quantity)
            self.db.flush()
            return True
        return False
    
    def get_low_stock_products(self, business_id: UUID) -> List[Product]:
        """Get products with low stock"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.control_stock == True,
                self.model.es_servicio == False,
                self.model.is_active == True,
                self.model.stock_actual <= self.model.stock_minimo
            )
        ).order_by(
            (self.model.stock_actual - self.model.stock_minimo).asc()
        ).all()
    
    def get_inventory_summary(self, business_id: UUID) -> Dict[str, Any]:
        """Get inventory summary statistics"""
        result = self.db.query(
            func.count(self.model.id).label('total_products'),
            func.sum(self.model.stock_actual).label('total_items'),
            func.sum(self.model.costo * self.model.stock_actual).label('total_cost'),
            func.sum(self.model.precio_venta * self.model.stock_actual).label('total_retail'),
            func.sum(
                func.cast(
                    and_(
                        self.model.control_stock == True,
                        self.model.es_servicio == False,
                        self.model.stock_actual <= self.model.stock_minimo
                    ),
                    Integer
                )
            ).label('low_stock_count'),
            func.sum(
                func.cast(
                    and_(
                        self.model.control_stock == True,
                        self.model.es_servicio == False,
                        self.model.stock_actual == 0
                    ),
                    Integer
                )
            ).label('out_of_stock_count')
        ).filter(
            self.model.business_id == business_id,
            self.model.is_active == True
        ).first()
        
        return {
            "total_products": result.total_products or 0,
            "total_items": result.total_items or 0,
            "total_value_cost": float(result.total_cost or 0),
            "total_value_retail": float(result.total_retail or 0),
            "low_stock_count": result.low_stock_count or 0,
            "out_of_stock_count": result.out_of_stock_count or 0
        }