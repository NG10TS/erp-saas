"""
Sale repository with inventory integration
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleUpdate
from app.repositories.base import BaseRepository
from app.constants.sales import SaleStatus, PaymentStatus


class SaleRepository(BaseRepository[Sale, SaleCreate, SaleUpdate]):
    
    def __init__(self, db: Session):
        super().__init__(Sale, db)
    
    def get_with_items(self, id: UUID) -> Optional[Sale]:
        """Get sale with items loaded"""
        return self.db.query(self.model).filter(
            self.model.id == id
        ).options(
            joinedload(self.model.items)
        ).first()
    
    def get_by_business(
        self,
        business_id: UUID,
        created_by: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SaleStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        customer_id: Optional[UUID] = None,
        search: Optional[str] = None
    ) -> List[Sale]:
        """Get sales by business with filters"""
        query = self.db.query(self.model).filter(
            self.model.business_id == business_id
        )

        if created_by:
            query = query.filter(self.model.created_by == created_by)
        
        if status:
            query = query.filter(self.model.estado == status)
        
        if from_date:
            query = query.filter(self.model.fecha_venta >= from_date)
        
        if to_date:
            query = query.filter(self.model.fecha_venta <= to_date)
        
        if customer_id:
            query = query.filter(self.model.customer_id == customer_id)
        
        if search:
            pattern = f"%{search}%"
            query = query.join(Sale.customer, isouter=True).filter(
                or_(
                    self.model.numero_venta.ilike(pattern),
                    Customer.name.ilike(pattern),
                    Customer.phone_number.ilike(pattern)
                )
            )
        
        return query.order_by(
            self.model.fecha_venta.desc()
        ).offset(skip).limit(limit).all()
    
    def get_by_number(self, business_id: UUID, numero_venta: str) -> Optional[Sale]:
        """Get sale by number"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.numero_venta == numero_venta
            )
        ).first()
    
    def generate_sale_number(self, business_id: UUID) -> str:
        """Generate unique sale number"""
        today = datetime.utcnow()
        year = today.strftime("%y")
        month = today.strftime("%m")
        day = today.strftime("%d")
        
        # Get today's count
        count = self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                func.date(self.model.created_at) == today.date()
            )
        ).count() + 1
        
        return f"VTA-{year}{month}{day}-{count:04d}"
    
    def get_daily_summary(
        self,
        business_id: UUID,
        date: Optional[datetime] = None,
        created_by: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """Get daily sales summary"""
        if not date:
            date = datetime.utcnow()
        
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        # Total sales
        total_query = self.db.query(
            func.count(self.model.id).label('count'),
            func.sum(self.model.total).label('total')
        ).filter(
            and_(
                self.model.business_id == business_id,
                self.model.fecha_venta >= day_start,
                self.model.fecha_venta < day_end,
                self.model.estado != SaleStatus.CANCELLED
            )
        )

        by_payment_query = self.db.query(
            self.model.metodo_pago,
            func.count(self.model.id).label('count'),
            func.sum(self.model.total).label('total')
        ).filter(
            and_(
                self.model.business_id == business_id,
                self.model.fecha_venta >= day_start,
                self.model.fecha_venta < day_end,
                self.model.estado != SaleStatus.CANCELLED
            )
        )

        if created_by:
            total_query = total_query.filter(self.model.created_by == created_by)
            by_payment_query = by_payment_query.filter(self.model.created_by == created_by)

        total = total_query.first()
        by_payment = by_payment_query.group_by(self.model.metodo_pago).all()
        
        return {
            "date": date.date(),
            "total_sales": total[0] or 0,
            "total_amount": float(total[1] or 0),
            "by_payment_method": [
                {
                    "method": pm[0].value if pm[0] else None,
                    "count": pm[1],
                    "amount": float(pm[2] or 0)
                }
                for pm in by_payment
            ]
        }
    
    def get_pending_invoices(self, business_id: UUID) -> List[Sale]:
        """Get sales pending invoice generation"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.estado == SaleStatus.COMPLETED,
                self.model.factura_id.is_(None)
            )
        ).all()
