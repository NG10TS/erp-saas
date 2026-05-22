# backend/app/services/whatsapp/whatsapp_service.py
import httpx
import logging
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Servicio de WhatsApp - Versión simplificada"""

    def __init__(self, db: Session, business_id: UUID):
        self.db = db
        self.business_id = business_id

    async def send_message(self, to: str, message: str) -> Dict[str, Any]:
        """Enviar mensaje de texto usando la API de Meta directamente"""
        url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def send_template(self, to: str, template_name: str, language: str = "es", components: list = None) -> Dict[str, Any]:
        """Enviar mensaje con plantilla"""
        url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language}
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    def list_conversations(self, limit: int = 50) -> List[Dict]:
        """Listar conversaciones (implementación básica)"""
        return []

    def get_conversation_history(self, phone_number: str, limit: int = 50) -> List[Dict]:
        """Obtener historial de conversación (implementación básica)"""
        return []