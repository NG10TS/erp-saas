"""
WhatsApp Cloud API Client
"""
import httpx
from typing import Dict, Any, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppClient:
    """Client for WhatsApp Cloud API"""
    
    def __init__(self, access_token: str, phone_number_id: str):
        """
        Initialize WhatsApp client
        
        Args:
            access_token: WhatsApp access token
            phone_number_id: Phone number ID
        """
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.base_url = f"{settings.WHATSAPP_BASE_URL}/{settings.WHATSAPP_API_VERSION}"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def send_text_message(self, to: str, text: str) -> Dict[str, Any]:
        """
        Send text message
        
        Args:
            to: Recipient phone number
            text: Message text
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"body": text[:4096]}  # Max 4096 chars
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def send_template_message(
        self,
        to: str,
        template_name: str,
        language: str = "es",
        components: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Send template message
        
        Args:
            to: Recipient phone number
            template_name: Template name
            language: Template language
            components: Template components (header, body, buttons)
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
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
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def send_interactive_buttons(
        self,
        to: str,
        text: str,
        buttons: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Send message with interactive buttons
        
        Args:
            to: Recipient phone number
            text: Message text
            buttons: List of buttons (max 3)
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        # Format buttons
        formatted_buttons = []
        for i, button in enumerate(buttons[:3]):
            formatted_buttons.append({
                "type": "reply",
                "reply": {
                    "id": f"btn_{i}_{button.get('id', i)}",
                    "title": button['title'][:20]  # Max 20 chars
                }
            })
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": text[:1024]},  # Max 1024 chars
                "action": {"buttons": formatted_buttons}
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def send_document(
        self,
        to: str,
        document_url: str,
        caption: Optional[str] = None,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send document (PDF, etc.)
        
        Args:
            to: Recipient phone number
            document_url: URL of document
            caption: Optional caption
            filename: Optional filename
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "document",
            "document": {
                "link": document_url,
                "caption": caption or "",
                "filename": filename or "document.pdf"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def send_image(
        self,
        to: str,
        image_url: str,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send image
        
        Args:
            to: Recipient phone number
            image_url: URL of image
            caption: Optional caption
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "image",
            "image": {
                "link": image_url,
                "caption": caption or ""
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def mark_message_as_read(self, message_id: str) -> Dict[str, Any]:
        """
        Mark message as read
        
        Args:
            message_id: WhatsApp message ID
            
        Returns:
            API response
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_phone_number_info(self) -> Dict[str, Any]:
        """
        Get phone number information
        
        Returns:
            Phone number info
        """
        url = f"{self.base_url}/{self.phone_number_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_templates(self) -> List[Dict[str, Any]]:
        """
        Get message templates
        
        Returns:
            List of templates
        """
        url = f"{self.base_url}/{self.phone_number_id}/message_templates"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])