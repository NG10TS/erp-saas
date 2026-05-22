"""
WhatsApp Template Service
Manages message templates for WhatsApp
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
import logging

from app.models.whatsapp_template import WhatsAppTemplate
from app.services.whatsapp.whatsapp_client import WhatsAppClient
from app.utils.encryption import decrypt_value

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing WhatsApp templates"""
    
    # Default templates
    DEFAULT_TEMPLATES = {
        "welcome": {
            "name": "welcome",
            "category": "UTILITY",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "Bienvenido a {{1}}"
                },
                {
                    "type": "BODY",
                    "text": "Hola {{1}}, gracias por contactarnos. ¿En qué podemos ayudarte?"
                }
            ]
        },
        "order_confirmation": {
            "name": "order_confirmation",
            "category": "UTILITY",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "Pedido Confirmado #{{1}}"
                },
                {
                    "type": "BODY",
                    "text": "Hola {{1}}, tu pedido ha sido confirmado por un total de ${{2}}. Te notificaremos cuando esté listo."
                }
            ]
        },
        "invoice_ready": {
            "name": "invoice_ready",
            "category": "UTILITY",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "Factura Electrónica"
                },
                {
                    "type": "BODY",
                    "text": "Hola {{1}}, tu factura #{{2}} ha sido generada y autorizada por el SRI. Puedes descargarla en el siguiente enlace: {{3}}"
                },
                {
                    "type": "BUTTONS",
                    "buttons": [
                        {
                            "type": "URL",
                            "text": "Ver Factura",
                            "url": "{{4}}"
                        }
                    ]
                }
            ]
        },
        "order_ready": {
            "name": "order_ready",
            "category": "UTILITY",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "Pedido Listo"
                },
                {
                    "type": "BODY",
                    "text": "Hola {{1}}, tu pedido #{{2}} está listo para retirar. Te esperamos!"
                }
            ]
        },
        "payment_reminder": {
            "name": "payment_reminder",
            "category": "UTILITY",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "Recordatorio de Pago"
                },
                {
                    "type": "BODY",
                    "text": "Hola {{1}}, tu pedido #{{2}} por ${{3}} está pendiente de pago. ¿Cómo deseas pagar?"
                },
                {
                    "type": "BUTTONS",
                    "buttons": [
                        {
                            "type": "QUICK_REPLY",
                            "text": "Transferencia"
                        },
                        {
                            "type": "QUICK_REPLY",
                            "text": "Efectivo"
                        },
                        {
                            "type": "QUICK_REPLY",
                            "text": "Tarjeta"
                        }
                    ]
                }
            ]
        },
        "low_stock_alert": {
            "name": "low_stock_alert",
            "category": "ALERT",
            "components": [
                {
                    "type": "HEADER",
                    "format": "TEXT",
                    "text": "⚠️ Alerta de Stock Bajo"
                },
                {
                    "type": "BODY",
                    "text": "El producto *{{1}}* tiene solo {{2}} unidades en stock (mínimo: {{3}}). Por favor, revisa tu inventario."
                }
            ]
        }
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_templates(self, business_id: UUID) -> List[Dict[str, Any]]:
        """Get all templates for a business"""
        templates = self.db.query(WhatsAppTemplate).filter(
            WhatsAppTemplate.business_id == business_id
        ).all()
        
        return [t.to_dict() for t in templates]
    
    def get_template(self, business_id: UUID, template_name: str) -> Optional[Dict[str, Any]]:
        """Get specific template by name"""
        template = self.db.query(WhatsAppTemplate).filter(
            WhatsAppTemplate.business_id == business_id,
            WhatsAppTemplate.name == template_name
        ).first()
        
        return template.to_dict() if template else None
    
    def create_template(
        self,
        business_id: UUID,
        template_in: Dict[str, Any]
    ) -> WhatsAppTemplate:
        """Create new template"""
        # Check if exists
        existing = self.db.query(WhatsAppTemplate).filter(
            WhatsAppTemplate.business_id == business_id,
            WhatsAppTemplate.name == template_in["name"]
        ).first()
        
        if existing:
            raise ValueError(f"Template {template_in['name']} already exists")
        
        template = WhatsAppTemplate(
            business_id=business_id,
            name=template_in["name"],
            category=template_in.get("category", "UTILITY"),
            language=template_in.get("language", "es"),
            components=template_in.get("components", []),
            status="PENDING"
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    def update_template(
        self,
        template_id: UUID,
        template_in: Dict[str, Any]
    ) -> WhatsAppTemplate:
        """Update template"""
        template = self.db.query(WhatsAppTemplate).filter(
            WhatsAppTemplate.id == template_id
        ).first()
        
        if not template:
            raise ValueError("Template not found")
        
        for key, value in template_in.items():
            if hasattr(template, key):
                setattr(template, key, value)
        
        template.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    def delete_template(self, template_id: UUID) -> bool:
        """Delete template"""
        template = self.db.query(WhatsAppTemplate).filter(
            WhatsAppTemplate.id == template_id
        ).first()
        
        if template:
            self.db.delete(template)
            self.db.commit()
            return True
        
        return False
    
    async def sync_with_whatsapp(
        self,
        business_id: UUID,
        whatsapp_client: WhatsAppClient
    ) -> List[Dict[str, Any]]:
        """Sync templates with WhatsApp Cloud API"""
        try:
            # Get templates from WhatsApp
            wa_templates = await whatsapp_client.get_templates()
            
            # Update local templates
            for wa_template in wa_templates:
                local = self.db.query(WhatsAppTemplate).filter(
                    WhatsAppTemplate.business_id == business_id,
                    WhatsAppTemplate.name == wa_template["name"]
                ).first()
                
                if local:
                    local.status = wa_template["status"]
                    local.components = wa_template.get("components", [])
                    local.updated_at = datetime.utcnow()
                else:
                    new_template = WhatsAppTemplate(
                        business_id=business_id,
                        name=wa_template["name"],
                        category=wa_template.get("category", "UTILITY"),
                        language=wa_template.get("language", "es"),
                        components=wa_template.get("components", []),
                        status=wa_template["status"],
                        wa_template_id=wa_template["id"]
                    )
                    self.db.add(new_template)
            
            self.db.commit()
            
            return self.get_templates(business_id)
            
        except Exception as e:
            logger.error(f"Error syncing templates: {e}")
            raise
    
    def initialize_default_templates(self, business_id: UUID) -> List[WhatsAppTemplate]:
        """Initialize default templates for a new business"""
        created = []
        
        for template_name, template_data in self.DEFAULT_TEMPLATES.items():
            try:
                template = WhatsAppTemplate(
                    business_id=business_id,
                    name=template_data["name"],
                    category=template_data["category"],
                    language="es",
                    components=template_data["components"],
                    status="APPROVED",  # Assume approved for default templates
                    is_default=True
                )
                self.db.add(template)
                created.append(template)
            except Exception as e:
                logger.error(f"Error creating default template {template_name}: {e}")
        
        self.db.commit()
        return created
    
    def render_template(
        self,
        template_name: str,
        variables: Dict[str, str]
    ) -> Optional[str]:
        """
        Render a template with variables
        
        Args:
            template_name: Template name
            variables: Dictionary of variables to replace
            
        Returns:
            Rendered text or None if template not found
        """
        # Find template
        template_data = self.DEFAULT_TEMPLATES.get(template_name)
        if not template_data:
            return None
        
        # Find body component
        body = None
        for component in template_data["components"]:
            if component["type"] == "BODY":
                body = component["text"]
                break
        
        if not body:
            return None
        
        # Replace variables
        rendered = body
        for key, value in variables.items():
            rendered = rendered.replace(f"{{{{{key}}}}}", value)
        
        return rendered