"""
Notification tasks
"""
from celery import shared_task
import logging
from datetime import datetime

from app.core.database import SessionLocal
from app.services.whatsapp.notification_service import WhatsAppNotificationService
from app.services.product_service import ProductService

logger = logging.getLogger(__name__)


@shared_task
def send_sale_notification(sale_id: str):
    """
    Send sale confirmation notification
    """
    logger.info(f"Sending sale notification for {sale_id}")
    
    db = SessionLocal()
    try:
        notification_service = WhatsAppNotificationService(db)
        notification_service.send_sale_confirmation(sale_id)
        
    except Exception as e:
        logger.error(f"Error sending sale notification: {e}")
        
    finally:
        db.close()


@shared_task
def send_invoice_notification(invoice_id: str):
    """
    Send invoice notification with PDF
    """
    logger.info(f"Sending invoice notification for {invoice_id}")
    
    db = SessionLocal()
    try:
        notification_service = WhatsAppNotificationService(db)
        notification_service.send_invoice_notification(invoice_id)
        
    except Exception as e:
        logger.error(f"Error sending invoice notification: {e}")
        
    finally:
        db.close()


@shared_task
def send_whatsapp_message(business_id: str, to: str, message: str):
    """
    Send WhatsApp message
    """
    logger.info(f"Sending WhatsApp message to {to}")
    
    db = SessionLocal()
    try:
        from app.services.whatsapp.whatsapp_client import WhatsAppClient
        from app.repositories.business_repository import BusinessRepository
        from app.utils.encryption import decrypt_value
        
        business_repo = BusinessRepository(db)
        business = business_repo.get(business_id)
        
        if not business or not business.whatsapp_access_token_encrypted:
            logger.error(f"WhatsApp not configured for business {business_id}")
            return
        
        whatsapp_token = decrypt_value(business.whatsapp_access_token_encrypted)
        whatsapp_client = WhatsAppClient(
            whatsapp_token,
            business.whatsapp_business_phone
        )
        
        import asyncio
        asyncio.run(whatsapp_client.send_text_message(to, message))
        
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        
    finally:
        db.close()


@shared_task
def check_low_stock():
    """
    Check for low stock products and send alerts
    """
    logger.info("Checking low stock products")
    
    db = SessionLocal()
    try:
        product_service = ProductService(db)
        notification_service = WhatsAppNotificationService(db)
        
        # Get all businesses
        from app.repositories.business_repository import BusinessRepository
        business_repo = BusinessRepository(db)
        businesses = business_repo.get_all_active()
        
        for business in businesses:
            # Skip if notifications disabled
            if not business.settings.get("notify_low_stock", True):
                continue
            
            # Get low stock products
            low_stock = product_service.get_low_stock_products(business.id)
            
            for product in low_stock:
                # Send alert
                notification_service.send_low_stock_alert(
                    business.id,
                    {
                        "name": product.name,
                        "stock": product.stock_quantity,
                        "min_stock": product.min_stock
                    }
                )
                
                logger.info(f"Low stock alert sent for {product.name} at {business.id}")
        
    except Exception as e:
        logger.error(f"Error checking low stock: {e}")
        
    finally:
        db.close()


@shared_task
def send_daily_summary():
    """
    Send daily sales summary to business owners
    """
    logger.info("Sending daily summaries")
    
    db = SessionLocal()
    try:
        from app.services.sale_service import SaleService
        from app.services.whatsapp.notification_service import WhatsAppNotificationService
        from app.repositories.business_repository import BusinessRepository
        from datetime import datetime, timedelta
        
        sale_service = SaleService(db)
        notification_service = WhatsAppNotificationService(db)
        business_repo = BusinessRepository(db)
        
        # Get all businesses
        businesses = business_repo.get_all_active()
        
        for business in businesses:
            # Get yesterday's summary
            yesterday = datetime.utcnow() - timedelta(days=1)
            summary = sale_service.get_daily_summary(business.id, yesterday)
            
            # Skip if no sales
            if summary["total_sales"] == 0:
                continue
            
            # Format message
            message = f"📊 *Resumen de ventas - {yesterday.strftime('%d/%m/%Y')}*\n\n"
            message += f"💰 Total: ${summary['total_amount']:.2f}\n"
            message += f"📦 Ventas: {summary['total_sales']}\n"
            message += f"🎫 Ticket promedio: ${summary['average_ticket']:.2f}\n\n"
            
            if summary["by_payment_method"]:
                message += "*Por método de pago:*\n"
                for pm in summary["by_payment_method"]:
                    if pm["method"]:
                        message += f"• {pm['method']}: ${pm['amount']:.2f} ({pm['count']} ventas)\n"
            
            # Send to business owner
            from app.models.user import User
            owner = db.query(User).filter(
                User.business_id == business.id,
                User.role == "owner"
            ).first()
            
            if owner and owner.phone:
                send_whatsapp_message.delay(
                    str(business.id),
                    owner.phone,
                    message
                )
        
    except Exception as e:
        logger.error(f"Error sending daily summaries: {e}")
        
    finally:
        db.close()