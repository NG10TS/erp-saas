"""
Payment Service - Integración con Stripe
Maneja suscripciones, webhooks y facturación
"""
import stripe
import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.business import Business
from app.models.subscription import Subscription

logger = logging.getLogger(__name__)

# Configurar Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    """Servicio para manejar pagos y suscripciones con Stripe"""
    
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
            price_id: ID del precio en Stripe
            success_url: URL a donde redirigir tras pago exitoso
            cancel_url: URL a donde redirigir si cancela
        
        Returns:
            Diccionario con session_id y checkout_url
        """
        try:
            # Obtener el negocio
            business = self.db.query(Business).filter(Business.id == business_id).first()
            if not business:
                raise ValueError(f"Business {business_id} not found")
            
            # Buscar suscripción existente
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
            logger.error(f"Stripe error creating checkout session: {e}")
            raise ValueError(f"Error creating checkout session: {e.user_message}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise ValueError(f"Error creating checkout session: {str(e)}")
    
    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Manejar webhook de Stripe.
        Verifica la firma y procesa el evento.
        """
        try:
            # Verificar firma del webhook
            if not settings.STRIPE_WEBHOOK_SECRET:
                logger.warning("STRIPE_WEBHOOK_SECRET not configured")
                return {"status": "error", "message": "Webhook secret not configured"}
            
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
        
        logger.info(f"Processing webhook event: {event_type}")
        
        if event_type == "checkout.session.completed":
            return self._handle_checkout_completed(event_data)
        elif event_type == "customer.subscription.updated":
            return self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            return self._handle_subscription_deleted(event_data)
        elif event_type == "invoice.payment_succeeded":
            return self._handle_invoice_payment_succeeded(event_data)
        elif event_type == "invoice.payment_failed":
            return self._handle_invoice_payment_failed(event_data)
        
        logger.info(f"Unhandled event type: {event_type}")
        return {"status": "unhandled", "event_type": event_type}
    
    def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar checkout.session.completed"""
        metadata = session.get("metadata", {})
        business_id_str = metadata.get("business_id")
        
        if not business_id_str:
            logger.error("No business_id in metadata")
            return {"status": "error", "message": "No business_id"}
        
        business_id = UUID(business_id_str)
        
        # Buscar o crear suscripción
        subscription = self.db.query(Subscription).filter(
            Subscription.business_id == business_id
        ).first()
        
        stripe_subscription_id = session.get("subscription")
        
        if not subscription:
            subscription = Subscription(
                business_id=business_id,
                stripe_customer_id=session.get("customer"),
                stripe_subscription_id=stripe_subscription_id,
                status="active",
            )
            self.db.add(subscription)
        else:
            subscription.stripe_customer_id = session.get("customer")
            subscription.stripe_subscription_id = stripe_subscription_id
            subscription.status = "active"
        
        # Obtener detalles de la suscripción desde Stripe
        if stripe_subscription_id:
            try:
                stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
                subscription.current_period_start = datetime.fromtimestamp(stripe_subscription_id)
                subscription.current_period_end = datetime.fromtimestamp(stripe_subscription_id)
                
                if stripe_sub.items.data:
                    price = stripe_sub.items.data[0].price
                    subscription.plan_name = price.nickname or "unknown"
                    subscription.stripe_price_id = price.id
            except Exception as e:
                logger.error(f"Error retrieving subscription details: {e}")
        
        # Actualizar el negocio
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if business:
            business.subscription_status = "active"
            business.subscription_end_date = subscription.current_period_end
        
        self.db.commit()
        
        logger.info(f"Subscription activated for business {business_id}")
        return {"status": "success", "business_id": str(business_id)}
    
    def _handle_subscription_updated(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar customer.subscription.updated"""
        stripe_sub_id = subscription_data.get("id")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).first()
        
        if not subscription:
            logger.warning(f"Subscription {stripe_sub_id} not found in database")
            return {"status": "error", "message": "Subscription not found"}
        
        # Actualizar estado
        status = subscription_data.get("status")
        subscription.status = status
        
        if subscription_data.get("current_period_start"):
            subscription.current_period_start = datetime.fromtimestamp(
                subscription_data["current_period_start"]
            )
        if subscription_data.get("current_period_end"):
            subscription.current_period_end = datetime.fromtimestamp(
                subscription_data["current_period_end"]
            )
        
        subscription.cancel_at_period_end = subscription_data.get("cancel_at_period_end", False)
        
        # Actualizar negocio
        business = self.db.query(Business).filter(Business.id == subscription.business_id).first()
        if business:
            if status in ["active", "trialing"]:
                business.subscription_status = "active"
                business.subscription_end_date = subscription.current_period_end
            elif status in ["past_due", "canceled", "incomplete_expired", "unpaid"]:
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
        else:
            logger.warning(f"Subscription {stripe_sub_id} not found for deletion")
        
        return {"status": "success"}
    
    def _handle_invoice_payment_succeeded(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar invoice.payment_succeeded"""
        customer_id = invoice_data.get("customer")
        
        # Buscar suscripción por customer_id
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_customer_id == customer_id
        ).first()
        
        if subscription:
            logger.info(f"Payment succeeded for subscription {subscription.stripe_subscription_id}")
            # Resetear contador de facturas del mes
            business = self.db.query(Business).filter(Business.id == subscription.business_id).first()
            if business:
                business.current_invoices_month = 0
                self.db.commit()
        
        return {"status": "success"}
    
    def _handle_invoice_payment_failed(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar invoice.payment_failed"""
        customer_id = invoice_data.get("customer")
        
        # Buscar suscripción por customer_id
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_customer_id == customer_id
        ).first()
        
        if subscription:
            logger.warning(f"Payment failed for subscription {subscription.stripe_subscription_id}")
            subscription.status = "past_due"
            
            business = self.db.query(Business).filter(Business.id == subscription.business_id).first()
            if business:
                business.subscription_status = "expired"
            
            self.db.commit()
        
        return {"status": "success"}
    
    def cancel_subscription(self, subscription_id: UUID) -> bool:
        """
        Cancelar una suscripción en Stripe
        """
        subscription = self.db.query(Subscription).filter(
            Subscription.id == subscription_id
        ).first()
        
        if not subscription or not subscription.stripe_subscription_id:
            logger.error(f"Subscription {subscription_id} not found or no stripe id")
            return False
        
        try:
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True,
            )
            
            subscription.cancel_at_period_end = True
            self.db.commit()
            
            logger.info(f"Subscription {subscription_id} cancelled at period end")
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {e}")
            return False