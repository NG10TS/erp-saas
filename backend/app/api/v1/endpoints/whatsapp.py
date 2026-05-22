from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
import httpx
from app.core.database import get_db
from app.core.config import settings
from app.dependencies.auth import require_manager, require_seller
from app.dependencies.tenant import get_current_business
from app.models.business import Business
from app.services.whatsapp.whatsapp_service import WhatsAppService
from app.schemas.whatsapp import (
    WhatsAppMessageCreate,
    WhatsAppMessageResponse,
    WhatsAppTemplateCreate,
    WhatsAppTemplateResponse,
    SendMessageRequest,
    SendTemplateRequest,
)

router = APIRouter()

@router.post("/send-raw")
async def send_raw_message(
    to: str,
    text: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Endpoint simple sin validación de respuesta - PARA PRUEBAS"""
    whatsapp_service = WhatsAppService(db, current_business.id)
    result = await whatsapp_service.send_message(to=to, message=text)
    return result

# ============================================
# REST OF YOUR EXISTING ENDPOINTS
# ============================================

@router.get("/conversations")
async def list_conversations(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """List active WhatsApp conversations for the current business."""
    whatsapp_service = WhatsAppService(db, current_business.id)
    conversations = whatsapp_service.list_conversations(limit=50)
    return conversations

# ✅ SEGURO
@router.get("/debug-token")
async def debug_token():
    """Solo disponible en desarrollo"""
    if settings.ENVIRONMENT != "development":
        raise HTTPException(status_code=404)
    token = settings.WHATSAPP_ACCESS_TOKEN
    return {
        "token_exists": bool(token),
        "token_length": len(token) if token else 0,
        "api_version": settings.WHATSAPP_API_VERSION,
        "phone_number_id": settings.WHATSAPP_PHONE_NUMBER_ID
    }

@router.get("/messages", response_model=List[WhatsAppMessageResponse])
async def list_messages(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[UUID] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """List WhatsApp messages for the current business."""
    whatsapp_service = WhatsAppService(db, current_business.id)
    
    if customer_id:
        messages = whatsapp_service.get_conversation_history_by_customer(
            customer_id=customer_id,
            limit=limit
        )
    else:
        messages = whatsapp_service.get_conversation_history(
            phone_number=None,
            limit=limit
        )
    
    return messages


@router.post("/messages/send")
async def send_message(
    message_in: SendMessageRequest,
    background_tasks: BackgroundTasks,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_seller)
) -> Any:
    """Send WhatsApp message."""
    if not current_business.whatsapp_business_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WhatsApp not configured for this business"
        )
    
    whatsapp_service = WhatsAppService(db, current_business.id)
    
    # Enviar mensaje
    result = await whatsapp_service.send_message(
        to=message_in.to,
        message=message_in.text
    )
    
    # Devolver respuesta que coincida con el schema
    return {
        "success": True,
        "phone": message_in.to,
        "message_id": result.get("messages", [{}])[0].get("id"),
        "status": "sent"
    }

@router.post("/messages/template", response_model=WhatsAppMessageResponse)
async def send_template(
    template_in: SendTemplateRequest,
    background_tasks: BackgroundTasks,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_seller)
) -> Any:
    """Send WhatsApp template message."""
    whatsapp_service = WhatsAppService(db, current_business.id)
    
    background_tasks.add_task(
        whatsapp_service.send_template,
        to=template_in.to,
        template_name=template_in.template_name,
        language=template_in.language,
        components=template_in.components
    )
    
    return {"message": "Template message queued"}


@router.get("/templates", response_model=List[WhatsAppTemplateResponse])
async def list_templates(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """List WhatsApp templates for the current business."""
    from app.services.whatsapp.template_service import TemplateService
    
    template_service = TemplateService(db)
    templates = template_service.get_templates(current_business.id)
    return templates


@router.get("/stats")
async def get_whatsapp_stats(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """Get WhatsApp usage statistics."""
    from sqlalchemy import func, and_
    from app.models.whatsapp_message import WhatsAppMessage
    from datetime import datetime, timedelta
    
    whatsapp_service = WhatsAppService(db, current_business.id)
    
    total_messages = db.query(func.count(WhatsAppMessage.id)).filter(
        WhatsAppMessage.business_id == current_business.id
    ).scalar() or 0
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_messages = db.query(func.count(WhatsAppMessage.id)).filter(
        and_(
            WhatsAppMessage.business_id == current_business.id,
            WhatsAppMessage.received_at >= thirty_days_ago
        )
    ).scalar() or 0
    
    total_conversations = len(whatsapp_service.list_conversations(limit=1000))
    
    return {
        "total_messages": total_messages,
        "recent_messages": recent_messages,
        "total_conversations": total_conversations,
        "whatsapp_configured": bool(current_business.whatsapp_business_phone),
        "last_activity": None,
    }


@router.post("/webhook/test")
async def test_webhook(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_manager)
) -> Any:
    """Test WhatsApp webhook configuration."""
    return {
        "success": True,
        "message": "Webhook test endpoint ready"
    }


@router.get("/status")
async def get_whatsapp_status(
    current_business: Business = Depends(get_current_business),
) -> Any:
    """Verificar estado de conexión con WhatsApp"""
    return {
        "status": "configured" if current_business.whatsapp_business_phone else "not_configured",
        "phone_number_id": current_business.whatsapp_business_phone,
        "webhook_verified": current_business.whatsapp_webhook_verified
    }