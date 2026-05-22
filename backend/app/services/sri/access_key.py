"""
Generador de Clave de Acceso para SRI Ecuador
Algoritmo: Módulo 11 con dígito verificador
Estructura: 49 dígitos = 48 + 1 dígito verificador

Formato oficial SRI:
[0:2]   Tipo comprobante     (2)
[2:5]   Establecimiento      (3)
[5:8]   Punto emisión        (3)
[8:17]  Secuencial           (9)
[17:20] Código documento     (3)
[20:21] Tipo emisión         (1)
[21:23] Ambiente             (2)
[23:29] Fecha DDMMAA         (6)
[29:42] RUC                  (13)
[42:48] Código numérico      (6)
[48]    Dígito verificador   (1)
TOTAL: 49 dígitos
"""
import random
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AccessKeyGenerator:
    """
    Genera clave de acceso de 49 dígitos según especificación SRI Ecuador.
    
    La clave de acceso es el identificador único de cada comprobante electrónico.
    Se compone de 48 dígitos de información + 1 dígito verificador (módulo 11).
    """
    
    # Códigos de documento según tipo de comprobante
    DOCUMENT_CODES = {
        "01": "001",  # Factura
        "04": "004",  # Nota de Crédito
        "05": "005",  # Nota de Débito
        "06": "006",  # Guía de Remisión
        "07": "007",  # Comprobante de Retención
    }
    
    # Nombres legibles de tipos de comprobante
    DOCUMENT_NAMES = {
        "01": "Factura",
        "04": "Nota de Crédito",
        "05": "Nota de Débito",
        "06": "Guía de Remisión",
        "07": "Comprobante de Retención",
    }
    
    @classmethod
    def generate(
        cls,
        comprobante_tipo: str,
        ruc: str,
        ambiente: str,
        secuencial: str,
        emision_tipo: str = "1",
        establecimiento: str = "001",
        punto_emision: str = "001",
        fecha_emision: Optional[datetime] = None,
    ) -> str:
        """
        Genera clave de acceso de 49 dígitos.
        
        Args:
            comprobante_tipo: Tipo de comprobante ("01", "04", "05", "06", "07")
            ruc: RUC del emisor (13 dígitos)
            ambiente: Ambiente SRI ("1"=Pruebas, "2"=Producción)
            secuencial: Número secuencial (9 dígitos)
            emision_tipo: Tipo de emisión ("1"=Normal, "2"=Contingencia)
            establecimiento: Código del establecimiento (3 dígitos)
            punto_emision: Código del punto de emisión (3 dígitos)
            fecha_emision: Fecha de emisión (por defecto: ahora)
            
        Returns:
            Clave de acceso de 49 dígitos
            
        Raises:
            ValueError: Si algún parámetro no cumple el formato requerido
        """
        if fecha_emision is None:
            fecha_emision = datetime.now()
        
        # ─── Validación y normalización de formatos ─────────────────
        ruc = ruc.strip()
        if len(ruc) != 13 or not ruc.isdigit():
            raise ValueError(f"RUC debe tener 13 dígitos numéricos, tiene {len(ruc)}: {ruc}")
        
        secuencial = secuencial.zfill(9)
        if len(secuencial) != 9 or not secuencial.isdigit():
            raise ValueError(f"Secuencial debe tener 9 dígitos, tiene {len(secuencial)}")
        
        establecimiento = establecimiento.zfill(3)
        if len(establecimiento) != 3:
            raise ValueError(f"Establecimiento debe tener 3 dígitos")
        
        punto_emision = punto_emision.zfill(3)
        if len(punto_emision) != 3:
            raise ValueError(f"Punto de emisión debe tener 3 dígitos")
        
        ambiente = ambiente.zfill(2)
        if len(ambiente) != 2 or not ambiente.isdigit():
            raise ValueError(f"Ambiente debe tener 2 dígitos: {ambiente}")
        
        if emision_tipo not in ("1", "2"):
            raise ValueError(f"Tipo de emisión inválido: {emision_tipo}. Debe ser '1' o '2'")
        
        # ─── Código de documento ────────────────────────────────────
        codigo_documento = cls.DOCUMENT_CODES.get(comprobante_tipo)
        if not codigo_documento:
            raise ValueError(
                f"Tipo de comprobante inválido: {comprobante_tipo}. "
                f"Válidos: {list(cls.DOCUMENT_CODES.keys())}"
            )
        
        # ─── Código numérico aleatorio (6 dígitos) ──────────────────
        codigo_numerico = str(random.randint(100000, 999999))
        
        # ─── Construir base de 48 dígitos ───────────────────────────
        base_parts = [
            comprobante_tipo,                            # 2 dígitos
            establecimiento,                             # 3 dígitos
            punto_emision,                               # 3 dígitos
            secuencial,                                  # 9 dígitos
            codigo_documento,                            # 3 dígitos
            emision_tipo,                                # 1 dígito
            ambiente,                                    # 2 dígitos
            fecha_emision.strftime("%d%m%y"),            # 6 dígitos (DDMMAA)
            ruc,                                         # 13 dígitos
            codigo_numerico,                             # 6 dígitos
        ]
        
        base = "".join(base_parts)
        
        if len(base) != 48:
            raise ValueError(
                f"Error interno: la base debe tener 48 dígitos, tiene {len(base)}. "
                f"Partes: {[len(p) for p in base_parts]} = {sum(len(p) for p in base_parts)}"
            )
        
        # ─── Calcular dígito verificador (Módulo 11) ────────────────
        verificador = cls._calculate_mod11(base)
        
        access_key = base + verificador
        
        logger.debug(f"Clave de acceso generada: {access_key}")
        return access_key
    
    @classmethod
    def _calculate_mod11(cls, base: str) -> str:
        """
        Calcula el dígito verificador usando el algoritmo de Módulo 11.
        
        Algoritmo oficial SRI:
        1. Multiplicar cada dígito por 2,3,4,5,6,7 (cíclico) de derecha a izquierda
        2. Sumar todos los productos
        3. Calcular residuo: suma % 11
        4. Restar de 11: 11 - residuo
        5. Si resultado = 11 → 0; si resultado = 10 → 1
        
        Args:
            base: 48 dígitos de la clave de acceso
            
        Returns:
            Dígito verificador (0-9)
        """
        # Factores cíclicos: 2,3,4,5,6,7 repetidos para cubrir 48 dígitos
        coefficients = [2, 3, 4, 5, 6, 7] * 8  # 6 * 8 = 48
        
        total = 0
        for i, char in enumerate(reversed(base)):
            digit = int(char)
            coef = coefficients[i % len(coefficients)]
            total += digit * coef
        
        remainder = total % 11
        result = 11 - remainder
        
        if result == 11:
            return "0"
        elif result == 10:
            return "1"
        else:
            return str(result)
    
    @classmethod
    def validate(cls, access_key: str) -> bool:
        """
        Valida que una clave de acceso sea correcta verificando:
        1. Longitud de 49 dígitos
        2. Solo caracteres numéricos
        3. Dígito verificador correcto
        
        Args:
            access_key: Clave de acceso completa (49 dígitos)
            
        Returns:
            True si es válida, False en caso contrario
        """
        if not access_key or len(access_key) != 49:
            return False
        
        if not access_key.isdigit():
            return False
        
        base = access_key[:48]
        provided_verifier = access_key[48]
        
        try:
            calculated_verifier = cls._calculate_mod11(base)
            return calculated_verifier == provided_verifier
        except Exception as e:
            logger.warning(f"Error validando clave de acceso: {e}")
            return False
    
    @classmethod
    def parse(cls, access_key: str) -> dict:
        """
        Desglosa una clave de acceso en sus componentes legibles.
        
        Args:
            access_key: Clave de acceso completa (49 dígitos)
            
        Returns:
            Diccionario con los componentes de la clave
            
        Raises:
            ValueError: Si la clave no tiene 49 dígitos o no es numérica
        """
        if len(access_key) != 49:
            raise ValueError(f"La clave de acceso debe tener 49 dígitos, tiene {len(access_key)}")
        
        if not access_key.isdigit():
            raise ValueError("La clave de acceso solo debe contener dígitos")
        
        fecha_str = access_key[23:29]  # DDMMAA
        
        return {
            "clave_completa": access_key,
            "tipo_comprobante": access_key[0:2],
            "tipo_comprobante_nombre": cls.DOCUMENT_NAMES.get(access_key[0:2], "Desconocido"),
            "establecimiento": access_key[2:5],
            "punto_emision": access_key[5:8],
            "numero_comprobante": f"{access_key[2:5]}-{access_key[5:8]}-{access_key[8:17]}",
            "secuencial": access_key[8:17],
            "codigo_documento": access_key[17:20],
            "tipo_emision": access_key[20:21],
            "tipo_emision_nombre": "Normal" if access_key[20:21] == "1" else "Contingencia",
            "ambiente": access_key[21:23],
            "ambiente_nombre": "Pruebas" if access_key[21:23] == "01" else "Producción",
            "fecha_emision": f"20{fecha_str[4:6]}-{fecha_str[2:4]}-{fecha_str[0:2]}",
            "ruc": access_key[29:42],
            "codigo_numerico": access_key[42:48],
            "digito_verificador": access_key[48],
            "es_valida": cls.validate(access_key),
        }