"""
Invoice endpoints — corrected to call methods that actually exist in InvoiceService
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

from app.core.database import get_db
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceListResponse,
    SriStatusResponse,
)
from app.services.invoice_service import InvoiceService
from app.dependencies.auth import get_current_user, get_current_active_user, get_current_business, require_manager 
from app.models.business import Business
from app.dependencies.business import get_invoice
from app.models.invoice import Invoice
from app.models.user import User

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS PARA NOTA DE CRÉDITO (definidos antes de usarse)
# ─────────────────────────────────────────────────────────────────────────────

class CreditNoteItemCreate(BaseModel):
    """Schema para ítem de nota de crédito"""
    product_sku: Optional[str] = ""
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    discount: Optional[Decimal] = 0
    total_price: Decimal
    iva_percentage: Optional[Decimal] = 15
    iva_amount: Optional[Decimal] = 0


class CreditNoteCreate(BaseModel):
    """Schema para crear nota de crédito"""
    sequential: str  # 001-001-000000001
    tipo_nota: str = "01"  # 01=Anulación, 02=Devolución, 03=Descuento, 04=Bonificación
    motivo: str
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    items: List[CreditNoteItemCreate]


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[InvoiceListResponse])
async def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Lista facturas del negocio con filtros opcionales"""
    invoice_service = InvoiceService(db)
    from_dt = datetime.combine(from_date, datetime.min.time()) if from_date else None
    to_dt = datetime.combine(to_date, datetime.max.time()) if to_date else None
    
    return invoice_service.get_by_business(
        business_id=current_business.id,
        skip=skip,
        limit=limit,
        status=status,
        from_date=from_dt,
        to_date=to_dt,
    )


@router.post("/from-sale", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_sale(
    invoice_in: InvoiceCreate,
    background_tasks: BackgroundTasks,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager),
) -> Any:
    """Crea factura desde una venta y la encola para procesamiento SRI"""
    if (current_business.max_invoices_monthly and
            current_business.current_invoices_month >= current_business.max_invoices_monthly):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Límite mensual de facturas alcanzado",
        )

    invoice_service = InvoiceService(db)
    invoice = invoice_service.create_from_sale(
        business_id=current_business.id,
        sale_id=invoice_in.sale_id,
        notes=getattr(invoice_in, "notes", None),
    )

    from app.tasks.invoice_tasks import process_invoice
    background_tasks.add_task(process_invoice, str(invoice.id))

    current_business.current_invoices_month += 1
    db.commit()

    return invoice


@router.get("/stats/monthly")
async def get_monthly_stats(
    year: int,
    month: int,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Obtiene estadísticas mensuales de facturación"""
    invoice_service = InvoiceService(db)
    return invoice_service.get_monthly_summary(
        business_id=current_business.id, year=year, month=month
    )


@router.get("/pending/sri")
async def get_pending_sri_invoices(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Lista facturas pendientes de envío al SRI"""
    invoice_service = InvoiceService(db)
    pending = invoice_service.get_pending_sri(current_business.id)
    return {
        "count": len(pending),
        "invoices": [
            {
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
                "attempts": inv.sri_attempts,
            }
            for inv in pending
        ],
    }


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice: Invoice = Depends(get_invoice)) -> Any:
    """Obtiene detalle de una factura"""
    return invoice


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(invoice: Invoice = Depends(get_invoice)) -> Any:
    """Obtiene URL del PDF de la factura"""
    if not invoice.pdf_url:
        raise HTTPException(status_code=404, detail="PDF aún no generado")
    return {"pdf_url": invoice.pdf_url}


@router.get("/{invoice_id}/xml")
async def get_invoice_xml(invoice: Invoice = Depends(get_invoice)) -> Any:
    """Obtiene XML de la factura (autorizado si existe, sino firmado)"""
    xml_content = invoice.xml_authorized if invoice.sri_status == "AUTHORIZED" else invoice.xml_signed
    if not xml_content:
        raise HTTPException(status_code=404, detail="XML no disponible")
    return {"xml": xml_content}


@router.get("/{invoice_id}/sri-status", response_model=SriStatusResponse)
async def check_sri_status(invoice: Invoice = Depends(get_invoice)) -> Any:
    """Consulta el estado SRI de la factura"""
    return {
        "status": invoice.sri_status,
        "authorization_number": invoice.invoice_number if invoice.sri_status == "AUTHORIZED" else None,
        "authorization_date": invoice.authorization_date,
        "errors": invoice.sri_response.get("errors") if invoice.sri_response else None,
    }


@router.post("/{invoice_id}/retry-sri")
async def retry_sri_submission(
    invoice: Invoice = Depends(get_invoice),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager),
) -> Any:
    """Reintenta envío al SRI de una factura fallida"""
    if invoice.sri_status == "AUTHORIZED":
        raise HTTPException(status_code=400, detail="Factura ya autorizada")

    invoice.sri_status = "PENDING"
    invoice.sri_attempts = 0
    db.commit()

    from app.tasks.invoice_tasks import process_invoice
    if background_tasks:
        background_tasks.add_task(process_invoice, str(invoice.id))

    return {"message": "Reintento encolado"}


@router.post("/{invoice_id}/send-whatsapp")
async def send_invoice_whatsapp(
    invoice: Invoice = Depends(get_invoice),
    background_tasks: BackgroundTasks = None,
    _: Any = Depends(require_manager),
) -> Any:
    """Envía factura por WhatsApp al cliente"""
    if not invoice.pdf_url:
        raise HTTPException(status_code=400, detail="PDF aún no generado")
    if not invoice.customer or not invoice.customer.whatsapp_opted_in:
        raise HTTPException(status_code=400, detail="El cliente no tiene WhatsApp activado")

    from app.tasks.notification_tasks import send_invoice_whatsapp as task
    if background_tasks:
        background_tasks.add_task(task, str(invoice.id))

    return {"message": "Notificación de WhatsApp encolada"}


@router.post("/{invoice_id}/credit-note", response_model=dict)
async def create_credit_note(
    invoice_id: UUID,
    data: CreditNoteCreate,
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Crea una Nota de Crédito para anular/corregir una factura.
    
    Tipos de nota:
    - 01: Anulación
    - 02: Devolución
    - 03: Descuento
    - 04: Bonificación
    """
    from app.services.sri.nota_credito_xml import NotaCreditoXMLGenerator
    from app.services.sri.sri_service import SRIService
    from app.models.credit_note import CreditNote, CreditNoteDetail
    
    # Verificar que la factura existe y pertenece al negocio
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.business_id == current_business.id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if invoice.sri_status != "authorized":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden crear notas de crédito para facturas autorizadas"
        )
    
    # Crear nota de crédito
    credit_note = CreditNote(
        business_id=current_business.id,
        invoice_id=invoice_id,
        sequential=data.sequential,
        tipo_nota=data.tipo_nota,
        motivo=data.motivo,
        subtotal=data.subtotal,
        iva=data.iva,
        total=data.total,
        issue_date=datetime.utcnow(),
        created_by=current_user.id,
    )
    db.add(credit_note)
    db.flush()
    
    # Crear detalles
    for item in data.items:
        detail = CreditNoteDetail(
            credit_note_id=credit_note.id,
            product_sku=item.product_sku,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount or 0,
            total_price=item.total_price,
            iva_percentage=item.iva_percentage or 15,
            iva_amount=item.iva_amount or 0,
        )
        db.add(detail)
    
    db.commit()
    db.refresh(credit_note)
    
    # Procesar con SRI
    sri_service = SRIService(db)
    result = await sri_service.process_credit_note(credit_note.id)
    
    return {
        "id": str(credit_note.id),
        "sequential": credit_note.sequential,
        "sri_status": credit_note.sri_status,
        "result": result
    }