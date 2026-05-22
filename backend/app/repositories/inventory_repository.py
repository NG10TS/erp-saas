# app/repositories/inventory_repository.py
"""
Inventory movement repository
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.inventory_movement import InventoryMovement  # ✅ IMPORTAR EL MODELO


class InventoryMovementRepository:
    
    def __init__(self, db: Session):
        """Initialize repository with database session"""
        self.db = db
    
    def get_by_product(self, product_id: UUID, skip: int = 0, limit: int = 50) -> List[InventoryMovement]:
        """Get inventory movements by product"""
        return self.db.query(InventoryMovement).filter(
            InventoryMovement.product_id == product_id
        ).order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_business(self, business_id: UUID, skip: int = 0, limit: int = 100) -> List[InventoryMovement]:
        """Get inventory movements by business"""
        return self.db.query(InventoryMovement).filter(
            InventoryMovement.business_id == business_id
        ).order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, movement_data: dict) -> InventoryMovement:
        """
        Create an inventory movement from dictionary
        
        Args:
            movement_data: Dictionary with movement data
            
        Returns:
            Created InventoryMovement instance
        """
        movement = InventoryMovement(**movement_data)
        self.db.add(movement)
        self.db.flush()
        return movement
    
    def create_movement(
        self,
        product_id: UUID,
        movement_type: str,
        cantidad: int,
        previous_stock: int,
        new_stock: int,
        reason: str,
        reference_type: str = None,
        user_id: UUID = None,
        business_id: UUID = None
    ) -> InventoryMovement:
        """
        Create an inventory movement with explicit parameters
        
        Args:
            product_id: Product ID
            movement_type: 'entrada', 'salida', 'ajuste', 'reserva', 'liberacion'
            cantidad: Cantidad movida
            previous_stock: Stock before movement
            new_stock: Stock after movement
            reason: Reason for movement
            reference_type: Type of reference (sale, purchase, adjustment)
            user_id: User who performed the movement
            business_id: Business ID
            
        Returns:
            Created InventoryMovement instance
        """
        movement = InventoryMovement(
            product_id=product_id,
            movement_type=movement_type,
            cantidad=cantidad,
            stock_anterior=previous_stock,
            stock_nuevo=new_stock,
            motivo=reason,
            reference_type=reference_type,
            user_id=user_id,
            business_id=business_id
        )
        self.db.add(movement)
        self.db.flush()
        return movement
    
    def get_movements_by_type(
        self,
        business_id: UUID,
        movement_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[InventoryMovement]:
        """Get inventory movements filtered by type"""
        query = self.db.query(InventoryMovement).filter(
            InventoryMovement.business_id == business_id,
            InventoryMovement.movement_type == movement_type
        )
        
        if start_date:
            query = query.filter(InventoryMovement.created_at >= start_date)
        
        if end_date:
            query = query.filter(InventoryMovement.created_at <= end_date)
        
        return query.order_by(InventoryMovement.created_at.desc()).all()
    
    def get_stock_movements_summary(
        self,
        business_id: UUID,
        product_id: Optional[UUID] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get summary of stock movements"""
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(
            func.count(InventoryMovement.id).label('total_movements'),
            func.sum(InventoryMovement.cantidad).label('total_quantity')
        ).filter(
            InventoryMovement.business_id == business_id,
            InventoryMovement.created_at >= start_date
        )
        
        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)
        
        result = query.first()
        
        # Get movements by type
        movements_by_type = self.db.query(
            InventoryMovement.movement_type,
            func.count(InventoryMovement.id).label('count'),
            func.sum(InventoryMovement.cantidad).label('total_quantity')
        ).filter(
            InventoryMovement.business_id == business_id,
            InventoryMovement.created_at >= start_date
        ).group_by(InventoryMovement.movement_type).all()
        
        return {
            "total_movements": result.total_movements or 0,
            "total_quantity": float(result.total_quantity or 0),
            "by_type": [
                {
                    "type": m.movement_type,
                    "count": m.count,
                    "quantity": float(m.total_quantity or 0)
                }
                for m in movements_by_type
            ]
        }