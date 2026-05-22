"""
SRI XML Generator - Versión CORREGIDA
Cumple con esquema XSD 1.1.0 del SRI Ecuador
RETORNA: (xml_string, access_key)
"""
from lxml import etree
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
import logging

from app.services.sri.access_key import AccessKeyGenerator

logger = logging.getLogger(__name__)

# Fecha de cambio de IVA
IVA_15_EFFECTIVE_DATE = date(2024, 5, 1)


class SRIXMLGenerator:
    """Generador XML compatible 100% con esquema SRI"""
    
    def generate_invoice_xml(
        self,
        invoice_data: Dict[str, Any],
        business_data: Dict[str, Any],
        items: List[Dict[str, Any]],
    ) -> Tuple[str, str]:
        """
        Genera XML de factura electrónica.
        
        Args:
            invoice_data: {
                "sequential": "001-001-000000001",
                "issue_date": datetime,
                "subtotal": Decimal,
                "iva": Decimal,
                "total": Decimal,
                "discount": Decimal,
                "payment_method": "01",
                "notes": "",
            }
            business_data: {
                "ruc": str,
                "business_name": str,
                "commercial_name": str,
                "address": str,
                "sri_environment": "1" or "2",
            }
            items: [{
                "product_sku": str,
                "product_name": str,
                "quantity": Decimal,
                "unit_price": Decimal,
                "discount": Decimal,
                "total_price": Decimal,
                "iva_percentage": int,
            }]
            
        Returns:
            Tuple[str, str]: (xml_string, access_key)
        """
        # Generar clave de acceso
        sequential_parts = invoice_data["sequential"].split("-")
        access_key = AccessKeyGenerator.generate(
            comprobante_tipo="01",
            ruc=business_data["ruc"],
            ambiente=business_data["sri_environment"],
            establecimiento=sequential_parts[0],
            punto_emision=sequential_parts[1],
            secuencial=sequential_parts[2],
            fecha_emision=invoice_data["issue_date"],
        )
        
        # Crear XML
        root = etree.Element(
            "factura",
            id="comprobante",
            version="1.1.0",
            nsmap={
                None: "http://www.sri.gob.ec/schema/factura/v1.1.0",
                "ds": "http://www.w3.org/2000/09/xmldsig#",
            }
        )
        
        # infoTributaria
        info_trib = etree.SubElement(root, "infoTributaria")
        self._add_info_tributaria(info_trib, business_data, access_key, 
                                   sequential_parts, comprobante_tipo="01")
        
        # infoFactura
        info_fact = etree.SubElement(root, "infoFactura")
        self._add_info_factura(info_fact, invoice_data, business_data)
        
        # detalles
        detalles = etree.SubElement(root, "detalles")
        self._add_detalles(detalles, items, invoice_data["issue_date"])
        
        # infoAdicional
        if invoice_data.get("notes"):
            info_adic = etree.SubElement(root, "infoAdicional")
            self._add_info_adicional(info_adic, invoice_data["notes"])
        
        # Retornar XML y clave de acceso
        return self._to_string(root), access_key
    
    # ... (el resto de métodos privados igual, sin cambios)
    
    def _add_info_tributaria(self, parent, business_data, access_key, 
                             sequential_parts, comprobante_tipo="01"):
        """Agrega infoTributaria según XSD"""
        fields = [
            ("ambiente", business_data["sri_environment"]),
            ("tipoEmision", "1"),
            ("razonSocial", business_data["business_name"][:300]),
            ("nombreComercial", business_data.get("commercial_name", "")[:300]),
            ("ruc", business_data["ruc"]),
            ("claveAcceso", access_key),
            ("codDoc", comprobante_tipo),
            ("estab", sequential_parts[0]),
            ("ptoEmi", sequential_parts[1]),
            ("secuencial", sequential_parts[2]),
            ("dirMatriz", business_data.get("address", "Ecuador")[:300]),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
    
    def _add_info_factura(self, parent, invoice_data, business_data):
        """Agrega infoFactura según XSD"""
        issue_date = invoice_data["issue_date"]
        if isinstance(issue_date, datetime):
            issue_date = issue_date.date()
        
        fields = [
            ("fechaEmision", issue_date.strftime("%d/%m/%Y")),
            ("dirEstablecimiento", business_data.get("address", "Ecuador")[:300]),
            ("contribuyenteEspecial", ""),
            ("obligadoContabilidad", "SI"),
            ("tipoIdentificacionComprador", "07"),
            ("razonSocialComprador", "CONSUMIDOR FINAL"),
            ("identificacionComprador", "9999999999999"),
            ("direccionComprador", ""),
            ("totalSinImpuestos", self._fmt(invoice_data["subtotal"])),
            ("totalDescuento", self._fmt(invoice_data.get("discount", 0))),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value)
        
        total_impuestos = etree.SubElement(parent, "totalConImpuestos")
        self._add_total_impuestos(total_impuestos, invoice_data)
        
        etree.SubElement(parent, "propina").text = "0.00"
        etree.SubElement(parent, "importeTotal").text = self._fmt(invoice_data["total"])
        etree.SubElement(parent, "moneda").text = "DOLAR"
        
        pagos = etree.SubElement(parent, "pagos")
        pago = etree.SubElement(pagos, "pago")
        etree.SubElement(pago, "formaPago").text = invoice_data.get("payment_method", "01")
        etree.SubElement(pago, "total").text = self._fmt(invoice_data["total"])
        etree.SubElement(pago, "plazo").text = "0"
        etree.SubElement(pago, "unidadTiempo").text = "dias"
    
    def _add_total_impuestos(self, parent, invoice_data):
        """Agrega totalConImpuestos según XSD"""
        total_impuesto = etree.SubElement(parent, "totalImpuesto")
        
        issue_date = invoice_data["issue_date"]
        if isinstance(issue_date, datetime):
            issue_date = issue_date.date()
        
        iva_percentage = 15 if issue_date >= IVA_15_EFFECTIVE_DATE else 12
        iva_code = "4" if iva_percentage == 15 else "2"
        
        fields = [
            ("codigo", "2"),
            ("codigoPorcentaje", iva_code),
            ("descuentoAdicional", "0.00"),
            ("baseImponible", self._fmt(invoice_data["subtotal"])),
            ("valor", self._fmt(invoice_data["iva"])),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(total_impuesto, tag)
            elem.text = str(value)
    
    def _add_detalles(self, parent, items, issue_date):
        """Agrega detalles según XSD"""
        for item in items:
            detalle = etree.SubElement(parent, "detalle")
            
            fields = [
                ("codigoPrincipal", item.get("product_sku", "SIN-CODIGO")[:25]),
                ("codigoAuxiliar", item.get("product_barcode", "")[:25]),
                ("descripcion", item["product_name"][:300]),
                ("cantidad", self._fmt(item["quantity"])),
                ("precioUnitario", self._fmt(item["unit_price"])),
                ("descuento", self._fmt(item.get("discount", 0))),
                ("precioTotalSinImpuesto", self._fmt(item["total_price"])),
            ]
            
            for tag, value in fields:
                elem = etree.SubElement(detalle, tag)
                elem.text = str(value)
            
            if item.get("iva_percentage", 0) > 0:
                impuestos = etree.SubElement(detalle, "impuestos")
                impuesto = etree.SubElement(impuestos, "impuesto")
                
                iva_code = "4" if item["iva_percentage"] == 15 else "2" if item["iva_percentage"] == 12 else "0"
                
                imp_fields = [
                    ("codigo", "2"),
                    ("codigoPorcentaje", iva_code),
                    ("tarifa", str(item["iva_percentage"])),
                    ("baseImponible", self._fmt(item["total_price"])),
                    ("valor", self._fmt(item.get("iva_amount", 0))),
                ]
                
                for tag, value in imp_fields:
                    elem = etree.SubElement(impuesto, tag)
                    elem.text = str(value)
    
    def _add_info_adicional(self, parent, notes):
        """Agrega infoAdicional según XSD"""
        campo = etree.SubElement(parent, "campoAdicional")
        campo.set("nombre", "Observaciones")
        campo.text = notes[:300]
    
    @staticmethod
    def _fmt(value) -> str:
        """Formatea valor numérico a 2 decimales"""
        if value is None:
            return "0.00"
        d = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return f"{d:.2f}"
    
    @staticmethod
    def _to_string(root: etree.Element) -> str:
        """Serializa XML a string"""
        return etree.tostring(
            root,
            encoding="UTF-8",
            xml_declaration=True,
            pretty_print=True,
        ).decode("utf-8")
    
    # Agrega este método dentro de la clase SRIXMLGenerator

    @staticmethod
    def get_iva_code(iva_percentage: float) -> str:
        """
        Devuelve el código de IVA según el porcentaje (SRI Ecuador)
        
        Códigos SRI:
        0 = 0%
        2 = 12%
        3 = 14%
        4 = 15%
        6 = IVA No Objeto de Contribuyente
        7 = No Objeto de Contribuyente Régimen Fronterizo
        """
        codes = {
            0: "0",
            12: "2",
            14: "3",
            15: "4",
        }
        # Redondear al entero más cercano
        percentage = int(round(iva_percentage))
        return codes.get(percentage, "4")  # Por defecto 15%