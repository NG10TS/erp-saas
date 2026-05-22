"""
Product service with inventory management
"""
# app/services/product_service.py

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, StockAdjustment
from app.repositories.product_repository import ProductRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.inventory_repository import InventoryMovementRepository

logger = logging.getLogger(__name__)


class ProductService:
    """Service for product operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)
        self.category_repo = CategoryRepository(db)
        self.inventory_repo = InventoryMovementRepository(db)

    def soft_delete(self, product_id: UUID, user_id: Optional[UUID] = None) -> Optional[Product]:
        """Soft delete a product"""
        product = self.repo.soft_delete(product_id, user_id)
        if product:
            logger.info(f"Product soft deleted: {product.name} (ID: {product_id})")
        return product
    
    def restore_product(self, product_id: UUID) -> Optional[Product]:
        """Restore a soft-deleted product"""
        product = self.repo.restore(product_id)
        if product:
            logger.info(f"Product restored: {product.name} (ID: {product_id})")
        return product
    
    def permanent_delete(self, product_id: UUID) -> bool:
        """Permanently delete a product (hard delete - use with caution)"""
        success = self.repo.permanent_delete(product_id)
        if success:
            logger.warning(f"Product permanently deleted: {product_id}")
        return success
    
    def get_deleted_products(self, business_id: UUID) -> List[Product]:
        """Get all soft-deleted products for a business"""
        return self.repo.get_deleted_products(business_id)
    
    def get(self, product_id: UUID) -> Optional[Product]:
        """Get product by ID"""
        return self.repo.get(product_id)
    
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
        return self.repo.get_by_business(
            business_id=business_id,
            skip=skip,
            limit=limit,
            category_id=category_id,
            is_active=is_active,
            low_stock=low_stock,
            search=search,
            include_deleted=include_deleted  # ✅ Nuevo
        )
    
    def create(self, product_in: ProductCreate, business_id: UUID, user_id: UUID) -> Product:
        """Create new product"""
        try:
            # Check SKU uniqueness if provided
            if product_in.sku:
                existing = self.repo.get_by_sku(business_id, product_in.sku)
                if existing:
                    raise ValueError(f"Product with SKU {product_in.sku} already exists")
            
            # Check barcode uniqueness if provided
            if product_in.barcode:
                existing = self.repo.get_by_barcode(business_id, product_in.barcode)
                if existing:
                    raise ValueError(f"Product with barcode {product_in.barcode} already exists")
            
            # Validate category if provided
            if product_in.category_id:
                category = self.category_repo.get(product_in.category_id)
                if not category or category.business_id != business_id:
                    raise ValueError("Invalid category")
            
            # ✅ CORREGIDO: Calcular utilidad primero, pero crear producto fuera del IF
            utilidad = 0
            if product_in.costo and product_in.precio_venta and product_in.precio_venta > 0:
                utilidad = ((product_in.precio_venta - product_in.costo) / product_in.precio_venta) * 100
            
            # ✅ CORREGIDO: Crear producto FUERA del IF (siempre se crea)
            product = Product(
                business_id=business_id,
                created_by=user_id,
                name=product_in.name,
                description=product_in.description,
                sku=product_in.sku,
                barcode=product_in.barcode,
                category_id=product_in.category_id,
                precio_venta=product_in.precio_venta,
                precio_mayorista=product_in.precio_mayorista,
                costo=product_in.costo,
                stock_actual=product_in.stock_actual or 0,
                stock_minimo=product_in.stock_minimo or 0,
                stock_maximo=product_in.stock_maximo,
                ubicacion=product_in.ubicacion,
                impuesto_iva=product_in.impuesto_iva or 15,
                codigo_iva_sri=product_in.codigo_iva_sri or "2",
                tiene_ice=product_in.tiene_ice or False,
                porcentaje_ice=product_in.porcentaje_ice,
                control_stock=product_in.control_stock if product_in.control_stock is not None else True,
                es_servicio=product_in.es_servicio or False,
                is_active=product_in.is_active if product_in.is_active is not None else True,
                imagen_url=product_in.imagen_url,
                imagenes=product_in.imagenes or [],
                atributos=product_in.atributos or {},
                tags=product_in.tags or [],
                utilidad_porcentaje=utilidad  # ✅ Asignar utilidad calculada
            )
            
            self.db.add(product)
            self.db.flush()  # Esto asigna el ID al producto
            
            # Registrar movimiento de inventario inicial si hay stock
            # Registrar movimiento de inventario inicial si hay stock
            if product.control_stock and product.stock_actual > 0:
                try:
                    from app.models.inventory_movement import InventoryMovement
                    
                    # ✅ CORREGIDO: Incluir TODOS los campos requeridos
                    movement = InventoryMovement(
                        business_id=business_id,          # ← REQUERIDO
                        product_id=product.id,
                        user_id=user_id,
                        movement_type="entrada",
                        cantidad=product.stock_actual,
                        stock_anterior=0,
                        stock_nuevo=product.stock_actual,
                        motivo="Initial inventory",
                        reference_type="initial",
                    )
                    
                    self.db.add(movement)
                    self.db.flush()
                    logger.info(f"Initial inventory movement created for product {product.id}")
                    
                except Exception as e:
                    # Si falla, loguear pero no detener la creación
                    logger.warning(f"Could not create inventory movement: {e}")
            self.db.commit()
            self.db.refresh(product)
            
            logger.info(f"Product created: {product.sku or product.name} - {product.name}")
            
            return product
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating product: {e}")
            raise

    def update(
        self,
        product_id: UUID,
        product_in: ProductUpdate,
        user_id: Optional[UUID] = None
    ) -> Product:
        """Update product"""
        product = self.repo.get(product_id)
        if not product:
            raise ValueError("Product not found")
        
        update_data = product_in.model_dump(exclude_unset=True)
        
        # Mapear nombres de campos del frontend al modelo
        field_mapping = {
            'precio_venta': 'precio_venta',
            'precio_mayorista': 'precio_mayorista',
            'costo': 'costo',
            'stock_actual': 'stock_actual',
            'stock_minimo': 'stock_minimo',
            'stock_maximo': 'stock_maximo',
            'ubicacion': 'ubicacion',
            'impuesto_iva': 'impuesto_iva',
            'codigo_iva_sri': 'codigo_iva_sri',
            'tiene_ice': 'tiene_ice',
            'porcentaje_ice': 'porcentaje_ice',
            'control_stock': 'control_stock',
            'es_servicio': 'es_servicio',
            'is_active': 'is_active',
            'imagen_url': 'imagen_url',
            'imagenes': 'imagenes',
            'atributos': 'atributos',
            'tags': 'tags'
        }
        
        # Aplicar mapeo
        mapped_data = {}
        for key, value in update_data.items():
            mapped_key = field_mapping.get(key, key)
            mapped_data[mapped_key] = value
        
        # Recalcular utilidad si cambió precio o costo
        if 'precio_venta' in mapped_data or 'costo' in mapped_data:
            new_price = mapped_data.get('precio_venta', product.precio_venta)
            new_cost = mapped_data.get('costo', product.costo)
            if new_cost and new_price and new_price > 0:
                mapped_data['utilidad_porcentaje'] = ((new_price - new_cost) / new_price) * 100
        
        # Guardar stock anterior para movimiento
        old_stock = product.stock_actual
        
        # Actualizar producto
        for key, value in mapped_data.items():
            setattr(product, key, value)
        
        self.db.commit()
        self.db.refresh(product)
        
        # Registrar movimiento de stock si cambió
        if 'stock_actual' in mapped_data and old_stock != product.stock_actual:
            difference = product.stock_actual - old_stock
            if difference != 0:
                movement_type = 'entrada' if difference > 0 else 'salida'
                try:
                    self.inventory_repo.create(
                        product_id=product.id,
                        movement_type=movement_type,
                        quantity=abs(difference),
                        previous_stock=old_stock,
                        new_stock=product.stock_actual,
                        reason='Manual stock adjustment',
                        reference_type='adjustment',
                        user_id=user_id
                    )
                except Exception as e:
                    logger.warning(f"Could not create stock movement: {e}")
        
        logger.info(f"Product updated: {product.sku or product.name}")
        
        return product

    def adjust_stock(
        self,
        product_id: UUID,
        adjustment: StockAdjustment,
        user_id: UUID
    ) -> Product:
        """Adjust product stock"""
        product = self.repo.get(product_id)
        if not product:
            raise ValueError("Product not found")
        
        old_stock = product.stock_actual
        movement_type = 'entrada' if adjustment.quantity > 0 else 'salida'
        new_stock = old_stock + adjustment.quantity
        
        # Update stock
        product.stock_actual = new_stock
        self.db.commit()
        
        # Create movement record
        try:
            self.inventory_repo.create(
                product_id=product.id,
                movement_type=movement_type,
                quantity=abs(adjustment.quantity),
                previous_stock=old_stock,
                new_stock=new_stock,
                reason=adjustment.reason,
                reference_type='adjustment',
                user_id=user_id
            )
        except Exception as e:
            logger.warning(f"Could not create stock movement: {e}")
        
        self.db.refresh(product)
        logger.info(f"Stock adjusted for product {product.sku}: {old_stock} -> {new_stock}")
        
        return product
    
    def delete(self, product_id: UUID) -> bool:
        """Soft delete product"""
        product = self.repo.get(product_id)
        if product:
            product.is_active = False
            self.db.commit()
            logger.info(f"Product deleted: {product.sku or product.name}")
            return True
        return False
    
    def get_low_stock_products(self, business_id: UUID) -> List[Product]:
        """Get products with low stock"""
        return self.db.query(Product).filter(
            Product.business_id == business_id,
            Product.is_active == True,
            Product.control_stock == True,
            Product.stock_actual <= Product.stock_minimo,
            Product.stock_actual > 0
        ).all()
    
    def get_inventory_summary(self, business_id: UUID) -> Dict[str, Any]:
        """Get inventory summary"""
        return self.repo.get_inventory_summary(business_id)
    
    def get_categories(self, business_id: UUID) -> List[str]:
        """Get unique categories for business"""
        return self.repo.get_categories(business_id)

    def get_product_with_category(self, product: Product) -> dict:
        """Helper to get product with category name"""
        category_name = None
        if product.category_id:
            category = self.category_repo.get(product.category_id)
            if category:
                category_name = category.name
        
        return {
            "id": product.id,
            "sku": product.sku,
            "barcode": product.barcode,
            "name": product.name,
            "description": product.description,
            "category_id": product.category_id,
            "category_name": category_name,
            "precio_venta": product.precio_venta,
            "precio_mayorista": product.precio_mayorista,
            "costo": product.costo,
            "utilidad_porcentaje": product.utilidad_porcentaje or 0,
            "impuesto_iva": product.impuesto_iva or 15,
            "codigo_iva_sri": product.codigo_iva_sri or "2",
            "tiene_ice": product.tiene_ice or False,
            "porcentaje_ice": product.porcentaje_ice,
            "control_stock": product.control_stock,
            "stock_actual": product.stock_actual or 0,
            "stock_reservado": product.stock_reservado or 0,
            "stock_disponible": (product.stock_actual or 0) - (product.stock_reservado or 0),
            "stock_minimo": product.stock_minimo or 0,
            "stock_maximo": product.stock_maximo,
            "ubicacion": product.ubicacion,
            "es_servicio": product.es_servicio,
            "is_active": product.is_active,
            "imagen_url": product.imagen_url,
            "imagenes": product.imagenes or [],
            "atributos": product.atributos or {},
            "tags": product.tags or [],
            "created_at": product.created_at,
            "updated_at": product.updated_at or product.created_at
        }