"""
Webhook endpoints for external integrations
"""
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse, JSONResponse
import logging
import hashlib
import hmac
from typing import Optional

from app.core.config import settings
from app.services.whatsapp.webhook_handler import WhatsAppWebhookHandler
from app.core.database import SessionLocal

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    request: Request,
    hub_mode: Optional[str] = None,
    hub_verify_token: Optional[str] = None,
    hub_challenge: Optional[str] = None,
):
    """
    WhatsApp webhook verification (GET)
    """
    # Obtener parámetros de query string directamente
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    logger.info(f"WhatsApp webhook verification - mode: {mode}, token: {token}")
    
    # Si no hay parámetros, responder con un mensaje simple (para pruebas)
    if not mode:
        response = JSONResponse(
            content={"status": "ok", "message": "Webhook endpoint is working"}
        )
        # 🔥 HEADER CRÍTICO PARA NGORK - Esto evita la página de advertencia
        response.headers["ngrok-skip-browser-warning"] = "true"
        return response
    
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        response = PlainTextResponse(content=challenge, status_code=200)
        # 🔥 HEADER CRÍTICO PARA NGORK
        response.headers["ngrok-skip-browser-warning"] = "true"
        return response
    else:
        logger.warning("WhatsApp webhook verification failed")
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def handle_whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle incoming WhatsApp messages (POST)
    """
    # Get signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    
    # Read body
    body = await request.body()
    
    # Verify signature (if app secret is configured)
    if settings.WHATSAPP_APP_SECRET:
        expected = hmac.new(
            settings.WHATSAPP_APP_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(f"sha256={expected}", signature):
            logger.warning("Invalid WhatsApp webhook signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
    
    # Parse payload
    try:
        import json
        payload = json.loads(body)
    except:
        logger.error("Failed to parse webhook payload")
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Process in background
    background_tasks.add_task(process_whatsapp_webhook, payload)
    
    response = JSONResponse(content={"status": "ok"})
    # 🔥 HEADER CRÍTICO PARA NGORK
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response


async def process_whatsapp_webhook(payload: dict):
    """
    Process WhatsApp webhook payload
    """
    db = SessionLocal()
    try:
        handler = WhatsAppWebhookHandler(db)
        await handler.process_payload(payload)
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
    finally:
        db.close()


@router.post("/sri/authorization")
async def handle_sri_authorization(request: Request):
    """
    Handle SRI authorization callback (if SRI supports webhooks)
    """
    pass


@router.post("/payment/{provider}")
async def handle_payment_webhook(
    provider: str,
    request: Request
):
    """
    Handle payment provider webhooks (Kushki, Payphone, etc.)
    """
    body = await request.body()
    logger.info(f"Received payment webhook from {provider}")
    
    response = JSONResponse(content={"status": "ok"})
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response