"""
Endpoints de Reportes - Versión Unificada
"""
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import io
import logging

from app.core.database import get_db
from app.dependencies.auth import get_current_business, get_current_active_user
from app.models.business import Business
from app.models.user import User
from app.services.reports.excel_generator import ExcelReportGenerator
from app.services.reports.pdf_generator import PDFReportGenerator
from app.services.report_service import ReportService
from app.repositories.report_repository import ReportRepository

router = APIRouter(tags=["reportes"])
logger = logging.getLogger(__name__)


@router.get("/sales")
async def download_sales_report(
    format: str = Query("excel", description="Formato: excel o pdf"),
    from_date: Optional[date] = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="Fecha final (YYYY-MM-DD)"),
    status: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Descarga reporte de ventas en Excel o PDF"""
    try:
        repo = ReportRepository(db)
        data = repo.get_sales_report(
            business_id=current_business.id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
        )
        
        filters = {"Desde": from_date, "Hasta": to_date, "Estado": status}
        filename = f"ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format.lower() == "excel":
            gen = ExcelReportGenerator(current_business.business_name)
            file_bytes = gen.generate_sales_report(data, filters)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
        elif format.lower() == "pdf":
            gen = PDFReportGenerator(current_business.business_name)
            file_bytes = gen.generate_sales_report(data, filters)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
            )
        else:
            raise HTTPException(400, "Formato no soportado. Use 'excel' o 'pdf'")
    except Exception as e:
        logger.error(f"Error generando reporte de ventas: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte de ventas")


@router.get("/sales/export")
async def export_sales_excel_alternative(
    start_date: Optional[date] = Query(None, description="Inicio del período (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Fin del período (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Exportar reporte de ventas a Excel (versión simplificada)
    """
    try:
        service = ReportService(db, current_user.business_id)
        xlsx_bytes = service.export_sales_excel(start_date=start_date, end_date=end_date)

        start = start_date or date.today().replace(day=1)
        end = end_date or date.today()
        filename = f"ventas_{start.strftime('%Y%m%d')}_{end.strftime('%Y%m%d')}.xlsx"

        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"Error generando reporte de ventas: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte")


@router.get("/inventory")
async def download_inventory_report(
    format: str = Query("excel", description="Formato: excel o pdf"),
    category_id: Optional[UUID] = None,
    low_stock_only: bool = False,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Descarga reporte de inventario"""
    try:
        repo = ReportRepository(db)
        data = repo.get_inventory_report(
            business_id=current_business.id,
            category_id=category_id,
            low_stock_only=low_stock_only,
        )
        
        filename = f"inventario_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format.lower() == "excel":
            gen = ExcelReportGenerator(current_business.business_name)
            file_bytes = gen.generate_inventory_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
        elif format.lower() == "pdf":
            gen = PDFReportGenerator(current_business.business_name)
            file_bytes = gen.generate_inventory_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
            )
        else:
            raise HTTPException(400, "Formato no soportado. Use 'excel' o 'pdf'")
    except Exception as e:
        logger.error(f"Error generando reporte de inventario: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte de inventario")


@router.get("/inventory/export")
async def export_inventory_csv(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Descargar reporte de inventario como CSV"""
    try:
        service = ReportService(db, current_user.business_id)
        csv_bytes = service.export_inventory_csv()
        filename = f"inventario_{date.today().strftime('%Y%m%d')}.csv"

        return Response(
            content=csv_bytes,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"Error generando reporte de inventario: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte")


@router.get("/customers")
async def download_customers_report(
    format: str = Query("excel", description="Formato: excel o pdf"),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Descarga reporte de clientes"""
    try:
        repo = ReportRepository(db)
        data = repo.get_customers_report(
            business_id=current_business.id,
            from_date=from_date,
            to_date=to_date,
        )
        
        filename = f"clientes_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format.lower() == "excel":
            gen = ExcelReportGenerator(current_business.business_name)
            file_bytes = gen.generate_customers_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
        elif format.lower() == "pdf":
            gen = PDFReportGenerator(current_business.business_name)
            file_bytes = gen.generate_customers_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
            )
        else:
            raise HTTPException(400, "Formato no soportado. Use 'excel' o 'pdf'")
    except Exception as e:
        logger.error(f"Error generando reporte de clientes: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte de clientes")


@router.get("/invoices")
async def download_invoices_report(
    format: str = Query("excel", description="Formato: excel o pdf"),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    sri_status: Optional[str] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Descarga reporte de facturas SRI"""
    try:
        repo = ReportRepository(db)
        data = repo.get_invoices_report(
            business_id=current_business.id,
            from_date=from_date,
            to_date=to_date,
            sri_status=sri_status,
        )
        
        filename = f"facturas_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format.lower() == "excel":
            gen = ExcelReportGenerator(current_business.business_name)
            file_bytes = gen.generate_invoices_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
        elif format.lower() == "pdf":
            gen = PDFReportGenerator(current_business.business_name)
            file_bytes = gen.generate_invoices_report(data)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
            )
        else:
            raise HTTPException(400, "Formato no soportado. Use 'excel' o 'pdf'")
    except Exception as e:
        logger.error(f"Error generando reporte de facturas: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte de facturas")


@router.get("/iva")
async def download_iva_report(
    format: str = Query("excel", description="Formato: excel o pdf"),
    year: int = Query(..., ge=2020, le=2030),
    month: Optional[int] = Query(None, ge=1, le=12),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Descarga resumen de IVA (formato SRI)"""
    try:
        repo = ReportRepository(db)
        data = repo.get_iva_summary(
            business_id=current_business.id,
            year=year,
            month=month,
        )
        
        filename = f"iva_{year}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format.lower() == "excel":
            gen = ExcelReportGenerator(current_business.business_name)
            file_bytes = gen.generate_iva_report(data, year)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
        elif format.lower() == "pdf":
            gen = PDFReportGenerator(current_business.business_name)
            file_bytes = gen.generate_iva_report(data, year)
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
            )
        else:
            raise HTTPException(400, "Formato no soportado. Use 'excel' o 'pdf'")
    except Exception as e:
        logger.error(f"Error generando reporte de IVA: {e}", exc_info=True)
        raise HTTPException(500, "Error al generar el reporte de IVA")