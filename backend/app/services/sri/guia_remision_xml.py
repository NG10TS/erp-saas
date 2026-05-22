"""
Generador XML para Guías de Remisión SRI Ecuador
Esquema XSD: guiaRemision/v1.1.0
"""
from lxml import etree
from datetime import datetime
from typing import Dict, List, Any, Tuple
from decimal import Decimal, ROUND_HALF_UP
import logging
from typing import Optional

from app.services.sri.access_key import AccessKeyGenerator

logger = logging.getLogger(__name__)

# Tipos de guía de remisión
TIPOS_GUIA = {
    "01": "Traslado entre establecimientos",
    "02": "Traslado por venta",
    "03": "Traslado por devolución",
    "04": "Traslado por exportación",
    "05": "Traslado por importación",
}

# Tipos de transporte
TIPOS_TRANSPORTE = {
    "01": "Transporte propio",
    "02": "Transporte contratado",
}


class GuiaRemisionXMLGenerator:
    """Genera XML de Guía de Remisión según SRI Ecuador"""
    
    def generate_waybill_xml(
        self,
        guia_data: Dict[str, Any],
        business_data: Dict[str, Any],
        destinatario_data: Dict[str, Any],
        items: List[Dict[str, Any]],
        transporte_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, str]:
        """
        Genera XML de guía de remisión.
        
        Args:
            guia_data: Datos de la guía
            business_data: Datos del emisor
            destinatario_data: Datos del destinatario
            items: Productos a trasladar
            transporte_data: Datos del transporte
            
        Returns:
            (xml_string, access_key)
        """
        # Generar clave de acceso
        sequential_parts = guia_data["sequential"].split("-")
        access_key = AccessKeyGenerator.generate(
            comprobante_tipo="06",  # 06 = Guía de Remisión
            ruc=business_data["ruc"],
            ambiente=business_data["sri_environment"],
            establecimiento=sequential_parts[0],
            punto_emision=sequential_parts[1],
            secuencial=sequential_parts[2],
            fecha_emision=guia_data["issue_date"],
        )
        
        # Crear XML
        root = etree.Element(
            "guiaRemision",
            id="comprobante",
            version="1.1.0",
            nsmap={
                None: "http://www.sri.gob.ec/schema/guiaRemision/v1.1.0",
                "ds": "http://www.w3.org/2000/09/xmldsig#",
            }
        )
        
        # infoTributaria
        info_trib = etree.SubElement(root, "infoTributaria")
        self._add_info_tributaria(info_trib, business_data, access_key, sequential_parts)
        
        # infoGuiaRemision
        info_guia = etree.SubElement(root, "infoGuiaRemision")
        self._add_info_guia(info_guia, guia_data, business_data, destinatario_data)
        
        # destinatarios
        destinatarios = etree.SubElement(root, "destinatarios")
        self._add_destinatario(destinatarios, destinatario_data, items, guia_data)
        
        # Transporte (opcional)
        if transporte_data:
            info_transporte = etree.SubElement(root, "infoTransporte")
            self._add_info_transporte(info_transporte, transporte_data)
        
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
            ("codDoc", "06"),
            ("estab", sequential_parts[0]),
            ("ptoEmi", sequential_parts[1]),
            ("secuencial", sequential_parts[2]),
            ("dirMatriz", business_data.get("address", "Ecuador")[:300]),
        ]
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
    
    def _add_info_guia(self, parent, guia_data, business_data, destinatario_data):
        """Agrega infoGuiaRemision"""
        issue_date = guia_data["issue_date"]
        if isinstance(issue_date, datetime):
            issue_date = issue_date.date()
        
        fecha_fin = guia_data.get("end_date")
        if isinstance(fecha_fin, datetime):
            fecha_fin = fecha_fin.date()
        
        fields = [
            ("dirEstablecimiento", business_data.get("address", "Ecuador")[:300]),
            ("dirPartida", guia_data.get("direccion_partida", business_data.get("address", ""))[:300]),
            ("razonSocialTransportista", guia_data.get("transportista_nombre", "")[:300]),
            ("tipoIdentificacionTransportista", guia_data.get("transportista_tipo_id", "05")),
            ("rucTransportista", guia_data.get("transportista_ruc", "9999999999999")),
            ("fechaIniTransporte", issue_date.strftime("%d/%m/%Y")),
            ("fechaFinTransporte", (fecha_fin or issue_date).strftime("%d/%m/%Y")),
            ("placa", guia_data.get("placa", "AAA0001")[:10]),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
    
    def _add_destinatario(self, parent, destinatario_data, items, guia_data):
        """Agrega destinatario con sus detalles"""
        destinatario = etree.SubElement(parent, "destinatario")
        
        # Identificación del destinatario
        fields = [
            ("identificacionDestinatario", destinatario_data.get("identification", "9999999999999")),
            ("razonSocialDestinatario", destinatario_data.get("name", "CONSUMIDOR FINAL")[:300]),
            ("dirDestinatario", destinatario_data.get("address", "Ecuador")[:300]),
            ("motivoTraslado", guia_data.get("motivo_traslado", "Venta")[:300]),
            ("docAduaneroUnico", ""),
            ("codEstabDestino", guia_data.get("cod_estab_destino", "001")),
            ("ruta", guia_data.get("ruta", "")[:300]),
        ]
        
        for tag, value in fields:
            elem = etree.SubElement(destinatario, tag)
            elem.text = str(value) if value else ""
        
        # Documento aduanero (opcional)
        if guia_data.get("doc_aduanero"):
            etree.SubElement(destinatario, "docAduaneroUnico").text = guia_data["doc_aduanero"]
        
        # Detalles del destinatario
        detalles = etree.SubElement(destinatario, "detalles")
        for item in items:
            detalle = etree.SubElement(detalles, "detalle")
            
            item_fields = [
                ("codigoInterno", item.get("product_sku", "SIN-CODIGO")[:25]),
                ("descripcion", item["product_name"][:300]),
                ("cantidad", self._fmt(item["quantity"])),
            ]
            
            for tag, value in item_fields:
                elem = etree.SubElement(detalle, tag)
                elem.text = str(value)
    
    def _add_info_transporte(self, parent, transporte_data):
        """Agrega infoTransporte (opcional)"""
        fields = [
            ("tipoTransporte", transporte_data.get("tipo", "01")),
            ("marca", transporte_data.get("marca", "")[:100]),
            ("color", transporte_data.get("color", "")[:50]),
            ("placa", transporte_data.get("placa", "AAA0001")[:10]),
            ("rucTransportista", transporte_data.get("ruc", "9999999999999")),
        ]
        for tag, value in fields:
            elem = etree.SubElement(parent, tag)
            elem.text = str(value) if value else ""
    
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