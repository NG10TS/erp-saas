# app/services/payment_service.py - CREAR

import stripe
import logging
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.business import Business
from app.models.subscription import Subscription

logger = logging.getLogger(__name__)

# Configurar Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    """Servicio para manejar pagos con Stripe"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_checkout_session(
        self,
        business_id: UUID,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> Dict[str, Any]:
        """
        Crear una sesión de checkout de Stripe.
        
        Args:
            business_id: ID del negocio
            price_id: ID del precio en Stripe (ej: 'price_xxxx')
            success_url: URL a donde redirigir tras pago exitoso
            cancel_url: URL a donde redirigir si cancela
        """
        try:
            # Obtener o crear customer en Stripe
            business = self.db.query(Business).filter(Business.id == business_id).first()
            
            # Buscar subscription existente
            subscription = self.db.query(Subscription).filter(
                Subscription.business_id == business_id
            ).first()
            
            customer_id = None
            if subscription and subscription.stripe_customer_id:
                customer_id = subscription.stripe_customer_id
            
            # Crear la sesión de checkout
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "business_id": str(business_id),
                    "business_email": business.email,
                },
            )
            
            logger.info(f"Checkout session created for business {business_id}: {checkout_session.id}")
            return {
                "session_id": checkout_session.id,
                "checkout_url": checkout_session.url,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(f"Error creating checkout session: {e.user_message}")
    
    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Manejar webhook de Stripe.
        Verifica la firma y procesa el evento.
        """
        try:
            # Verificar firma del webhook
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise ValueError("Invalid signature")
        
        # Procesar según tipo de evento
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        if event_type == "checkout.session.completed":
            return self._handle_checkout_completed(event_data)
        elif event_type == "customer.subscription.updated":
            return self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            return self._handle_subscription_deleted(event_data)
        
        logger.info(f"Unhandled event type: {event_type}")
        return {"status": "unhandled", "event_type": event_type}
    
    def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar checkout.session.completed"""
        metadata = session.get("metadata", {})
        business_id = metadata.get("business_id")
        
        if not business_id:
            logger.error("No business_id in metadata")
            return {"status": "error", "message": "No business_id"}
        
        # Buscar o crear subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.business_id == UUID(business_id)
        ).first()
        
        if not subscription:
            subscription = Subscription(
                business_id=UUID(business_id),
                stripe_customer_id=session.get("customer"),
                stripe_subscription_id=session.get("subscription"),
            )
            self.db.add(subscription)
        
        # Actualizar con datos de la suscripción
        subscription.stripe_subscription_id = session.get("subscription")
        subscription.status = "active"
        
        # Obtener detalles de la suscripción desde Stripe
        if session.get("subscription"):
            stripe_sub = stripe.Subscription.retrieve(session["subscription"])
            subscription.current_period_start = stripe_sub.current_period_start
            subscription.current_period_end = stripe_sub.current_period_end
            subscription.plan_name = stripe_sub.items.data[0].price.nickname or "unknown"
            subscription.stripe_price_id = stripe_sub.items.data[0].price.id
        
        # Actualizar el negocio
        business = self.db.query(Business).filter(Business.id == UUID(business_id)).first()
        if business:
            business.subscription_status = "active"
            business.subscription_end_date = subscription.current_period_end
        
        self.db.commit()
        
        logger.info(f"Subscription activated for business {business_id}")
        return {"status": "success", "business_id": business_id}
    
    def _handle_subscription_updated(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar customer.subscription.updated"""
        stripe_sub_id = subscription_data.get("id")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).first()
        
        if not subscription:
            return {"status": "error", "message": "Subscription not found"}
        
        # Actualizar estado
        status = subscription_data.get("status")
        subscription.status = status
        subscription.current_period_start = subscription_data.get("current_period_start")
        subscription.current_period_end = subscription_data.get("current_period_end")
        subscription.cancel_at_period_end = subscription_data.get("cancel_at_period_end", False)
        
        # Actualizar negocio
        business = self.db.query(Business).filter(Business.id == subscription.business_id).first()
        if business:
            if status == "active":
                business.subscription_status = "active"
                business.subscription_end_date = subscription.current_period_end
            elif status in ["past_due", "canceled", "incomplete_expired"]:
                business.subscription_status = "expired"
                business.subscription_end_date = subscription.current_period_end
        
        self.db.commit()
        
        logger.info(f"Subscription {stripe_sub_id} updated: {status}")
        return {"status": "success", "subscription_id": stripe_sub_id}
    
    def _handle_subscription_deleted(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar customer.subscription.deleted"""
        stripe_sub_id = subscription_data.get("id")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).first()
        
        if subscription:
            subscription.status = "cancelled"
            
            business = self.db.query(Business).filter(Business.id == subscription.business_id).first()
            if business:
                business.subscription_status = "expired"
            
            self.db.commit()
            logger.info(f"Subscription {stripe_sub_id} cancelled")
        
        return {"status": "success"}