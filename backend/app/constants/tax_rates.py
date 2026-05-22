"""
Constantes para impuestos según SRI Ecuador
"""

# Tarifas de IVA
IVA_ZERO = 0.0      # 0% (bienes y servicios gravados con tarifa 0%)
IVA_TWELVE = 12.0   # 12% (tarifa general)
IVA_FOURTEEN = 14.0 # 14% (aumenta en 2024)
IVA_FIFTEEN = 15.0  # 15% (tarifa futura)

# Códigos de IVA para SRI
IVA_CODES = {
    IVA_ZERO: "0",
    IVA_TWELVE: "2",
    IVA_FOURTEEN: "3",
    IVA_FIFTEEN: "4",
}

# Códigos de porcentaje de IVA
IVA_PERCENTAGE_CODES = {
    IVA_ZERO: "0",
    IVA_TWELVE: "2",
    IVA_FOURTEEN: "3",
    IVA_FIFTEEN: "4",
}

# Tarifas de ICE (Impuesto a los Consumos Especiales)
ICE_RATES = {
    "cervezas": 75.0,      # 75% para cervezas
    "bebidas_gaseosas": 10.0,  # 10% para bebidas gaseosas
    "alcohol": 75.0,       # 75% para bebidas alcohólicas
    "cigarrillos": 150.0,  # 150% para cigarrillos
    "perfumes": 20.0,      # 20% para perfumes y cosméticos
}

# Tipos de identificación según SRI
IDENTIFICATION_TYPES = {
    "04": "RUC",
    "05": "Cédula",
    "06": "Pasaporte",
    "07": "Consumidor Final",
    "08": "Identificación del Exterior",
}