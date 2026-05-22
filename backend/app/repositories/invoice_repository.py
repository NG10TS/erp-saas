"""
Invoice repository — corrected field names + all missing methods added
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.invoice import Invoice
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository):
    """Repository for Invoice model"""

    def __init__(self, db: Session):
        super().__init__(Invoice, db)

    # ── Queries ───────────────────────────────────────────────────────────────

    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        from_date: Optional[str] = None,  # alias usado por invoices.py endpoint
        to_date: Optional[str] = None,    # alias
        search: Optional[str] = None,
    ) -> List[Invoice]:
        """Get invoices by business with filters"""
        query = self.db.query(Invoice).filter(Invoice.business_id == business_id)

        # Corregido: sri_status (no "status")
        if status:
            query = query.filter(Invoice.sri_status == status)

        if customer_id:
            query = query.filter(Invoice.customer_id == customer_id)

        # Acepta ambos nombres de parámetro de fecha
        date_from = from_date or start_date
        date_to = to_date or end_date

        if date_from:
            query = query.filter(Invoice.issue_date >= date_from)
        if date_to:
            query = query.filter(Invoice.issue_date <= date_to)

        # Corregido: busca solo en invoice_number (no en columnas inexistentes)
        if search:
            query = query.filter(Invoice.invoice_number.ilike(f"%{search}%"))

        return query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()

    def count_by_business(
        self,
        business_id: UUID,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        """Count invoices matching the same filters (for pagination)"""
        query = self.db.query(func.count(Invoice.id)).filter(
            Invoice.business_id == business_id
        )
        if status:
            query = query.filter(Invoice.sri_status == status)
        if customer_id:
            query = query.filter(Invoice.customer_id == customer_id)
        if start_date:
            query = query.filter(Invoice.issue_date >= start_date)
        if end_date:
            query = query.filter(Invoice.issue_date <= end_date)
        if search:
            query = query.filter(Invoice.invoice_number.ilike(f"%{search}%"))
        return query.scalar() or 0

    def get_by_sale(self, sale_id: UUID) -> Optional[Invoice]:
        """Get invoice linked to a specific sale (prevents duplicates)"""
        return (
            self.db.query(Invoice)
            .filter(Invoice.sale_id == sale_id)
            .first()
        )

    def get_by_invoice_number(self, business_id: UUID, invoice_number: str) -> Optional[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.business_id == business_id,
                Invoice.invoice_number == invoice_number,
            )
            .first()
        )

    def get_pending_sri(self, cutoff: Optional[datetime] = None) -> List[Invoice]:
        """
        Invoices in SENT state that haven't been authorized yet.
        Used by Celery beat to retry authorisation checks.
        """
        query = self.db.query(Invoice).filter(
            Invoice.sri_status.in_(["SENT", "PENDING"]),
            Invoice.sri_attempts < 10,
        )
        if cutoff:
            query = query.filter(Invoice.created_at <= cutoff)
        return query.order_by(Invoice.created_at.asc()).all()

    def get_failed_invoices(self, cutoff: Optional[datetime] = None) -> List[Invoice]:
        """Invoices in REJECTED state within the cutoff window"""
        query = self.db.query(Invoice).filter(
            Invoice.sri_status == "REJECTED",
            Invoice.sri_attempts < 10,
        )
        if cutoff:
            query = query.filter(Invoice.created_at >= cutoff)
        return query.order_by(Invoice.created_at.asc()).all()

    def get_with_relations(self, invoice_id: UUID) -> Optional[Invoice]:
        """Load invoice with business, customer and details eagerly"""
        from sqlalchemy.orm import joinedload
        return (
            self.db.query(Invoice)
            .options(
                joinedload(Invoice.business),
                joinedload(Invoice.customer),
                joinedload(Invoice.details),
            )
            .filter(Invoice.id == invoice_id)
            .first()
        )

    def get_daily_totals(self, business_id: UUID, date_str: str) -> dict:

        """Revenue totals for a specific date — uses correct column names"""
        result = (
            self.db.query(
                func.count(Invoice.id).label("total_invoices"),
                func.sum(Invoice.total).label("total_amount"),   # corregido: era total_amount
                func.sum(Invoice.iva).label("total_tax"),        # corregido: era tax_amount
            )
            .filter(
                Invoice.business_id == business_id,
                func.date(Invoice.issue_date) == date_str,
                Invoice.sri_status == "AUTHORIZED",
            )
            .first()
        )
        return {
            "total_invoices": result.total_invoices or 0,
            "total_amount": float(result.total_amount or 0),
            "total_tax": float(result.total_tax or 0),
        }
    
    # Agregar estos métodos a tu InvoiceRepository existente

    def get_next_sequential(self, business_id: UUID, estab: str = "001", pto_emi: str = "001") -> str:
        """Genera el próximo número secuencial para factura"""
        from sqlalchemy import func
        
        # Obtener último secuencial
        last_invoice = self.db.query(Invoice).filter(
            Invoice.business_id == business_id,
            Invoice.sequential.like(f"{estab}-{pto_emi}-%")
        ).order_by(Invoice.created_at.desc()).first()
        
        if last_invoice:
            # Extraer número y sumar 1
            parts = last_invoice.sequential.split("-")
            last_num = int(parts[2])
            next_num = last_num + 1
        else:
            next_num = 1
        
        # Formatear a 9 dígitos
        sequential_num = str(next_num).zfill(9)
        return f"{estab}-{pto_emi}-{sequential_num}"
    
    def check_sequential_available(self, business_id: UUID, sequential: str) -> bool:
        """Verifica si un secuencial ya fue usado"""
        return self.db.query(Invoice).filter(
            Invoice.business_id == business_id,
            Invoice.sequential == sequential
        ).first() is None