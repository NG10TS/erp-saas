"""
Validators tests
"""
import pytest
from app.utils.validators import (
    validate_ecuadorian_id,
    validate_phone_ecuador,
    validate_email,
    validate_sri_key
)


def test_validate_cedula():
    """Test cédula validation"""
    # Valid cédula (example)
    valid, msg = validate_ecuadorian_id("1710034065")
    assert valid is True
    
    # Invalid length
    valid, msg = validate_ecuadorian_id("12345")
    assert valid is False
    assert "Longitud" in msg
    
    # Invalid province
    valid, msg = validate_ecuadorian_id("9912345678")
    assert valid is False
    assert "provincia" in msg.lower()
    
    # Invalid third digit
    valid, msg = validate_ecuadorian_id("1761234567")
    assert valid is False
    assert "tercer dígito" in msg.lower()


def test_validate_ruc():
    """Test RUC validation"""
    # Valid RUC (example)
    valid, msg = validate_ecuadorian_id("1790012345001")
    assert valid is True
    
    # Invalid RUC (wrong ending)
    valid, msg = validate_ecuadorian_id("1790012345123")
    assert valid is False
    assert "001, 002 o 003" in msg
    
    # Invalid cédula part
    valid, msg = validate_ecuadorian_id("1760012345001")
    assert valid is False
    assert "cédula inválida" in msg.lower()


def test_validate_phone():
    """Test phone validation"""
    # Valid celular
    valid, msg = validate_phone_ecuador("0999999999")
    assert valid is True
    
    # Valid with international code
    valid, msg = validate_phone_ecuador("+593999999999")
    assert valid is True
    
    # Valid fixed line
    valid, msg = validate_phone_ecuador("042999999")
    assert valid is True
    
    # Invalid
    valid, msg = validate_phone_ecuador("12345")
    assert valid is False


def test_validate_email():
    """Test email validation"""
    # Valid emails
    assert validate_email("test@example.com") is True
    assert validate_email("user.name+tag@domain.co") is True
    assert validate_email("valid_email@sub.domain.com") is True
    
    # Invalid emails
    assert validate_email("invalid-email") is False
    assert validate_email("missing@domain") is False
    assert validate_email("@domain.com") is False


def test_validate_sri_key():
    """Test SRI key validation"""
    # Valid key (example structure)
    valid_key = "1234567890123456789012345678901234567890123456789"
    valid, msg = validate_sri_key(valid_key)
    assert valid is True
    
    # Invalid length
    valid, msg = validate_sri_key("12345")
    assert valid is False
    assert "49 dígitos" in msg
    
    # Invalid characters
    valid, msg = validate_sri_key("A" * 49)
    assert valid is False