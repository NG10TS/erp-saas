"""
Business resource access dependencies
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.constants.roles import UserRole
from app.dependencies.auth import get_current_business, get_current_user
from app.models.business import Business
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.invoice import Invoice
from app.models.user import User


class ResourceAccess:
    """Verify resource belongs to current business"""
    
    @staticmethod
    def get_product(
        product_id: UUID,
        db: Session = Depends(get_db),
        business: Business = Depends(get_current_business)
    ) -> Product:
        """Get product verifying ownership"""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.business_id == business.id
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return product
    
    @staticmethod
    def get_customer(
        customer_id: UUID,
        db: Session = Depends(get_db),
        business: Business = Depends(get_current_business)
    ) -> Customer:
        """Get customer verifying ownership"""
        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.business_id == business.id
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        return customer
    
    @staticmethod
    def get_sale(
        sale_id: UUID,
        db: Session = Depends(get_db),
        business: Business = Depends(get_current_business),
        current_user: User = Depends(get_current_user),
    ) -> Sale:
        """Get sale verifying ownership"""
        sale = db.query(Sale).filter(
            Sale.id == sale_id,
            Sale.business_id == business.id
        ).first()
        
        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found"
            )

        if current_user.role == UserRole.SELLER and sale.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a esta venta",
            )
        
        return sale
    
    @staticmethod
    def get_invoice(
        invoice_id: UUID,
        db: Session = Depends(get_db),
        business: Business = Depends(get_current_business)
    ) -> Invoice:
        """Get invoice verifying ownership"""
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.business_id == business.id
        ).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        return invoice


# Instances for injection
get_product = ResourceAccess.get_product
get_customer = ResourceAccess.get_customer
get_sale = ResourceAccess.get_sale
get_invoice = ResourceAccess.get_invoice
