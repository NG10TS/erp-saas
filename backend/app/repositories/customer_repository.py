"""
Customer repository
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer, CustomerCreate, CustomerUpdate]):
    
    def __init__(self, db: Session):
        super().__init__(Customer, db)
    
    def get_by_phone(self, business_id: UUID, phone: str) -> Optional[Customer]:
        """Get customer by phone number"""
        # Normalize phone for search
        normalized = phone.replace('+', '').replace(' ', '')
        
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                func.replace(self.model.phone_number, '+', '') == normalized
            )
        ).first()
    
    def get_by_identification(self, business_id: UUID, identification: str) -> Optional[Customer]:
        """Get customer by identification (cedula/RUC)"""
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                self.model.identification == identification
            )
        ).first()
    
    def get_or_create_by_phone(
        self,
        business_id: UUID,
        phone: str,
        name: Optional[str] = None
    ) -> Customer:
        """Get existing customer or create new one by phone"""
        customer = self.get_by_phone(business_id, phone)
        
        if not customer:
            customer = Customer(
                business_id=business_id,
                phone_number=phone,
                name=name
            )
            self.db.add(customer)
            self.db.flush()
        
        return customer
    
    def search(
        self,
        business_id: UUID,
        query: str,
        limit: int = 20
    ) -> List[Customer]:
        """Search customers by name, phone or identification"""
        search_term = f"%{query}%"
        
        return self.db.query(self.model).filter(
            and_(
                self.model.business_id == business_id,
                or_(
                    self.model.name.ilike(search_term),
                    self.model.phone_number.ilike(search_term),
                    self.model.identification.ilike(search_term),
                    self.model.email.ilike(search_term)
                )
            )
        ).limit(limit).all()
    
    def update_stats(self, customer_id: UUID, sale_amount: float):
        """Update customer statistics after purchase"""
        customer = self.get(customer_id)
        if customer:
            customer.total_purchases += 1
            customer.total_spent = float(customer.total_spent or 0) + sale_amount
            customer.average_purchase = customer.total_spent / customer.total_purchases
            customer.last_purchase_date = func.now()
            self.db.flush()
    
    def get_top_customers(
        self,
        business_id: UUID,
        limit: int = 10
    ) -> List[Customer]:
        """Get top customers by total spent"""
        return self.db.query(self.model).filter(
            self.model.business_id == business_id,
            self.model.is_active == True
        ).order_by(
            self.model.total_spent.desc()
        ).limit(limit).all()