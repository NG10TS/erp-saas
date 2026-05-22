"""
Códigos de error personalizados
"""

class ErrorCodes:
    """Códigos de error para la API"""
    
    # Autenticación (1000-1999)
    AUTH_INVALID_CREDENTIALS = "AUTH_001"
    AUTH_TOKEN_EXPIRED = "AUTH_002"
    AUTH_INVALID_TOKEN = "AUTH_003"
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_004"
    AUTH_ACCOUNT_DISABLED = "AUTH_005"
    
    # Negocio (2000-2999)
    BUSINESS_NOT_FOUND = "BUS_001"
    BUSINESS_INACTIVE = "BUS_002"
    BUSINESS_LIMIT_REACHED = "BUS_003"
    BUSINESS_SUBSCRIPTION_EXPIRED = "BUS_004"
    
    # Productos (3000-3999)
    PRODUCT_NOT_FOUND = "PROD_001"
    PRODUCT_INSUFFICIENT_STOCK = "PROD_002"
    PRODUCT_INACTIVE = "PROD_003"
    PRODUCT_DUPLICATE_SKU = "PROD_004"
    
    # Ventas (4000-4999)
    SALE_NOT_FOUND = "SALE_001"
    SALE_CANNOT_MODIFY = "SALE_002"
    SALE_ALREADY_INVOICED = "SALE_003"
    SALE_PAYMENT_FAILED = "SALE_004"
    
    # Facturas (5000-5999)
    INVOICE_NOT_FOUND = "INV_001"
    INVOICE_GENERATION_FAILED = "INV_002"
    INVOICE_SRI_ERROR = "INV_003"
    INVOICE_ALREADY_AUTHORIZED = "INV_004"
    INVOICE_CERTIFICATE_ERROR = "INV_005"
    
    # WhatsApp (6000-6999)
    WHATSAPP_SEND_FAILED = "WA_001"
    WHATSAPP_INVALID_NUMBER = "WA_002"
    WHATSAPP_TEMPLATE_ERROR = "WA_003"
    WHATSAPP_WEBHOOK_ERROR = "WA_004"
    
    # Validación (7000-7999)
    VALIDATION_INVALID_RUC = "VAL_001"
    VALIDATION_INVALID_PHONE = "VAL_002"
    VALIDATION_INVALID_EMAIL = "VAL_003"
    VALIDATION_REQUIRED_FIELD = "VAL_004"
    
    # Base de datos (8000-8999)
    DB_CONNECTION_ERROR = "DB_001"
    DB_INTEGRITY_ERROR = "DB_002"
    DB_TIMEOUT_ERROR = "DB_003"
    
    # Rate limiting (9000-9999)
    RATE_LIMIT_EXCEEDED = "RATE_001"

ERROR_MESSAGES = {
    # Español
    "es": {
        ErrorCodes.AUTH_INVALID_CREDENTIALS: "Credenciales inválidas",
        ErrorCodes.AUTH_TOKEN_EXPIRED: "Sesión expirada, inicie sesión nuevamente",
        ErrorCodes.AUTH_INVALID_TOKEN: "Token inválido",
        ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS: "No tiene permisos para esta acción",
        ErrorCodes.PRODUCT_INSUFFICIENT_STOCK: "Stock insuficiente para el producto {product}",
        ErrorCodes.INVOICE_SRI_ERROR: "Error al enviar al SRI: {error}",
        ErrorCodes.RATE_LIMIT_EXCEEDED: "Demasiadas solicitudes, intente en {seconds} segundos",
    },
    # Inglés
    "en": {
        ErrorCodes.AUTH_INVALID_CREDENTIALS: "Invalid credentials",
        ErrorCodes.AUTH_TOKEN_EXPIRED: "Session expired, please login again",
        ErrorCodes.AUTH_INVALID_TOKEN: "Invalid token",
        ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
        ErrorCodes.PRODUCT_INSUFFICIENT_STOCK: "Insufficient stock for product {product}",
        ErrorCodes.INVOICE_SRI_ERROR: "Error sending to SRI: {error}",
        ErrorCodes.RATE_LIMIT_EXCEEDED: "Too many requests, try again in {seconds} seconds",
    }
}

def get_error_message(code: str, lang: str = "es", **kwargs) -> str:
    """Obtiene mensaje de error formateado"""
    messages = ERROR_MESSAGES.get(lang, ERROR_MESSAGES["es"])
    message = messages.get(code, "Error desconocido")
    return message.format(**kwargs)