# app/api/v1/endpoints/dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
import logging

from app.core.database import get_db
from app.dependencies.auth import get_current_business  # ✅ Cambiar import
from app.models.business import Business
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard"])
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_dashboard_stats(
    current_business: Business = Depends(get_current_business),  # ✅ Cambiar dependency
    db: Session = Depends(get_db),
) -> Any:
    """
    Return all dashboard statistics in a single request.
    """
    try:
        service = DashboardService(db)
        stats = service.get_all_stats(current_business.id)  # ✅ usar business.id
        return stats
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")