"""
Invoice Service — corrected field name mismatches + missing methods added.

Fixes:
  - _build_invoice_record: sale.descuento → sale.descuento, sale.metodo_pago exists
  - _build_details: item.unit_price/quantity/discount → precio_unitario/cantidad/descuento
  - Added generate_invoice_number(), create_from_sale(), get_monthly_summary(), get_pending_sri()
  - Added get_by_business() method that the invoices endpoint expects
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
import logging
import secrets

from app.models.invoice import Invoice, InvoiceDetail
from app.models.sale import Sale, SaleItem
from app.models.business import Business
from app.models.customer import Customer
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.business_repository import BusinessRepository
from app.repositories.sale_repository import SaleRepository
from app.services.sri.sri_service import SRIService
from app.services.sri.xml_generator import SRIXMLGenerator
from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class InvoiceService:
    """Full invoice lifecycle management"""

    def __init__(self, db: Session):
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.business_repo = BusinessRepository(db)
        self.sale_repo = SaleRepository(db)
        self.sri_service = SRIService(db)
        self.xml_generator = SRIXMLGenerator()

    # ── Public: number generation ─────────────────────────────────────────────

    def generate_invoice_number(self, business_id: UUID) -> str:
        """
        Generate the next sequential invoice identifier.
        Format: 001-001-XXXXXXXXX
        This is the SEQUENTIAL (not the 49-digit access key).
        """
        return self._next_sequential(business_id)

    # ── Public: create ────────────────────────────────────────────────────────

    async def create_invoice_from_sale(
        self, sale_id: UUID, business_id: UUID
    ) -> Invoice:
        """Create + process invoice through SRI pipeline."""
        sale = self.sale_repo.get(sale_id)
        if not sale or str(sale.business_id) != str(business_id):
            raise ValidationError("Venta no encontrada")

        existing = self.invoice_repo.get_by_sale(sale_id)
        if existing:
            return existing

        business = self.business_repo.get(business_id)
        if not business:
            raise ValidationError("Negocio no encontrado")

        if not business.sri_has_digital_certificate:
            raise ValidationError(
                "No hay certificado digital configurado. "
                "Ve a Configuración → SRI para subir tu certificado .p12"
            )

        invoice = self._build_invoice_record(sale, business)
        self.db.add(invoice)
        self.db.flush()

        for detail in self._build_details(invoice, sale):
            self.db.add(detail)

        self.db.commit()
        self.db.refresh(invoice)

        try:
            await self.sri_service.process_invoice(invoice.id)
        except Exception as e:
            logger.error(f"SRI processing failed for {invoice.id}: {e}")
            invoice.sri_status = "PENDING"
            invoice.sri_error = str(e)
            self.db.commit()

        self.db.refresh(invoice)
        return invoice

    def create_from_sale(
        self,
        business_id: UUID,
        sale_id: UUID,
        invoice_number: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Invoice:
        """
        Synchronous shortcut used by the invoice endpoint and Celery task.
        Creates the Invoice record without triggering SRI immediately.
        SRI is handled by the background task process_invoice().
        """
        sale = self.sale_repo.get(sale_id)
        if not sale or str(sale.business_id) != str(business_id):
            raise ValidationError("Venta no encontrada")

        existing = self.invoice_repo.get_by_sale(sale_id)
        if existing:
            return existing

        business = self.business_repo.get(business_id)
        if not business:
            raise ValidationError("Negocio no encontrado")

        invoice = self._build_invoice_record(sale, business)
        if notes:
            invoice.notes = notes

        self.db.add(invoice)
        self.db.flush()

        for detail in self._build_details(invoice, sale):
            self.db.add(detail)

        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    # ── Public: retry ─────────────────────────────────────────────────────────

    async def retry_invoice(self, invoice_id: UUID, business_id: UUID) -> Invoice:
        invoice = self.invoice_repo.get(invoice_id)
        if not invoice or str(invoice.business_id) != str(business_id):
            raise ValidationError("Factura no encontrada")

        if invoice.sri_status == "AUTHORIZED":
            raise ValidationError("La factura ya está autorizada")

        if invoice.sri_attempts >= 10:
            raise ValidationError("Límite de reintentos alcanzado (10)")

        await self.sri_service.process_invoice(invoice.id)
        self.db.refresh(invoice)
        return invoice

    # ── Public: queries ───────────────────────────────────────────────────────

    def get_invoice(self, invoice_id: UUID, business_id: UUID) -> Optional[Invoice]:
        invoice = self.invoice_repo.get(invoice_id)
        if invoice and str(invoice.business_id) == str(business_id):
            return invoice
        return None

    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        from_date=None,
        to_date=None,
        start_date=None,
        end_date=None,
        search: Optional[str] = None,
    ) -> List[Invoice]:
        """Used by the invoices list endpoint."""
        return self.invoice_repo.get_by_business(
            business_id=business_id,
            skip=skip,
            limit=limit,
            status=status,
            customer_id=customer_id,
            from_date=str(from_date) if from_date else None,
            to_date=str(to_date) if to_date else None,
            start_date=str(start_date) if start_date else None,
            end_date=str(end_date) if end_date else None,
            search=search,
        )

    def list_invoices(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        items = self.invoice_repo.get_by_business(
            business_id=business_id,
            skip=skip,
            limit=limit,
            status=status,
            customer_id=customer_id,
            start_date=str(start_date) if start_date else None,
            end_date=str(end_date) if end_date else None,
            search=search,
        )
        total = self.invoice_repo.count_by_business(
            business_id=business_id,
            status=status,
            customer_id=customer_id,
            start_date=str(start_date) if start_date else None,
            end_date=str(end_date) if end_date else None,
            search=search,
        )
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    def get_pending_invoices(self, business_id: UUID) -> List[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.business_id == business_id,
                Invoice.sri_status.in_(["PENDING", "SENT"]),
                Invoice.sri_attempts < 10,
            )
            .order_by(Invoice.created_at.asc())
            .all()
        )

    def get_pending_sri(self, business_id: UUID) -> List[Invoice]:
        """Alias used by the invoices endpoint."""
        return self.get_pending_invoices(business_id)

    def get_monthly_summary(
        self, business_id: UUID, year: int, month: int
    ) -> Dict[str, Any]:
        """Used by the monthly stats endpoint."""
        result = (
            self.db.query(
                func.count(Invoice.id).label("total"),
                func.coalesce(func.sum(Invoice.total), 0).label("amount"),
            )
            .filter(
                Invoice.business_id == business_id,
                extract("year", Invoice.issue_date) == year,
                extract("month", Invoice.issue_date) == month,
            )
            .first()
        )

        by_status = (
            self.db.query(Invoice.sri_status, func.count(Invoice.id))
            .filter(
                Invoice.business_id == business_id,
                extract("year", Invoice.issue_date) == year,
                extract("month", Invoice.issue_date) == month,
            )
            .group_by(Invoice.sri_status)
            .all()
        )

        status_counts = {row[0]: row[1] for row in by_status}

        return {
            "total":      result.total or 0,
            "amount":     float(result.amount or 0),
            "authorized": status_counts.get("AUTHORIZED", 0),
            "rejected":   status_counts.get("REJECTED", 0),
            "pending":    status_counts.get("PENDING", 0),
            "year":       year,
            "month":      month,
        }

    def get_summary_stats(self, business_id: UUID, month: int, year: int) -> Dict:
        return self.get_monthly_summary(business_id, year, month)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_invoice_record(self, sale: Sale, business: Business) -> Invoice:
        sequential = self._next_sequential(business.id)
        access_key = self._generate_access_key(
            issue_date=datetime.utcnow(),
            business=business,
            sequential=sequential,
        )
        subtotal, iva_amount, total = self._calc_totals(sale)

        return Invoice(
            business_id=business.id,
            customer_id=sale.customer_id,
            sale_id=sale.id,                             # FK correctly set
            invoice_number=access_key,
            sequential=sequential,
            issue_date=datetime.utcnow(),
            subtotal=subtotal,
            subtotal_iva=subtotal,
            iva=iva_amount,
            total=total,
            discount=sale.descuento or Decimal("0"),     # FIXED: was sale.discount
            payment_method=self._map_payment_method(     # FIXED: sale.metodo_pago
                sale.metodo_pago.value if sale.metodo_pago else "cash"
            ),
            sri_status="PENDING",
            sri_attempts=0,
        )

    def _build_details(self, invoice: Invoice, sale: Sale) -> List[InvoiceDetail]:
        details = []
        issue_date = (
            invoice.issue_date.date()
            if isinstance(invoice.issue_date, datetime)
            else invoice.issue_date
        )
        _cod, iva_pct_code, iva_tarifa_str = SRIXMLGenerator.get_iva_code(issue_date)
        iva_tarifa = Decimal(iva_tarifa_str)

        for item in sale.items:
            # FIXED: use Spanish field names that exist on SaleItem
            precio = Decimal(str(item.precio_unitario))        # FIXED: was unit_price
            cantidad = item.cantidad                           # FIXED: was quantity
            descuento = Decimal(str(item.descuento or 0))     # FIXED: was discount
            base = precio * cantidad - descuento
            iva_amount = (base * iva_tarifa / 100).quantize(Decimal("0.01"))

            detail = InvoiceDetail(
                invoice_id=invoice.id,
                product_id=item.product_id,
                product_name=item.nombre_producto,            # FIXED: was product_name
                product_sku=item.sku_producto or "",          # FIXED: was product_sku
                quantity=cantidad,
                unit_price=precio,
                discount=descuento,
                total_price=base,
                iva_percentage=iva_tarifa,
                iva_code=iva_pct_code,
                iva_amount=iva_amount,
            )
            details.append(detail)

        return details

    def _calc_totals(self, sale: Sale):
        issue_date = date.today()
        _cod, _pct_code, iva_tarifa_str = SRIXMLGenerator.get_iva_code(issue_date)
        iva_tarifa = Decimal(iva_tarifa_str) / 100

        subtotal = Decimal("0")
        iva_amount = Decimal("0")

        for item in sale.items:
            # FIXED: Spanish field names
            precio = Decimal(str(item.precio_unitario))
            cantidad = item.cantidad
            desc = Decimal(str(item.descuento or 0))
            net = precio * cantidad - desc
            subtotal += net
            iva_amount += net * iva_tarifa

        total = subtotal + iva_amount
        return (
            subtotal.quantize(Decimal("0.01")),
            iva_amount.quantize(Decimal("0.01")),
            total.quantize(Decimal("0.01")),
        )

    def _next_sequential(self, business_id: UUID) -> str:
        last = (
            self.db.query(Invoice)
            .filter(Invoice.business_id == business_id)
            .order_by(Invoice.created_at.desc())
            .first()
        )
        if last and last.sequential:
            try:
                parts = last.sequential.split("-")
                next_num = int(parts[2]) + 1
                return f"001-001-{next_num:09d}"
            except (IndexError, ValueError):
                pass
        return "001-001-000000001"

    def _generate_access_key(
        self, issue_date: datetime, business: Business, sequential: str
    ) -> str:
        parts = sequential.split("-")
        estab = parts[0] if len(parts) >= 1 else "001"
        pto_emi = parts[1] if len(parts) >= 2 else "001"
        sec = parts[2] if len(parts) >= 3 else "000000001"

        fecha = issue_date.strftime("%d%m%Y")
        cod_doc = "01"
        ruc = business.ruc.ljust(13, "0")[:13]
        ambiente = business.sri_environment or "1"
        codigo_num = str(int(secrets.token_hex(4), 16) % 99999999).zfill(8)

        key_without_check = (
            fecha + cod_doc + ruc + ambiente
            + estab + pto_emi + sec
            + "1"
            + codigo_num
        )
        digito = self._calc_verification_digit(key_without_check)
        return key_without_check + str(digito)

    @staticmethod
    def _calc_verification_digit(key: str) -> int:
        """Módulo 11 per SRI spec. Coefficients cycle 2-7."""
        coefficients = [2, 3, 4, 5, 6, 7]
        total = sum(
            int(c) * coefficients[i % 6] for i, c in enumerate(reversed(key))
        )
        remainder = 11 - (total % 11)
        if remainder == 11:
            return 0
        if remainder == 10:
            return 1
        return remainder

    @staticmethod
    def _map_payment_method(method: Optional[str]) -> str:
        mapping = {
            "cash": "01", "efectivo": "01",
            "card": "16", "tarjeta": "16",
            "transfer": "17", "transferencia": "17",
            "check": "21", "cheque": "21",
        }
        return mapping.get((method or "").lower(), "01")