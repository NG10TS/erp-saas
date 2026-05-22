"""
Generador XML para Notas de Crédito SRI Ecuador
Esquema XSD: notaCredito/v1.1.0
"""
from lxml import etree
from datetime import datetime, date
from typing import Dict, List, Any, Tuple, Optional
from decimal import Decimal, ROUND_HALF_UP

from app.services.sri.access_key import AccessKeyGenerator

logger = __import__('logging').getLogger(__name__)

# Tipos de nota de crédito según SRI
TIPOS_NOTA_CREDITO = {
    "01": "Anulación",
    "02": "Devolución",
    "03": "Descuento",
    "04": "Bonificación",
}


class NotaCreditoXMLGenerator:
    """Genera XML de Nota de Crédito Electrónica según SRI Ecuador"""
    
    def generate_credit_note_xml(
        self,
        nota_data: Dict[str, Any],
        business_data: Dict[str, Any],
        invoice_data: Dict[str, Any],
        items: List[Dict[str, Any]],
    ) -> Tuple[str, str]:
        """
        Genera XML de nota de crédito.
        
        Args:
            nota_data: {
                "sequential": "001-001-000000001",
                "issue_date": datetime,
                "tipo_nota": "01",  # 01=Anulación, 02=Devolución, 03=Descuento
                "motivo": str,
                "numero_factura_modificada": str,
                "fecha_factura_modificada": datetime,
                "subtotal": Decimal,
                "iva": Decimal,
                "total": Decimal,
            }
            business_data: Datos del emisor
            invoice_data: Datos de la factura original
            items: Ítems a corregir
            
        Returns:
            Tuple[str, str]: (xml_string, access_key)
        """
        # Generar clave de acceso
        sequential_parts = nota_data["sequential"].split("-")
        access_key = AccessKeyGenerator.generate(
            comprobante_tipo="04",  # 04 = Nota de Crédito
            ruc=business_data["ruc"],
            ambiente=business_data["sri_environment"],
            establecimiento=sequential_parts[0],
            punto_emision=sequential_parts[1],
            secuencial=sequential_parts[2],
            fecha_emision=nota_data["issue_date"],
        )
        
        # Crear XML
        root = etree.Element(
            "notaCredito",
            id="comprobante",
            version="1.1.0",
            nsmap={
                None: "http://www.sri.gob.ec/schema/notaCredito/v1.1.0",
                "ds": "http://www.w3.org/2000/09/xmldsig#",
            }
        )
        
        # infoTributaria
        info_trib = etree.SubElement(root, "infoTributaria")
        self._add_info_tributaria(info_trib, business_data, access_key, sequential_parts)
        
        # infoNotaCredito
        info_nota = etree.SubElement(root, "infoNotaCredito")
        self._add_info_nota_credito(info_nota, nota_data, business_data, invoice_data)
        
        # detalles
        detalles = etree.SubElement(root, "detalles")
        self._add_detalles(detalles, items)
        
        # infoAdicional
        if nota_data.get("motivo"):
            info_adic = etree.SubElement(root, "infoAdicional")
            campo = etree.SubElement(info_adic, "campoAdicional")
            campo.set("nombre", "Motivo")
            campo.text = nota_data["motivo"][:300]
        
        return self._to_string(root), access_key
    
    def _add_info_tributaria(self, parent, business_data, access_key, sequential_parts):
        """Agrega infoTributaria"""
        fields = [
            ("ambiente", business_data["sri_environment"]),
            ("tipoEmision", "1"),
            ("razonSocial", business_data["business_name"][:300]),
            ("nombreComercial", business_data.get("commercial_name", "")[:300]),
            ("ruc", business_data["ruc"]),
            ("claveAcceso", access_key),
            ("codDoc", "04"),  # Nota de Crédito
            ("estab", sequential_parts[0]),
            ("ptoEmi", sequential_parts[1]),
            ("secuencial", sequential_parts[2]),
            ("dirMatriz", business_data.get("address", "Ecuador")[:300]),
        ]
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
    
    def _add_info_nota_credito(self, parent, nota_data, business_data, invoice_data):
        """Agrega infoNotaCredito"""
        issue_date = nota_data["issue_date"]
        if isinstance(issue_date, datetime):
            issue_date = issue_date.date()
        
        fecha_factura = nota_data.get("fecha_factura_modificada")
        if isinstance(fecha_factura, datetime):
            fecha_factura = fecha_factura.strftime("%d/%m/%Y")
        
        fields = [
            ("fechaEmision", issue_date.strftime("%d/%m/%Y")),
            ("dirEstablecimiento", business_data.get("address", "Ecuador")[:300]),
            ("tipoIdentificacionComprador", "07"),
            ("razonSocialComprador", invoice_data.get("customer_name", "CONSUMIDOR FINAL")),
            ("identificacionComprador", invoice_data.get("customer_identification", "9999999999999")),
            ("contribuyenteEspecial", ""),
            ("obligadoContabilidad", "SI"),
            ("codDocModificado", "01"),  # 01 = Factura
            ("numDocModificado", nota_data.get("numero_factura_modificada", "")),
            ("fechaEmisionDocSustento", fecha_factura or issue_date.strftime("%d/%m/%Y")),
            ("totalSinImpuestos", self._fmt(nota_data["subtotal"])),
            ("valorModificacion", self._fmt(nota_data["total"])),
            ("moneda", "DOLAR"),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
        
        # totalConImpuestos
        total_impuestos = etree.SubElement(parent, "totalConImpuestos")
        total_impuesto = etree.SubElement(total_impuestos, "totalImpuesto")
        
        iva_fields = [
            ("codigo", "2"),
            ("codigoPorcentaje", "4"),
            ("baseImponible", self._fmt(nota_data["subtotal"])),
            ("valor", self._fmt(nota_data["iva"])),
        ]
        for tag, value in iva_fields:
            elem = etree.SubElement(total_impuesto, tag)
            elem.text = str(value)
        
        # motivo
        etree.SubElement(parent, "motivo").text = nota_data.get("motivo", "")[:300]
    
    def _add_detalles(self, parent, items):
        """Agrega detalles de la nota de crédito"""
        for item in items:
            detalle = etree.SubElement(parent, "detalle")
            
            fields = [
                ("codigoInterno", item.get("product_sku", "SIN-CODIGO")[:25]),
                ("descripcion", item["product_name"][:300]),
                ("cantidad", self._fmt(item["quantity"])),
                ("precioUnitario", self._fmt(item["unit_price"])),
                ("descuento", self._fmt(item.get("discount", 0))),
                ("precioTotalSinImpuesto", self._fmt(item["total_price"])),
            ]
            
            for tag, value in fields:
                elem = etree.SubElement(detalle, tag)
                elem.text = str(value)
            
            # Impuestos del ítem
            impuestos = etree.SubElement(detalle, "impuestos")
            impuesto = etree.SubElement(impuestos, "impuesto")
            
            imp_fields = [
                ("codigo", "2"),
                ("codigoPorcentaje", "4"),
                ("tarifa", "15"),
                ("baseImponible", self._fmt(item["total_price"])),
                ("valor", self._fmt(item.get("iva_amount", 0))),
            ]
            
            for tag, value in imp_fields:
                elem = etree.SubElement(impuesto, tag)
                elem.text = str(value)
    
    @staticmethod
    def _fmt(value) -> str:
        if value is None:
            return "0.00"
        d = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return f"{d:.2f}"
    
    @staticmethod
    def _to_string(root: etree.Element) -> str:
        return etree.tostring(
            root, encoding="UTF-8", xml_declaration=True, pretty_print=True
        ).decode("utf-8")