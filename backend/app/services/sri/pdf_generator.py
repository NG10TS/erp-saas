"""
Generador de PDF RIDE oficial SRI Ecuador con código de barras
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.barcode import code128
from io import BytesIO
from typing import Dict, Any, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class SRIPDFGenerator:
    """Genera el RIDE (PDF) oficial del SRI Ecuador"""
    
    def generate_pdf(
        self,
        invoice_data: Dict[str, Any],
        business_data: Dict[str, Any],
        customer_data: Dict[str, Any],
        items: List[Dict[str, Any]],
    ) -> bytes:
        """
        Genera PDF RIDE según estándar SRI.
        
        Args:
            invoice_data: {
                "number": "1234567890123456789012345678901234567890123456789",
                "sequential": "001-001-000000001",
                "issue_date": datetime,
                "subtotal": Decimal,
                "iva": Decimal,
                "total": Decimal,
                "discount": Decimal,
                "payment_method": "01",
                "access_key": "49 digit key",
                "authorization_number": "1234567890",
                "authorization_date": datetime
            }
            business_data: Empresa
            customer_data: Cliente
            items: Productos
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=1.5*cm,
            rightMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm,
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Ambiente de pruebas
        if business_data.get("environment") == "1":
            story.append(Paragraph(
                '<font color="red"><b>DOCUMENTO PRUEBAS - NO VÁLIDO TRIBUTARIAMENTE</b></font>',
                ParagraphStyle("warn", fontSize=8, alignment=TA_CENTER, textColor=colors.red)
            ))
            story.append(Spacer(1, 0.3*cm))
        
        # Tabla principal
        story.append(self._create_header(invoice_data, business_data))
        story.append(Spacer(1, 0.5*cm))
        
        story.append(self._create_business_info(business_data))
        story.append(Spacer(1, 0.3*cm))
        
        story.append(self._create_customer_info(customer_data, invoice_data))
        story.append(Spacer(1, 0.3*cm))
        
        story.append(self._create_items_table(items, invoice_data))
        story.append(Spacer(1, 0.3*cm))
        
        story.append(self._create_totals(invoice_data))
        story.append(Spacer(1, 0.3*cm))
        
        # Código de barras de la clave de acceso
        story.append(self._create_barcode(invoice_data.get("access_key", "")))
        story.append(Spacer(1, 0.5*cm))
        
        story.append(self._create_footer(invoice_data))
        
        doc.build(story)
        return buffer.getvalue()
    
    def _create_header(self, invoice_data, business_data) -> Table:
        """Crea cabecera con datos de la factura"""
        data = [
            [
                Paragraph(f"<b>{business_data.get('name', '')}</b>", 
                         ParagraphStyle("name", fontSize=10, leading=12)),
                Paragraph(f"<b>FACTURA</b><br/>No. {invoice_data.get('sequential', '')}",
                         ParagraphStyle("doc_num", fontSize=10, leading=12, alignment=TA_RIGHT))
            ],
            [
                Paragraph(f"RUC: {business_data.get('ruc', '')}", 
                         ParagraphStyle("ruc", fontSize=9)),
                Paragraph(f"Fecha Emisión: {self._fmt_date(invoice_data.get('issue_date'))}",
                         ParagraphStyle("date", fontSize=9, alignment=TA_RIGHT))
            ],
            [
                Paragraph(f"Dir Matriz: {business_data.get('address', '')}", 
                         ParagraphStyle("addr", fontSize=8)),
                Paragraph(f"Clave de Acceso:<br/>{invoice_data.get('access_key', '')[:49]}",
                         ParagraphStyle("key", fontSize=6, alignment=TA_RIGHT, leading=8))
            ]
        ]
        
        table = Table(data, colWidths=[10*cm, 8*cm])
        table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#003580')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        return table
    
    def _create_barcode(self, access_key: str) -> Table:
        """Crea código de barras 128 de la clave de acceso"""
        if not access_key:
            return Spacer(1, 0)
        
        # Crear código de barras
        barcode = code128.Code128(access_key[:49], barHeight=0.8*cm, barWidth=0.35*mm)
        
        # Crear tabla centrada
        data = [[barcode], [Paragraph(access_key[:49], ParagraphStyle("key_text", fontSize=8, alignment=TA_CENTER))]]
        table = Table(data, colWidths=[17*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 3),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
        ]))
        return table
    
    def _create_business_info(self, business_data) -> Table:
        """Crea información del emisor"""
        data = [
            ["<b>INFORMACIÓN DEL EMISOR</b>"],
            [f"{business_data.get('name', '')}"],
            [f"RUC: {business_data.get('ruc', '')} | Tel: {business_data.get('phone', '')}"],
            [f"Dirección: {business_data.get('address', '')}"],
        ]
        
        table = Table(data, colWidths=[18*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e0e0')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        return table
    
    def _create_customer_info(self, customer_data, invoice_data) -> Table:
        """Crea información del comprador"""
        data = [
            ["<b>DATOS DEL COMPRADOR</b>"],
            [f"Nombre/Razón Social: {customer_data.get('name', 'CONSUMIDOR FINAL')}"],
            [f"Identificación: {customer_data.get('identification', '9999999999999')}"],
            [f"Dirección: {customer_data.get('address', '')}"],
        ]
        
        if invoice_data.get('authorization_number'):
            data.append([f"Número Autorización: {invoice_data['authorization_number']}"])
            data.append([f"Fecha Autorización: {self._fmt_date(invoice_data.get('authorization_date'))}"])
        
        table = Table(data, colWidths=[18*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e0e0')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        return table
    
    def _create_items_table(self, items, invoice_data) -> Table:
        """Crea tabla de productos"""
        headers = ["Cant.", "Descripción", "P. Unitario", "Descuento", "Total"]
        col_widths = [1.5*cm, 9*cm, 2.5*cm, 2.5*cm, 2.5*cm]
        
        data = [headers]
        for item in items:
            data.append([
                str(item.get('quantity', 1)),
                item.get('product_name', '')[:100],
                f"${float(item.get('unit_price', 0)):.2f}",
                f"${float(item.get('discount', 0)):.2f}",
                f"${float(item.get('total_price', 0)):.2f}",
            ])
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#003580')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('ALIGN', (1,1), (1,-1), 'LEFT'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('INNERGRID', (0,0), (-1,-1), 0.25, colors.black),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        return table
    
    def _create_totals(self, invoice_data) -> Table:
        """Crea sección de totales"""
        subtotal = float(invoice_data.get('subtotal', 0))
        iva = float(invoice_data.get('iva', 0))
        total = float(invoice_data.get('total', 0))
        discount = float(invoice_data.get('discount', 0))
        
        data = [
            ["Subtotal 15%:", "", f"${subtotal:.2f}"],
            ["Descuento:", "", f"${discount:.2f}"],
            ["IVA 15%:", "", f"${iva:.2f}"],
            ["<b>TOTAL:</b>", "", f"<b>${total:.2f}</b>"],
        ]
        
        table = Table(data, colWidths=[5*cm, 10*cm, 3*cm])
        table.setStyle(TableStyle([
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ALIGN', (2,0), (2,-1), 'RIGHT'),
            ('LINEABOVE', (0,-1), (-1,-1), 1, colors.black),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ]))
        return table
    
    def _create_footer(self, invoice_data) -> Paragraph:
        """Crea pie de página"""
        if invoice_data.get('authorization_number'):
            text = f"<b>Autorizado por SRI</b><br/>Número: {invoice_data['authorization_number']}<br/>Fecha: {self._fmt_date(invoice_data.get('authorization_date'))}"
        else:
            text = "Documento pendiente de autorización por SRI"
        
        return Paragraph(text, ParagraphStyle("footer", fontSize=7, alignment=TA_CENTER))
    
    @staticmethod
    def _fmt_date(value) -> str:
        if not value:
            return ""
        if isinstance(value, str):
            return value
        return value.strftime("%d/%m/%Y %H:%M:%S")