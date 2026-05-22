# app/api/v1/endpoints/payments.py - CREAR

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Any
import logging

from app.core.database import get_db
from app.core.config import settings
from app.dependencies.auth import get_current_business, get_current_user
from app.models.business import Business
from app.models.user import User
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


# Planes de precios en Stripe (debes crear estos productos en tu dashboard de Stripe)
# Formato: "price_xxxx" - estos IDs los obtienes de Stripe después de crear los productos
PRICE_IDS = {
    "micro": "price_micro_monthly",      # $19/mes
    "startup": "price_startup_monthly",  # $49/mes
    "business": "price_business_monthly", # $99/mes
    "enterprise": "price_enterprise_monthly", # $249/mes
}


@router.post("/create-checkout-session/{plan_name}")
async def create_checkout_session(
    plan_name: str,
    request: Request,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """
    Crear una sesión de checkout de Stripe para suscripción.
    
    Args:
        plan_name: Nombre del plan (micro, startup, business, enterprise)
    """
    if plan_name not in PRICE_IDS:
        raise HTTPException(400, f"Plan no válido. Opciones: {list(PRICE_IDS.keys())}")
    
    if not settings.STRIPE_CONFIGURED:
        raise HTTPException(500, "Stripe no está configurado")
    
    payment_service = PaymentService(db)
    
    # URLs de éxito y cancelación
    success_url = f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{settings.FRONTEND_URL}/payment/cancel"
    
    try:
        result = payment_service.create_checkout_session(
            business_id=current_business.id,
            price_id=PRICE_IDS[plan_name],
            success_url=success_url,
            cancel_url=cancel_url,
        )
        
        return {
            "checkout_url": result["checkout_url"],
            "session_id": result["session_id"],
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> Any:
    """
    Webhook de Stripe para eventos de pago.
    Esta ruta debe ser pública (sin autenticación).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(400, "Missing stripe-signature header")
    
    payment_service = PaymentService(db)
    
    try:
        result = payment_service.handle_webhook(payload, sig_header)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/subscription/status")
async def get_subscription_status(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Obtener el estado de la suscripción actual"""
    from app.models.subscription import Subscription
    
    subscription = db.query(Subscription).filter(
        Subscription.business_id == current_business.id
    ).first()
    
    if not subscription:
        return {
            "has_subscription": False,
            "status": "none",
            "message": "No hay suscripción activa",
        }
    
    return {
        "has_subscription": True,
        "status": subscription.status,
        "plan_name": subscription.plan_name,
        "current_period_end": subscription.current_period_end,
        "cancel_at_period_end": subscription.cancel_at_period_end,
    }


@router.post("/subscription/cancel")
async def cancel_subscription(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Cancelar la suscripción al final del período actual"""
    from app.models.subscription import Subscription
    
    subscription = db.query(Subscription).filter(
        Subscription.business_id == current_business.id
    ).first()
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(400, "No hay suscripción activa")
    
    if not settings.STRIPE_CONFIGURED:
        raise HTTPException(500, "Stripe no está configurado")
    
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Cancelar al final del período
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        
        subscription.cancel_at_period_end = True
        db.commit()
        
        return {"message": "Suscripción cancelada. Seguirá activa hasta el fin del período."}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(400, str(e))