"""
WhatsApp Message Parser
Parses incoming messages to extract intents and items
"""
import re
from typing import List, Dict, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class WhatsAppMessageParser:
    """Parse WhatsApp messages to extract order information"""
    
    # Patterns for Spanish
    PATTERNS = {
        "quantity": r'(\d+)\s*(?:unidades?|uds?|x)?\s*',
        "product": r'(?:de\s+)?([a-zA-ZáéíóúñÑ\s]+?)(?=\s+y|\s*$|,\s*)',
        "separator": r'\s*(?:,|\s+y\s+)\s*'
    }
    
    # Common commands
    COMMANDS = {
        "ver carrito": "view_cart",
        "carrito": "view_cart",
        "mi pedido": "view_cart",
        "confirmar": "confirm_order",
        "confirmar pedido": "confirm_order",
        "si": "confirm_order",
        "sí": "confirm_order",
        "ok": "confirm_order",
        "cancelar": "cancel_order",
        "cancelar pedido": "cancel_order",
        "no": "cancel_order",
        "menu": "show_menu",
        "opciones": "show_menu",
        "ayuda": "show_menu",
        "hola": "show_menu",
        "inicio": "show_menu",
        "facturar": "checkout",
        "pagar": "checkout",
        "terminar": "checkout"
    }

    FILLER_PHRASES = [
        "quiero",
        "dame",
        "necesito",
        "quisiera",
        "por favor",
        "me das",
        "me llevas",
        "agrega",
        "agregame",
    ]

    STOPWORDS = {
        "el", "la", "los", "las", "un", "una", "unos", "unas",
        "de", "del", "para", "por", "favor",
    }

    @classmethod
    def normalize_text(cls, value: str) -> str:
        """Normalize message/product text for matching."""
        text = value.lower().strip()
        text = re.sub(r'[^\w\sáéíóúñ]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @classmethod
    def cleanup_product_name(cls, value: str) -> str:
        """Remove filler words while preserving useful attributes like colors."""
        text = cls.normalize_text(value)
        tokens = [token for token in text.split() if token not in cls.STOPWORDS]
        return " ".join(tokens).strip()

    @classmethod
    def token_overlap_score(cls, requested: str, candidate: str) -> float:
        """Compute a basic score using token overlap plus substring bonuses."""
        requested_text = cls.cleanup_product_name(requested)
        candidate_text = cls.cleanup_product_name(candidate)

        if not requested_text or not candidate_text:
            return 0.0

        if requested_text == candidate_text:
            return 1.0

        if requested_text in candidate_text:
            return max(0.8, len(requested_text) / max(len(candidate_text), 1))

        requested_tokens = set(requested_text.split())
        candidate_tokens = set(candidate_text.split())
        if not requested_tokens or not candidate_tokens:
            return 0.0

        overlap = requested_tokens & candidate_tokens
        return len(overlap) / len(requested_tokens)
    
    @classmethod
    def parse_order_message(cls, message: str) -> List[Dict[str, Any]]:
        """
        Parse order message into items
        
        Example:
            "3 hamburguesas y 2 cocas" ->
            [{"product": "hamburguesas", "quantity": 3},
             {"product": "cocas", "quantity": 2}]
        
        Args:
            message: Raw message text
            
        Returns:
            List of parsed items
        """
        items = []
        
        # Normalize text
        text = cls.normalize_text(message)

        for phrase in cls.FILLER_PHRASES:
            text = re.sub(rf'^{re.escape(phrase)}\s+', '', text)
            text = re.sub(rf'\b{re.escape(phrase)}\b', '', text)

        text = re.sub(r'\s+', ' ', text).strip()
        
        # Split by 'y' or commas
        parts = re.split(r'\s+(?:y|,)\s+|\s*,\s*', text)
        
        for part in parts:
            if not part:
                continue
            
            # Look for quantity
            quantity_match = re.match(r'^(\d+)(?:\s|$)', part)
            if quantity_match:
                quantity = int(quantity_match.group(1))
                # Rest is product
                product = cls.cleanup_product_name(part[quantity_match.end():])
                if product:
                    items.append({
                        "product": product,
                        "quantity": quantity,
                        "original": part
                    })
            else:
                # No quantity specified, assume 1
                cleaned_part = cls.cleanup_product_name(part)
                if not cleaned_part:
                    continue
                items.append({
                    "product": cleaned_part,
                    "quantity": 1,
                    "original": part
                })
        
        return items
    
    @classmethod
    def extract_intent(cls, message: str) -> Tuple[str, Optional[Dict]]:
        """
        Determine user intent from message
        
        Args:
            message: Raw message text
            
        Returns:
            Tuple of (intent, data)
        """
        text = cls.normalize_text(message)
        
        # Check for exact commands
        for command, intent in cls.COMMANDS.items():
            if text == command or text.startswith(command):
                return intent, None
        
        # Check for order (has numbers or order keywords)
        if re.search(r'\d+', text) or any(
            word in text for word in ["quiero", "dame", "necesito", "quisiera"]
        ):
            items = cls.parse_order_message(text)
            if items:
                return "add_items", {"items": items}
        
        # Unknown intent
        return "unknown", {"text": text}
    
    @classmethod
    def match_products_with_catalog(
        cls,
        items: List[Dict[str, Any]],
        catalog: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Match parsed items with actual products in catalog
        
        Args:
            items: Parsed items from message
            catalog: List of products with name, id, price, stock
            
        Returns:
            List of matched items with product info
        """
        matched_items = []
        
        for item in items:
            product_name = cls.cleanup_product_name(item["product"])
            best_match = None
            best_score = 0
            
            for product in catalog:
                score = cls.token_overlap_score(product_name, product["name"])
                if score > best_score:
                    best_score = score
                    best_match = product
            
            if best_match and best_score >= 0.5:
                matched_items.append({
                    "product_id": best_match["id"],
                    "product_name": best_match["name"],
                    "requested_name": product_name,
                    "quantity": item["quantity"],
                    "price": float(best_match["price"]),
                    "available": best_match["stock"] >= item["quantity"],
                    "match_score": best_score
                })
            else:
                # Product not found
                matched_items.append({
                    "product_id": None,
                    "product_name": None,
                    "requested_name": product_name,
                    "quantity": item["quantity"],
                    "found": False
                })
        
        return matched_items
    
    @classmethod
    def format_cart_message(cls, items: List[Dict], total: float) -> str:
        """
        Format cart contents for WhatsApp message
        
        Args:
            items: List of cart items
            total: Total amount
            
        Returns:
            Formatted message
        """
        if not items:
            return "🛒 Tu carrito está vacío"
        
        lines = ["🛒 *Tu pedido:*"]
        
        for item in items:
            lines.append(
                f"• {item['quantity']}x {item['product_name']}: "
                f"${item['quantity'] * item['price']:.2f}"
            )
        
        lines.append(f"\n💰 *Total: ${total:.2f}*")
        lines.append("\n¿Confirmar pedido? (responde 'confirmar')")
        
        return "\n".join(lines)
    
    @classmethod
    def format_order_confirmation(cls, items: List[Dict], total: float) -> str:
        """
        Format order confirmation message
        
        Args:
            items: List of items
            total: Total amount
            
        Returns:
            Formatted message
        """
        lines = ["✅ *Pedido confirmado!*"]
        lines.append("\n*Resumen:*")
        
        for item in items:
            lines.append(f"• {item['quantity']}x {item['product_name']}")
        
        lines.append(f"\n💰 *Total: ${total:.2f}*")
        lines.append("\nTe enviaremos la factura en unos momentos.")
        
        return "\n".join(lines)
    
    @classmethod
    def format_welcome_message(cls, business_name: str) -> str:
        """
        Format welcome message
        
        Args:
            business_name: Business name
            
        Returns:
            Formatted message
        """
        return f"""
👋 ¡Hola! Bienvenido a *{business_name}*

Puedes hacer tu pedido escribiendo los productos que deseas, por ejemplo:
"3 hamburguesas y 2 cocas"

*Comandos disponibles:*
• Ver carrito: "ver carrito"
• Confirmar: "confirmar"
• Cancelar: "cancelar"
• Menú: "menu"

¿Qué te gustaría ordenar?
"""
