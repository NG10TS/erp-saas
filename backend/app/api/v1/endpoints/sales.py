"""
Sales endpoints — corrected to use sale.estado (not sale.status)
and removed calls to non-existent sale.confirm() / complete() / cancel()
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime, date

from app.core.database import get_db
from app.schemas.sale import (
    SaleCreate,
    SaleUpdate,
    SaleResponse,
    SaleListResponse,
    SaleStatusUpdate,
)
from app.services.sale_service import SaleService
from app.services.whatsapp.notification_service import WhatsAppNotificationService
from app.dependencies.auth import (
    get_current_business,
    get_current_user,
    require_seller,
    require_manager,
)
from app.dependencies.business import get_sale
from app.models.business import Business
from app.models.sale import Sale, SaleStatus
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[SaleListResponse])
async def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[SaleStatus] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    customer_id: Optional[UUID] = None,
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """List sales with filters"""
    sale_service = SaleService(db)
    from_dt = datetime.combine(from_date, datetime.min.time()) if from_date else None
    to_dt = datetime.combine(to_date, datetime.max.time()) if to_date else None
    return sale_service.get_by_business(
        business_id=current_business.id,
        current_user=current_user,
        skip=skip,
        limit=limit,
        status=status,
        from_date=from_dt,
        to_date=to_dt,
        customer_id=customer_id,
    )


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_in: SaleCreate,
    background_tasks: BackgroundTasks,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    current_user=Depends(require_seller),
) -> Any:
    """Create new sale"""
    sale_service = SaleService(db)
    sale = sale_service.create(
        business_id=current_business.id,
        user_id=current_user.id,
        sale_in=sale_in,
    )

    if getattr(sale_in, "send_whatsapp", False) and sale.customer and sale.customer.whatsapp_opted_in:
        if current_business.whatsapp_business_phone:
            background_tasks.add_task(
                WhatsAppNotificationService.send_sale_confirmation, sale.id
            )

    return SaleResponse.model_validate(sale)


@router.get("/stats/today")
async def get_today_stats(
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    sale_service = SaleService(db)
    return sale_service.get_daily_summary(
        business_id=current_business.id,
        current_user=current_user,
    )


@router.get("/stats/monthly")
async def get_monthly_stats(
    year: int,
    month: int,
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    sale_service = SaleService(db)
    return sale_service.get_monthly_summary(
        business_id=current_business.id,
        year=year,
        month=month,
        current_user=current_user,
    )


@router.get("/recent/activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    sale_service = SaleService(db)
    return sale_service.get_recent_activity_for_user(
        business_id=current_business.id,
        current_user=current_user,
        limit=limit,
    )


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale_by_id(sale: Sale = Depends(get_sale)) -> Any:
    return sale


@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_in: SaleUpdate,
    sale: Sale = Depends(get_sale),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager),
) -> Any:
    # FIXED: sale.estado (not sale.status)
    if sale.estado in [SaleStatus.COMPLETED, SaleStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede modificar una venta en estado {sale.estado}",
        )
    sale_service = SaleService(db)
    return sale_service.update(sale, sale_in)


@router.post("/{sale_id}/confirm")
async def confirm_sale(
    sale: Sale = Depends(get_sale),
    db: Session = Depends(get_db),
    _: Any = Depends(require_seller),
) -> Any:
    # FIXED: sale.estado instead of sale.status; no sale.confirm() method
    if sale.estado != SaleStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede confirmar una venta en estado {sale.estado}",
        )
    sale_service = SaleService(db)
    sale_service.update_status(
        sale.id, SaleStatusUpdate(estado=SaleStatus.CONFIRMED)
    )
    return {"message": "Venta confirmada"}


@router.post("/{sale_id}/complete")
async def complete_sale(
    sale: Sale = Depends(get_sale),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    _: Any = Depends(require_seller),
) -> Any:
    # FIXED: sale.estado not sale.status; no sale.complete() method
    if sale.estado not in [SaleStatus.CONFIRMED, SaleStatus.PROCESSING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede completar una venta en estado {sale.estado}",
        )
    sale_service = SaleService(db)
    sale_service.update_status(sale.id, SaleStatusUpdate(estado=SaleStatus.COMPLETED))

    from app.tasks.invoice_tasks import create_invoice_from_sale
    if background_tasks:
        background_tasks.add_task(create_invoice_from_sale, str(sale.id))

    return {"message": "Venta completada"}


@router.post("/{sale_id}/cancel")
async def cancel_sale(
    sale: Sale = Depends(get_sale),
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager),
) -> Any:
    # FIXED: sale.estado not sale.status; no sale.cancel() method
    if sale.estado == SaleStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar una venta completada",
        )
    sale_service = SaleService(db)
    sale_service.cancel(sale.id, reason or "Sin motivo especificado")
    return {"message": "Venta cancelada"}


@router.post("/{sale_id}/send-whatsapp")
async def send_sale_whatsapp(
    sale: Sale = Depends(get_sale),
    background_tasks: BackgroundTasks = None,
) -> Any:
    if not sale.customer or not sale.customer.whatsapp_opted_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cliente no tiene WhatsApp activado",
        )
    if background_tasks:
        background_tasks.add_task(
            WhatsAppNotificationService.send_sale_confirmation, sale.id
        )
    return {"message": "Notificación de WhatsApp encolada"}

@router.post("/{sale_id}/process")
async def process_sale(
    sale: Sale = Depends(get_sale),
    db: Session = Depends(get_db),
    _: Any = Depends(require_seller),
) -> Any:
    """Mark sale as processing (CONFIRMED → PROCESSING)"""
    if sale.estado != SaleStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La venta debe estar CONFIRMADA para procesar. Estado actual: {sale.estado.value}"
        )
    
    sale_service = SaleService(db)
    sale_service.update_status(sale.id, SaleStatusUpdate(estado=SaleStatus.PROCESSING))
    
    return {"message": "Venta en procesamiento"}