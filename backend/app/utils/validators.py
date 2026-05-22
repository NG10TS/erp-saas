# backend/app/utils/validators.py
"""
Validation utilities for Ecuadorian formats
"""
import re
from typing import Tuple, Optional


def validate_phone_ecuador(phone: str) -> Tuple[bool, str]:
    """
    Validate Ecuadorian phone number
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Tuple of (is_valid, message)
    """
    # Clean the phone number
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Patterns for Ecuadorian phone numbers
    patterns = [
        r'^\+593[0-9]{9}$',      # International: +593991234567
        r'^0[0-9]{9}$',           # National with 0: 0991234567
        r'^[0-9]{9}$',            # Local 9 digits: 991234567
    ]
    
    for pattern in patterns:
        if re.match(pattern, cleaned):
            return True, "Valid phone number"
    
    return False, "Invalid phone number format. Use: 0991234567 or +593991234567"


def validate_ecuadorian_id(identification: str) -> Tuple[bool, str]:
    """
    Validate Ecuadorian identification (cedula or RUC)
    
    Args:
        identification: Identification number to validate
        
    Returns:
        Tuple of (is_valid, message)
    """
    # Clean the identification
    cleaned = re.sub(r'[^0-9]', '', identification)
    
    # Cedula: 10 digits
    if len(cleaned) == 10:
        return validate_cedula(cleaned)
    
    # RUC: 13 digits
    elif len(cleaned) == 13:
        return validate_ruc(cleaned)
    
    else:
        return False, "Identification must be 10 digits (cedula) or 13 digits (RUC)"


def validate_cedula(cedula: str) -> Tuple[bool, str]:
    """
    Validate Ecuadorian cedula using modulo 10 algorithm
    """
    if not cedula.isdigit() or len(cedula) != 10:
        return False, "Cedula must be 10 digits"
    
    # Check province (first 2 digits 01-24)
    province = int(cedula[:2])
    if province < 1 or province > 24:
        return False, "Invalid province code"
    
    # Third digit must be < 6
    if int(cedula[2]) > 5:
        return False, "Invalid third digit"
    
    # Modulo 10 algorithm
    coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    
    for i in range(9):
        value = int(cedula[i]) * coefficients[i]
        if value > 9:
            value -= 9
        total += value
    
    check_digit = int(cedula[9])
    remainder = total % 10
    expected = 0 if remainder == 0 else 10 - remainder
    
    if expected == check_digit:
        return True, "Valid cedula"
    else:
        return False, "Invalid verification digit"


def validate_ruc(ruc: str) -> Tuple[bool, str]:
    """
    Validate Ecuadorian RUC
    """
    if not ruc.isdigit() or len(ruc) != 13:
        return False, "RUC must be 13 digits"
    
    # Check last 3 digits
    if ruc[-3:] not in ["001", "002", "003"]:
        return False, "RUC must end with 001, 002, or 003"
    
    # Validate first 10 digits as cedula
    cedula_valid, msg = validate_cedula(ruc[:10])
    if not cedula_valid:
        return False, f"Invalid cedula in RUC: {msg}"
    
    return True, "Valid RUC"


def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))