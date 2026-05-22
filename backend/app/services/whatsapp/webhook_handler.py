"""
WhatsApp Webhook Handler
Processes incoming webhook events from WhatsApp Business API.

Fixes:
  - _handle_message_content: product.price → product.precio_venta
  - product_service.search_products() → product_repo.get_by_business(search=...)
  - WhatsAppClient constructor: uses business phone ID (not phone number)
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from app.models.whatsapp_message import (
    WhatsAppMessage, MessageDirection, MessageType, MessageStatus
)
from app.models.customer import Customer
from app.services.whatsapp.message_parser import WhatsAppMessageParser
from app.services.whatsapp.whatsapp_client import WhatsAppClient
from app.services.whatsapp.conversation_flow import ConversationFlow
from app.services.sale_service import SaleService
from app.services.customer_service import CustomerService
from app.repositories.business_repository import BusinessRepository
from app.repositories.product_repository import ProductRepository
from app.utils.encryption import decrypt_value

logger = logging.getLogger(__name__)


class WhatsAppWebhookHandler:
    """Handle incoming WhatsApp webhooks"""

    def __init__(self, db: Session):
        self.db = db
        self.business_repo = BusinessRepository(db)
        self.customer_service = CustomerService(db)
        self.sale_service = SaleService(db)
        self.product_repo = ProductRepository(db)
        self.message_parser = WhatsAppMessageParser()

    # ── Entry point ───────────────────────────────────────────────────────────

    async def process_payload(self, payload: Dict[str, Any]) -> None:
        """Process incoming webhook payload from Meta"""
        try:
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    await self._process_messages(value)
                    await self._process_statuses(value)
        except Exception as e:
            logger.error(f"Error processing webhook payload: {e}", exc_info=True)

    # ── Message processing ────────────────────────────────────────────────────

    async def _process_messages(self, value: Dict[str, Any]) -> None:
        """Process incoming messages from webhook value block"""
        messages = value.get("messages", [])
        if not messages:
            return

        metadata = value.get("metadata", {})
        phone_number_id = metadata.get("phone_number_id", "")

        # Identify business by WhatsApp phone ID
        business = (
            self.db.query(
                __import__("app.models.business", fromlist=["Business"]).Business
            )
            .filter_by(whatsapp_business_id=phone_number_id)
            .first()
        )

        if not business:
            logger.warning(f"No business found for phone_number_id: {phone_number_id}")
            return

        for msg in messages:
            try:
                await self._process_single_message(msg, metadata, business)
            except Exception as e:
                logger.error(f"Error processing message {msg.get('id')}: {e}", exc_info=True)

    async def _process_single_message(
        self,
        message: Dict[str, Any],
        metadata: Dict[str, Any],
        business: Any,
    ) -> None:
        """Process one incoming message — identify customer, save record, handle intent"""
        from_phone = message.get("from", "")
        msg_id     = message.get("id", "")
        timestamp  = message.get("timestamp", "")
        msg_type   = message.get("type", "text")

        # Idempotency: skip if already processed
        existing = (
            self.db.query(WhatsAppMessage)
            .filter_by(whatsapp_message_id=msg_id)
            .first()
        )
        if existing:
            logger.debug(f"Message {msg_id} already processed — skipping")
            return

        # Get or create customer
        customer = self.customer_service.get_or_create_by_phone(
            business_id=business.id,
            phone=from_phone,
            name=self._extract_contact_name(message),
        )

        # Extract text content
        text_content = None
        if msg_type == "text":
            text_content = message.get("text", {}).get("body", "")

        # Save message record
        wa_msg = WhatsAppMessage(
            business_id=business.id,
            customer_id=customer.id,
            whatsapp_message_id=msg_id,
            direction=MessageDirection.INBOUND,
            message_type=MessageType(msg_type) if msg_type in MessageType._value2member_map_ else MessageType.TEXT,
            text=text_content,
            status=MessageStatus.DELIVERED,
            whatsapp_timestamp=datetime.fromtimestamp(int(timestamp)) if timestamp else None,
            received_at=datetime.utcnow(),
        )
        self.db.add(wa_msg)
        self.db.flush()

        # Handle intent
        if text_content:
            await self._handle_message_content(wa_msg, business, customer)

    async def _handle_message_content(
        self,
        message: WhatsAppMessage,
        business: Any,
        customer: Customer,
    ) -> None:
        """
        Parse message intent and respond.

        FIXED:
          - product.precio_venta (not product.price)
          - product_repo.get_by_business(search=...) (not product_service.search_products)
          - WhatsAppClient uses whatsapp_business_id as phone_number_id
        """
        # Build WhatsApp client for this business
        if not business.whatsapp_access_token_encrypted:
            logger.warning(f"Business {business.id} has no WhatsApp token configured")
            return

        access_token = decrypt_value(business.whatsapp_access_token_encrypted)
        # FIXED: phone_number_id is whatsapp_business_id, not whatsapp_business_phone
        client = WhatsAppClient(
            access_token=access_token,
            phone_number_id=business.whatsapp_business_id or business.whatsapp_business_phone,
        )

        await client.mark_message_as_read(message.whatsapp_message_id)

        flow = ConversationFlow(db=self.db, business=business, client=client)
        await flow.handle_message(
            phone=customer.phone_number,
            text=message.text or "",
            customer=customer,
        )

        message.mark_as_processed()
        self.db.commit()

    # ── Status updates (delivery receipts) ────────────────────────────────────

    async def _process_statuses(self, value: Dict[str, Any]) -> None:
        """Update message delivery status from webhook"""
        statuses = value.get("statuses", [])
        for status_data in statuses:
            try:
                msg_id     = status_data.get("id", "")
                new_status = status_data.get("status", "")

                status_map = {
                    "sent":      MessageStatus.SENT,
                    "delivered": MessageStatus.DELIVERED,
                    "read":      MessageStatus.READ,
                    "failed":    MessageStatus.FAILED,
                }
                mapped = status_map.get(new_status)
                if not mapped:
                    continue

                wa_msg = (
                    self.db.query(WhatsAppMessage)
                    .filter_by(whatsapp_message_id=msg_id)
                    .first()
                )
                if wa_msg:
                    wa_msg.update_status(mapped)
                    self.db.commit()

            except Exception as e:
                logger.error(f"Error updating status for {status_data}: {e}")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_contact_name(self, message: Dict[str, Any]) -> Optional[str]:
        """Extract display name from message contacts block"""
        contacts = message.get("contacts", [])
        if contacts:
            return contacts[0].get("profile", {}).get("name")
        return None

    def customer_service_get_or_create(
        self, business_id: Any, phone: str, name: Optional[str]
    ) -> Customer:
        """Convenience wrapper — kept for backward compat"""
        return self.customer_service.get_or_create_by_phone(
            business_id=business_id, phone=phone, name=name
        )
