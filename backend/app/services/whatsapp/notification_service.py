"""
WhatsApp Notification Service
Sends automated notifications via WhatsApp
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID
import logging

from app.services.whatsapp.whatsapp_client import WhatsAppClient
from app.services.whatsapp.template_service import TemplateService
from app.repositories.business_repository import BusinessRepository
from app.repositories.sale_repository import SaleRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.customer_repository import CustomerRepository
from app.utils.encryption import decrypt_value

logger = logging.getLogger(__name__)


class WhatsAppNotificationService:
    """Service for sending WhatsApp notifications"""
    
    def __init__(self, db: Session):
        self.db = db
        self.business_repo = BusinessRepository(db)
        self.sale_repo = SaleRepository(db)
        self.invoice_repo = InvoiceRepository(db)
        self.customer_repo = CustomerRepository(db)
        self.template_service = TemplateService(db)
    
    async def send_sale_confirmation(self, sale_id: UUID):
        """Send sale confirmation notification"""
        try:
            # Get sale with relations
            sale = self.sale_repo.get_with_items(sale_id)
            if not sale:
                logger.error(f"Sale {sale_id} not found")
                return
            
            if not sale.customer or not sale.customer.whatsapp_opted_in:
                logger.info(f"Customer not opted in for WhatsApp")
                return
            
            # Get business
            business = self.business_repo.get(sale.business_id)
            if not business or not business.whatsapp_access_token_encrypted:
                logger.error(f"WhatsApp not configured for business {sale.business_id}")
                return
            
            # Initialize WhatsApp client
            whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
            whatsapp_client = WhatsAppClient(
                whatsapp_token,
                business.whatsapp_business_phone
            )
            
            # Prepare template variables
            customer_name = sale.customer.name or "cliente"
            items_text = "\n".join([
                f"• {item.quantity}x {item.product_name}"
                for item in sale.items
            ])
            
            # Send template message
            await whatsapp_client.send_template_message(
                to=sale.customer.phone_number,
                template_name="order_confirmation",
                language="es",
                components=[
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": customer_name},
                            {"type": "text", "text": str(sale.total)},
                            {"type": "text", "text": items_text}
                        ]
                    }
                ]
            )
            
            logger.info(f"Sale confirmation sent for sale {sale_id}")
            
        except Exception as e:
            logger.error(f"Error sending sale confirmation: {e}")
    
    async def send_invoice_notification(self, invoice_id: UUID):
        """Send invoice notification with PDF link"""
        try:
            # Get invoice with relations
            invoice = self.invoice_repo.get_with_relations(invoice_id)
            if not invoice:
                logger.error(f"Invoice {invoice_id} not found")
                return
            
            if not invoice.customer or not invoice.customer.whatsapp_opted_in:
                logger.info(f"Customer not opted in for WhatsApp")
                return
            
            if not invoice.pdf_url:
                logger.error(f"Invoice {invoice_id} has no PDF URL")
                return
            
            # Get business
            business = self.business_repo.get(invoice.business_id)
            if not business or not business.whatsapp_access_token_encrypted:
                logger.error(f"WhatsApp not configured for business {invoice.business_id}")
                return
            
            # Initialize WhatsApp client
            whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
            whatsapp_client = WhatsAppClient(
                whatsapp_token,
                business.whatsapp_business_phone
            )
            
            customer_name = invoice.customer.name or "cliente"
            
            # Try to send template first
            try:
                await whatsapp_client.send_template_message(
                    to=invoice.customer.phone_number,
                    template_name="invoice_ready",
                    language="es",
                    components=[
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": customer_name},
                                {"type": "text", "text": invoice.invoice_number},
                                {"type": "text", "text": str(invoice.total)}
                            ]
                        },
                        {
                            "type": "button",
                            "sub_type": "url",
                            "index": "0",
                            "parameters": [
                                {"type": "text", "text": invoice.pdf_url}
                            ]
                        }
                    ]
                )
            except:
                # Fallback to document send
                await whatsapp_client.send_document(
                    to=invoice.customer.phone_number,
                    document_url=invoice.pdf_url,
                    caption=f"Factura #{invoice.invoice_number} - Total: ${invoice.total}",
                    filename=f"factura_{invoice.invoice_number}.pdf"
                )
            
            logger.info(f"Invoice notification sent for invoice {invoice_id}")
            
        except Exception as e:
            logger.error(f"Error sending invoice notification: {e}")
    
    async def send_order_ready_notification(self, sale_id: UUID):
        """Send notification that order is ready"""
        try:
            sale = self.sale_repo.get(sale_id)
            if not sale or not sale.customer:
                return
            
            business = self.business_repo.get(sale.business_id)
            if not business:
                return
            
            whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
            whatsapp_client = WhatsAppClient(
                whatsapp_token,
                business.whatsapp_business_phone
            )
            
            customer_name = sale.customer.name or "cliente"
            
            await whatsapp_client.send_template_message(
                to=sale.customer.phone_number,
                template_name="order_ready",
                language="es",
                components=[
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": customer_name},
                            {"type": "text", "text": sale.sale_number}
                        ]
                    }
                ]
            )
            
        except Exception as e:
            logger.error(f"Error sending order ready notification: {e}")
    
    async def send_payment_reminder(self, sale_id: UUID):
        """Send payment reminder"""
        try:
            sale = self.sale_repo.get(sale_id)
            if not sale or not sale.customer:
                return
            
            business = self.business_repo.get(sale.business_id)
            if not business:
                return
            
            whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
            whatsapp_client = WhatsAppClient(
                whatsapp_token,
                business.whatsapp_business_phone
            )
            
            customer_name = sale.customer.name or "cliente"
            
            await whatsapp_client.send_template_message(
                to=sale.customer.phone_number,
                template_name="payment_reminder",
                language="es",
                components=[
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": customer_name},
                            {"type": "text", "text": sale.sale_number},
                            {"type": "text", "text": str(sale.total)}
                        ]
                    }
                ]
            )
            
        except Exception as e:
            logger.error(f"Error sending payment reminder: {e}")
    
    async def send_low_stock_alert(self, business_id: UUID, product_data: Dict[str, Any]):
        """Send low stock alert to business owner"""
        try:
            business = self.business_repo.get(business_id)
            if not business:
                return
            
            # Get admin users
            from app.models.user import User
            admins = self.db.query(User).filter(
                User.business_id == business_id,
                User.role.in_(["owner", "admin"]),
                User.is_active == True
            ).all()
            
            if not admins:
                return
            
            whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
            whatsapp_client = WhatsAppClient(
                whatsapp_token,
                business.whatsapp_business_phone
            )
            
            for admin in admins:
                if admin.phone:
                    await whatsapp_client.send_template_message(
                        to=admin.phone,
                        template_name="low_stock_alert",
                        language="es",
                        components=[
                            {
                                "type": "body",
                                "parameters": [
                                    {"type": "text", "text": product_data["name"]},
                                    {"type": "text", "text": str(product_data["stock"])},
                                    {"type": "text", "text": str(product_data["min_stock"])}
                                ]
                            }
                        ]
                    )
            
        except Exception as e:
            logger.error(f"Error sending low stock alert: {e}")