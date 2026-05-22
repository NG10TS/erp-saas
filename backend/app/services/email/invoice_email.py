# app/services/email/invoice_email.py
"""
Envía factura por email al cliente
"""
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List, Optional
import logging
import requests
from io import BytesIO

logger = logging.getLogger(__name__)


class InvoiceEmailService:
    """Servicio para enviar facturas por email"""
    
    def __init__(self, smtp_config: dict):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=smtp_config.get("SMTP_USER"),
            MAIL_PASSWORD=smtp_config.get("SMTP_PASSWORD"),
            MAIL_FROM=smtp_config.get("SMTP_FROM"),
            MAIL_PORT=smtp_config.get("SMTP_PORT", 587),
            MAIL_SERVER=smtp_config.get("SMTP_HOST", "smtp.gmail.com"),
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
        )
        self.fastmail = FastMail(self.conf)
    
    async def send_invoice(
        self,
        to_email: str,
        customer_name: str,
        invoice_number: str,
        pdf_url: str,
        access_key: str,
        total: float,
    ):
        """Envía factura adjunta o enlace"""
        html_content = f"""
        <html>
        <body>
            <h2>Estimado/a {customer_name}</h2>
            <p>Adjunto encontrará su factura electrónica <strong>{invoice_number}</strong></p>
            <p><strong>Clave de acceso:</strong> {access_key}</p>
            <p><strong>Total:</strong> ${total:.2f}</p>
            <p>Puede verificar su factura en el portal del SRI: 
            <a href="https://srienlinea.sri.gob.ec/">https://srienlinea.sri.gob.ec/</a></p>
            <hr/>
            <p><small>Documento electrónico autorizado por el SRI</small></p>
        </body>
        </html>
        """
        
        # Descargar PDF si es una URL
        attachments = []
        if pdf_url:
            try:
                pdf_bytes = self._download_pdf(pdf_url)
                if pdf_bytes:
                    attachments = [{"file": pdf_bytes, "name": f"{invoice_number}.pdf"}]
            except Exception as e:
                logger.error(f"Failed to download PDF from {pdf_url}: {e}")
        
        message = MessageSchema(
            subject=f"Factura electrónica {invoice_number}",
            recipients=[to_email],
            body=html_content,
            subtype="html",
            attachments=attachments if attachments else None
        )
        
        try:
            await self.fastmail.send_message(message)
            logger.info(f"Invoice {invoice_number} sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_email_with_attachment(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        is_html: bool = True,
    ) -> bool:
        """Envía email con adjunto opcional"""
        attachments = []
        if attachment_bytes and filename:
            attachments = [{"file": attachment_bytes, "name": filename}]
        
        message = MessageSchema(
            subject=subject,
            recipients=[to_email],
            body=body,
            subtype="html" if is_html else "plain",
            attachments=attachments if attachments else None
        )
        
        try:
            await self.fastmail.send_message(message)
            logger.info(f"Email '{subject}' sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    @staticmethod
    def _download_pdf(pdf_url: str) -> Optional[bytes]:
        """Descarga PDF desde URL y retorna bytes"""
        try:
            response = requests.get(pdf_url, timeout=10)
            if response.status_code == 200:
                return response.content
            else:
                logger.error(f"Failed to download PDF: HTTP {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error downloading PDF from {pdf_url}: {e}")
            return None