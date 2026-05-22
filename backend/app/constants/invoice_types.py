"""
Constantes para tipos de comprobantes según SRI
"""

# Tipos de comprobantes
INVOICE_TYPES = {
    "01": "Factura",
    "02": "Nota de Crédito",
    "03": "Nota de Débito",
    "04": "Guía de Remisión",
    "05": "Comprobante de Retención",
    "06": "Comprobante de Venta",
    "07": "Liquidación de Compra",
}

# Ambientes SRI
SRI_ENVIRONMENTS = {
    "1": "Pruebas",
    "2": "Producción",
}

# Tipos de emisión
EMISSION_TYPES = {
    "1": "Normal",
    "2": "Indisponibilidad del sistema",
}

# Estados de autorización
AUTHORIZATION_STATUS = {
    "AUTORIZADO": "Autorizado",
    "NO_AUTORIZADO": "No Autorizado",
    "EN_PROCESO": "En Proceso",
    "RECHAZADO": "Rechazado",
    "DEVUELTA": "Devuelta",
}

# Códigos de error comunes SRI
SRI_ERROR_CODES = {
    "40": "Documento ya autorizado",
    "41": "Clave de acceso incorrecta",
    "42": "Documento no encontrado",
    "43": "Error en firma electrónica",
    "44": "Certificado inválido o caducado",
    "45": "RUC no válido",
    "46": "Ambiente no corresponde",
    "47": "Fechas fuera de rango",
}