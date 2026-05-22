"""
WhatsApp Invoice Sender Service
Envía facturas por WhatsApp a los clientes
"""
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.invoice import Invoice
from app.models.sale import Sale
from app.services.whatsapp.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)


class InvoiceSenderService:
    """
    Servicio para enviar facturas por WhatsApp.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.whatsapp_service = WhatsAppService(db)
    
    async def send_invoice_to_customer(
        self,
        invoice_id: UUID,
        phone_number: Optional[str] = None,
    ) -> bool:
        """
        Envía una factura al cliente por WhatsApp.
        
        Args:
            invoice_id: ID de la factura
            phone_number: Número de teléfono (opcional, usa el del cliente si no se provee)
        
        Returns:
            True si se envió correctamente, False en caso contrario
        """
        try:
            # Obtener factura
            invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                logger.error(f"Invoice {invoice_id} not found")
                return False
            
            # Obtener la venta asociada
            sale = self.db.query(Sale).filter(Sale.id == invoice.sale_id).first()
            if not sale:
                logger.error(f"Sale {invoice.sale_id} not found for invoice {invoice_id}")
                return False
            
            # Obtener número de teléfono
            if not phone_number and sale.customer:
                phone_number = sale.customer.phone_number
            
            if not phone_number:
                logger.error(f"No phone number for invoice {invoice_id}")
                return False
            
            # Construir mensaje con la factura
            message = self._build_invoice_message(invoice, sale)
            
            # Enviar por WhatsApp
            result = await self.whatsapp_service.send_message(
                to=phone_number,
                message=message,
            )
            
            # También enviar el PDF si está disponible
            if invoice.pdf_url:
                await self.whatsapp_service.send_document(
                    to=phone_number,
                    document_url=invoice.pdf_url,
                    caption=f"Factura {invoice.invoice_number}",
                )
            
            logger.info(f"Invoice {invoice.invoice_number} sent to {phone_number}")
            return result
            
        except Exception as e:
            logger.error(f"Error sending invoice {invoice_id}: {e}")
            return False
    
    def _build_invoice_message(self, invoice: Invoice, sale: Sale) -> str:
        """
        Construye el mensaje de texto para la factura.
        """
        customer_name = sale.customer.name if sale.customer else "Cliente"
        
        message = f"""🎫 *FACTURA ELECTRÓNICA*

📋 *Cliente:* {customer_name}
📄 *Número:* {invoice.invoice_number}
💰 *Total:* ${float(sale.total):.2f}
✅ *Estado:* Autorizada

Puedes descargar tu factura adjunta en PDF.

¡Gracias por tu compra! 🚀
"""
        return message
    
    async def send_invoice_status_update(
        self,
        invoice_id: UUID,
        status: str,
        phone_number: Optional[str] = None,
    ) -> bool:
        """
        Envía una actualización del estado de la factura.
        """
        try:
            invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                return False
            
            sale = self.db.query(Sale).filter(Sale.id == invoice.sale_id).first()
            if not sale:
                return False
            
            if not phone_number and sale.customer:
                phone_number = sale.customer.phone_number
            
            if not phone_number:
                return False
            
            emoji = "✅" if status == "AUTORIZADA" else "❌"
            message = f"""{emoji} *Actualización de Factura*

Estado: {status}
Número: {invoice.invoice_number}

Para más detalles, revisa el sistema.
"""
            result = await self.whatsapp_service.send_message(
                to=phone_number,
                message=message,
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending invoice status update: {e}")
            return False


class InvoiceSender:  # ← Alias para compatibilidad con importaciones antiguas
    """Alias para InvoiceSenderService (mantiene compatibilidad)"""
    
    def __init__(self, db: Session):
        self.db = db
        self.service = InvoiceSenderService(db)
    
    async def send_invoice(self, invoice_id: UUID, phone_number: str) -> bool:
        """Método de compatibilidad"""
        return await self.service.send_invoice_to_customer(invoice_id, phone_number)