"""
Repositorio de Reportes - Consultas optimizadas para reportes
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.business import Business


class ReportRepository:
    """Repositorio para consultas de reportes con agregaciones"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_sales_report(
        self,
        business_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
    ) -> List[Dict[str, Any]]:
        """Obtiene datos de ventas para reportes"""
        query = self.db.query(
            Sale.id,
            Sale.numero_venta,
            Sale.fecha_venta,
            Sale.estado,
            Sale.estado_pago,
            Sale.metodo_pago,
            Sale.subtotal,
            Sale.descuento,
            Sale.iva,
            Sale.total,
            Customer.name.label('customer_name'),
        ).outerjoin(Customer, Sale.customer_id == Customer.id).filter(
            Sale.business_id == business_id
        )
        
        if from_date:
            query = query.filter(func.date(Sale.fecha_venta) >= from_date)
        if to_date:
            query = query.filter(func.date(Sale.fecha_venta) <= to_date)
        if status:
            query = query.filter(Sale.estado == status)
        if customer_id:
            query = query.filter(Sale.customer_id == customer_id)
        
        results = query.order_by(Sale.fecha_venta.desc()).all()
        
        return [
            {
                "id": str(r.id),
                "numero_venta": r.numero_venta,
                "fecha_venta": r.fecha_venta.isoformat() if r.fecha_venta else None,
                "estado": r.estado,
                "estado_pago": r.estado_pago,
                "metodo_pago": r.metodo_pago,
                "subtotal": float(r.subtotal) if r.subtotal else 0,
                "descuento": float(r.descuento) if r.descuento else 0,
                "iva": float(r.iva) if r.iva else 0,
                "total": float(r.total) if r.total else 0,
                "customer_name": r.customer_name or "Consumidor Final",
            }
            for r in results
        ]
    
    def get_inventory_report(
        self,
        business_id: UUID,
        category_id: Optional[UUID] = None,
        low_stock_only: bool = False,
        is_active: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """Obtiene datos de inventario para reportes"""
        query = self.db.query(Product).filter(
            Product.business_id == business_id
        )
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if low_stock_only:
            query = query.filter(
                Product.control_stock == True,
                Product.stock_actual <= Product.stock_minimo
            )
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
        
        products = query.order_by(Product.name).all()
        
        return [
            {
                "id": str(p.id),
                "sku": p.sku or "-",
                "name": p.name,
                "category_name": p.category.name if p.category else "-",
                "stock_actual": p.stock_actual or 0,
                "stock_minimo": p.stock_minimo or 0,
                "precio_venta": float(p.precio_venta) if p.precio_venta else 0,
                "costo": float(p.costo) if p.costo else 0,
                "utilidad": float(p.precio_venta - (p.costo or 0)) if p.precio_venta else 0,
                "is_active": p.is_active,
                "control_stock": p.control_stock,
            }
            for p in products
        ]
    
    def get_customers_report(
        self,
        business_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Obtiene datos de clientes para reportes"""
        query = self.db.query(
            Customer.id,
            Customer.name,
            Customer.identification,
            Customer.email,
            Customer.phone_number,
            func.count(Sale.id).label('total_purchases'),
            func.coalesce(func.sum(Sale.total), 0).label('total_spent'),
            func.max(Sale.fecha_venta).label('last_purchase'),
        ).outerjoin(Sale, Customer.id == Sale.customer_id).filter(
            Customer.business_id == business_id
        )
        
        if from_date:
            query = query.filter(func.date(Sale.fecha_venta) >= from_date)
        if to_date:
            query = query.filter(func.date(Sale.fecha_venta) <= to_date)
        
        results = query.group_by(Customer.id).order_by(func.sum(Sale.total).desc()).all()
        
        return [
            {
                "id": str(r.id),
                "name": r.name,
                "identification": r.identification or "-",
                "email": r.email or "-",
                "phone_number": r.phone_number or "-",
                "total_purchases": r.total_purchases or 0,
                "total_spent": float(r.total_spent) if r.total_spent else 0,
                "last_purchase": r.last_purchase.isoformat() if r.last_purchase else None,
            }
            for r in results
        ]
    
    def get_invoices_report(
        self,
        business_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        sri_status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Obtiene datos de facturas para reportes"""
        query = self.db.query(Invoice).filter(
            Invoice.business_id == business_id
        )
        
        if from_date:
            query = query.filter(func.date(Invoice.issue_date) >= from_date)
        if to_date:
            query = query.filter(func.date(Invoice.issue_date) <= to_date)
        if sri_status:
            query = query.filter(Invoice.sri_status == sri_status)
        
        invoices = query.order_by(Invoice.issue_date.desc()).all()
        
        return [
            {
                "id": str(i.id),
                "invoice_number": i.invoice_number or "-",
                "sequential": i.sequential or "-",
                "issue_date": i.issue_date.isoformat() if i.issue_date else None,
                "customer_name": i.customer_name if hasattr(i, 'customer_name') else "Consumidor Final",
                "customer_identification": i.customer_identification if hasattr(i, 'customer_identification') else "9999999999999",
                "subtotal": float(i.subtotal) if i.subtotal else 0,
                "iva": float(i.iva) if i.iva else 0,
                "total": float(i.total) if i.total else 0,
                "sri_status": i.sri_status or "draft",
                "authorization_number": i.authorization_number,
                "authorization_date": i.authorization_date.isoformat() if i.authorization_date else None,
            }
            for i in invoices
        ]
    
    def get_iva_summary(
        self,
        business_id: UUID,
        year: int,
        month: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Obtiene resumen de IVA para declaración SRI"""
        query = self.db.query(
            extract('year', Sale.fecha_venta).label('year'),
            extract('month', Sale.fecha_venta).label('month'),
            func.count(Sale.id).label('total_sales'),
            func.coalesce(func.sum(Sale.subtotal), 0).label('base_imponible'),
            func.coalesce(func.sum(Sale.iva), 0).label('iva_cobrado'),
            func.coalesce(func.sum(Sale.total), 0).label('total_facturado'),
        ).filter(
            Sale.business_id == business_id,
            Sale.estado == 'completed',
            extract('year', Sale.fecha_venta) == year,
        )
        
        if month:
            query = query.filter(extract('month', Sale.fecha_venta) == month)
        
        results = query.group_by(
            extract('year', Sale.fecha_venta),
            extract('month', Sale.fecha_venta)
        ).order_by('year', 'month').all()
        
        return [
            {
                "year": int(r.year),
                "month": int(r.month),
                "total_sales": r.total_sales,
                "base_imponible": float(r.base_imponible) if r.base_imponible else 0,
                "iva_cobrado": float(r.iva_cobrado) if r.iva_cobrado else 0,
                "total_facturado": float(r.total_facturado) if r.total_facturado else 0,
            }
            for r in results
        ]