"""
WhatsApp integration tests
"""
import pytest
from unittest.mock import Mock, patch
from app.services.whatsapp.message_parser import WhatsAppMessageParser


def test_parse_order_message():
    """Test parsing order messages"""
    parser = WhatsAppMessageParser()
    
    # Test with quantities
    items = parser.parse_order_message("3 hamburguesas y 2 cocas")
    assert len(items) == 2
    assert items[0]["product"] == "hamburguesas"
    assert items[0]["quantity"] == 3
    assert items[1]["product"] == "cocas"
    assert items[1]["quantity"] == 2
    
    # Test without quantities (assume 1)
    items = parser.parse_order_message("hamburguesa, coca")
    assert len(items) == 2
    assert items[0]["quantity"] == 1
    assert items[1]["quantity"] == 1
    
    # Test with 'y' separator
    items = parser.parse_order_message("2 pizzas y 1 ensalada")
    assert len(items) == 2
    assert items[0]["product"] == "pizzas"
    assert items[0]["quantity"] == 2
    assert items[1]["product"] == "ensalada"
    assert items[1]["quantity"] == 1


def test_extract_intent():
    """Test intent extraction"""
    parser = WhatsAppMessageParser()
    
    # Test add items
    intent, data = parser.extract_intent("3 hamburguesas")
    assert intent == "add_items"
    assert len(data["items"]) == 1
    
    # Test view cart
    intent, data = parser.extract_intent("ver carrito")
    assert intent == "view_cart"
    
    # Test confirm order
    intent, data = parser.extract_intent("confirmar")
    assert intent == "confirm_order"
    
    # Test cancel order
    intent, data = parser.extract_intent("cancelar")
    assert intent == "cancel_order"
    
    # Test show menu
    intent, data = parser.extract_intent("menu")
    assert intent == "show_menu"
    
    # Test unknown
    intent, data = parser.extract_intent("hola que tal")
    assert intent == "unknown"


def test_match_products_with_catalog():
    """Test product matching"""
    parser = WhatsAppMessageParser()
    
    catalog = [
        {"id": "1", "name": "hamburguesa", "price": 5.00, "stock": 10},
        {"id": "2", "name": "coca cola", "price": 1.50, "stock": 20},
        {"id": "3", "name": "papas fritas", "price": 2.50, "stock": 15}
    ]
    
    items = [
        {"product": "hamburguesa", "quantity": 2},
        {"product": "coca", "quantity": 3},
        {"product": "inexistente", "quantity": 1}
    ]
    
    matched = parser.match_products_with_catalog(items, catalog)
    
    assert len(matched) == 3
    assert matched[0]["product_id"] == "1"
    assert matched[0]["found"] is not False
    assert matched[1]["product_id"] == "2"
    assert matched[2]["found"] is False


def test_format_cart_message():
    """Test cart message formatting"""
    parser = WhatsAppMessageParser()
    
    items = [
        {"product_name": "Hamburguesa", "quantity": 2, "price": 5.00},
        {"product_name": "Coca Cola", "quantity": 1, "price": 1.50}
    ]
    total = 11.50
    
    message = parser.format_cart_message(items, total)
    
    assert "🛒 *Tu pedido:*" in message
    assert "2x Hamburguesa: $10.00" in message
    assert "1x Coca Cola: $1.50" in message
    assert "*Total: $11.50*" in message


def test_format_welcome_message():
    """Test welcome message formatting"""
    parser = WhatsAppMessageParser()
    
    message = parser.format_welcome_message("Test Shop")
    
    assert "Bienvenido a *Test Shop*" in message
    assert "3 hamburguesas y 2 cocas" in message
    assert "ver carrito" in message