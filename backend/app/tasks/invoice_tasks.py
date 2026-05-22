"""
Invoice processing tasks (Celery)

Fixes:
  - process_invoice uses asyncio.run() to call the async SRIService
  - create_invoice_from_sale uses sale.factura_id (not sale.invoice_id)
  - business.can_add_resource() is not a real method — replaced with inline limit check
"""
from celery import shared_task
from sqlalchemy.orm import Session
import logging
import asyncio
from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.services.sri.sri_service import SRIService
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.business_repository import BusinessRepository

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_invoice(self, invoice_id: str):
    """
    Process invoice through complete SRI flow.
    FIXED: SRIService.process_invoice is async — must be called via asyncio.run().
    """
    logger.info(f"Processing invoice {invoice_id}")
    db = SessionLocal()
    try:
        sri_service = SRIService(db)
        # FIXED: was sri_service.process_invoice(invoice_id) without await
        result = asyncio.run(sri_service.process_invoice(invoice_id))

        if result.get("status") == "AUTHORIZED":
            send_invoice_notification.delay(invoice_id)

        return result

    except Exception as e:
        logger.error(f"Error processing invoice {invoice_id}: {e}")
        retry_in = 60 * (2 ** self.request.retries)
        self.retry(exc=e, countdown=retry_in)

    finally:
        db.close()


@shared_task
def send_invoice_notification(invoice_id: str):
    """Send WhatsApp/email notification after SRI authorisation"""
    logger.info(f"Sending notification for invoice {invoice_id}")
    db = SessionLocal()
    try:
        from app.services.whatsapp.notification_service import WhatsAppNotificationService
        from app.services.email.invoice_email import InvoiceEmailService
        from app.core.config import settings
        
        invoice_repo = InvoiceRepository(db)
        invoice = invoice_repo.get(invoice_id)
        
        if not invoice:
            logger.warning(f"Invoice {invoice_id} not found")
            return
        
        # Enviar notificación por WhatsApp si está habilitado
        if invoice.customer and invoice.customer.whatsapp_opted_in and invoice.pdf_url:
            try:
                asyncio.run(
                    WhatsAppNotificationService.send_invoice_notification(invoice_id)
                )
            except Exception as e:
                logger.error(f"Error sending WhatsApp notification for invoice {invoice_id}: {e}")
        
        # Enviar notificación por email si el cliente tiene email
        if invoice.customer and invoice.customer.email and invoice.pdf_url:
            try:
                smtp_config = {
                    "SMTP_HOST": getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
                    "SMTP_PORT": getattr(settings, "SMTP_PORT", 587),
                    "SMTP_USER": getattr(settings, "SMTP_USER", ""),
                    "SMTP_PASSWORD": getattr(settings, "SMTP_PASSWORD", ""),
                    "SMTP_FROM": getattr(settings, "SMTP_FROM", ""),
                }
                
                if smtp_config["SMTP_USER"] and smtp_config["SMTP_PASSWORD"]:
                    email_service = InvoiceEmailService(smtp_config)
                    
                    # Preparar HTML del email
                    html_content = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2>Estimado/a {invoice.customer.name or 'Cliente'}</h2>
                        <p>Adjunto encontrará su factura electrónica <strong>{invoice.invoice_number}</strong></p>
                        <p><strong>Clave de acceso:</strong> {invoice.access_key or 'N/A'}</p>
                        <p><strong>Total:</strong> ${invoice.total:.2f}</p>
                        <p>Puede verificar su factura en el portal del SRI: 
                        <a href="https://srienlinea.sri.gob.ec/">https://srienlinea.sri.gob.ec/</a></p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
                        <p><small>Documento electrónico autorizado por el SRI</small></p>
                    </body>
                    </html>
                    """
                    
                    # Enviar email con adjunto
                    asyncio.run(
                        email_service.send_email_with_attachment(
                            to_email=invoice.customer.email,
                            subject=f"Factura electrónica {invoice.invoice_number}",
                            body=html_content,
                            filename=f"{invoice.invoice_number}.pdf"
                        )
                    )
                    logger.info(f"Email notification sent for invoice {invoice_id}")
            except Exception as e:
                logger.error(f"Error sending email notification for invoice {invoice_id}: {e}")
    
    except Exception as e:
        logger.error(f"Error sending notification for invoice {invoice_id}: {e}")
    finally:
        db.close()


@shared_task
def check_pending_invoices():
    """Check invoices pending SRI authorization (run by Celery beat)"""
    logger.info("Checking pending invoices")
    db = SessionLocal()
    try:
        invoice_repo = InvoiceRepository(db)
        cutoff = datetime.utcnow() - timedelta(minutes=10)
        pending = invoice_repo.get_pending_sri(cutoff=cutoff)
        for invoice in pending:
            process_invoice.delay(str(invoice.id))
        logger.info(f"Queued {len(pending)} pending invoices for retry")
    finally:
        db.close()


@shared_task
def create_invoice_from_sale(sale_id: str):
    """
    Create invoice from a completed sale.
    FIXED: uses sale.factura_id (not sale.invoice_id which doesn't exist)
    FIXED: replaced business.can_add_resource() with direct counter check
    """
    logger.info(f"Creating invoice from sale {sale_id}")
    db = SessionLocal()
    try:
        from app.services.invoice_service import InvoiceService
        from app.repositories.sale_repository import SaleRepository

        sale_repo = SaleRepository(db)
        business_repo = BusinessRepository(db)
        invoice_service = InvoiceService(db)

        sale = sale_repo.get(sale_id)
        if not sale:
            logger.error(f"Sale {sale_id} not found")
            return

        # FIXED: sale.factura_id not sale.invoice_id
        if sale.factura_id:
            logger.info(f"Sale {sale_id} already has invoice {sale.factura_id}")
            return

        business = business_repo.get(sale.business_id)
        if not business:
            logger.error(f"Business {sale.business_id} not found")
            return

        # FIXED: inline limit check instead of non-existent can_add_resource()
        if (business.max_invoices_monthly and
                business.current_invoices_month >= business.max_invoices_monthly):
            logger.warning(f"Business {business.id} reached monthly invoice limit")
            return

        invoice = invoice_service.create_from_sale(
            business_id=business.id,
            sale_id=sale_id,
        )

        business.current_invoices_month += 1
        db.commit()

        process_invoice.delay(str(invoice.id))
        logger.info(f"Invoice {invoice.id} created and queued for SRI")

    except Exception as e:
        logger.error(f"Error creating invoice from sale {sale_id}: {e}")
    finally:
        db.close()


@shared_task
def retry_failed_invoices():
    """Retry REJECTED invoices from the last 3 days"""
    logger.info("Retrying failed invoices")
    db = SessionLocal()
    try:
        invoice_repo = InvoiceRepository(db)
        cutoff = datetime.utcnow() - timedelta(days=3)
        failed = invoice_repo.get_failed_invoices(cutoff=cutoff)
        for invoice in failed:
            process_invoice.delay(str(invoice.id))
        logger.info(f"Queued {len(failed)} failed invoices for retry")
    finally:
        db.close()