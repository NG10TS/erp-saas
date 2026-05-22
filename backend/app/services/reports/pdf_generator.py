"""
Generador de Reportes PDF
Usa reportlab para crear PDFs profesionales con tablas y gráficos
"""
import io
from typing import List, Dict, Any, Optional
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
import logging

logger = logging.getLogger(__name__)


class PDFReportGenerator:
    """Genera reportes en formato PDF con diseño profesional"""
    
    # ─── Colores corporativos ──────────────────────────────
    PRIMARY = colors.HexColor('#1B5E20')
    SECONDARY = colors.HexColor('#4CAF50')
    ACCENT = colors.HexColor('#FF9800')
    LIGHT_BG = colors.HexColor('#F5F5F5')
    HEADER_BG = colors.HexColor('#1B5E20')
    WHITE = colors.white
    BLACK = colors.black
    GRAY = colors.HexColor('#666666')
    
    def __init__(self, company_name: str = "ERP Conversacional"):
        self.company_name = company_name
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        """Configura estilos personalizados"""
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            fontSize=18,
            leading=22,
            textColor=self.PRIMARY,
            spaceAfter=6,
            alignment=TA_LEFT,
        ))
        self.styles.add(ParagraphStyle(
            name='ReportSubtitle',
            fontSize=9,
            leading=12,
            textColor=self.GRAY,
            spaceAfter=20,
            alignment=TA_LEFT,
        ))
        self.styles.add(ParagraphStyle(
            name='TableCell',
            fontSize=8,
            leading=10,
            alignment=TA_LEFT,
        ))
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=TA_CENTER,
        ))
    
    def _build_doc(self, title: str, filters: Optional[Dict] = None) -> tuple:
        """Construye el documento base"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4) if len(title) > 30 else A4,
            leftMargin=1.5*cm,
            rightMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm,
        )
        return doc, buffer
    
    def _add_header(self, story: list, title: str, filters: Optional[Dict] = None):
        """Agrega encabezado del reporte"""
        story.append(Paragraph(title, self.styles['ReportTitle']))
        story.append(Paragraph(
            f"{self.company_name} | Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            self.styles['ReportSubtitle']
        ))
        
        if filters:
            filter_text = "Filtros: " + " | ".join(
                f"<b>{k}:</b> {v}" for k, v in filters.items() if v
            )
            story.append(Paragraph(filter_text, self.styles['ReportSubtitle']))
        
        story.append(Spacer(1, 0.5*cm))
    
    def _build_table(self, headers: List[str], data: List[List], col_widths: List = None) -> Table:
        """Construye tabla formateada"""
        # Header row
        table_data = [headers] + data
        
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        style_commands = [
            ('BACKGROUND', (0, 0), (-1, 0), self.HEADER_BG),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.LIGHT_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]
        
        table.setStyle(TableStyle(style_commands))
        return table
    
    def generate_sales_report(
        self,
        data: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None,
    ) -> bytes:
        """Genera PDF de reporte de ventas"""
        doc, buffer = self._build_doc("Reporte de Ventas")
        story = []
        
        self._add_header(story, "Reporte de Ventas", filters)
        
        headers = ['N° Venta', 'Fecha', 'Cliente', 'Estado', 'Subtotal', 'IVA', 'Total']
        table_data = []
        for row in data:
            table_data.append([
                str(row.get('numero_venta', ''))[:15],
                str(row.get('fecha_venta', ''))[:10],
                str(row.get('customer_name', ''))[:30],
                str(row.get('estado', '')),
                f"${row.get('subtotal', 0):,.2f}",
                f"${row.get('iva', 0):,.2f}",
                f"${row.get('total', 0):,.2f}",
            ])
        
        # Totales
        total_subtotal = sum(d.get('subtotal', 0) for d in data)
        total_iva = sum(d.get('iva', 0) for d in data)
        total_general = sum(d.get('total', 0) for d in data)
        table_data.append([
            '', '', '', 'TOTALES',
            f"${total_subtotal:,.2f}",
            f"${total_iva:,.2f}",
            f"${total_general:,.2f}",
        ])
        
        table = self._build_table(headers, table_data)
        story.append(table)
        
        # Resumen
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph(
            f"<b>Total de registros:</b> {len(data)} | "
            f"<b>Total facturado:</b> ${total_general:,.2f} | "
            f"<b>IVA total:</b> ${total_iva:,.2f}",
            self.styles['ReportSubtitle']
        ))
        
        doc.build(story)
        return buffer.getvalue()
    
    def generate_inventory_report(
        self,
        data: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None,
    ) -> bytes:
        """Genera PDF de reporte de inventario"""
        doc, buffer = self._build_doc("Reporte de Inventario")
        story = []
        
        self._add_header(story, "Reporte de Inventario", filters)
        
        headers = ['SKU', 'Producto', 'Categoría', 'Stock', 'P. Venta', 'Utilidad']
        table_data = []
        for row in data:
            table_data.append([
                str(row.get('sku', ''))[:15],
                str(row.get('name', ''))[:35],
                str(row.get('category_name', ''))[:20],
                str(row.get('stock_actual', 0)),
                f"${row.get('precio_venta', 0):,.2f}",
                f"${row.get('utilidad', 0):,.2f}",
            ])
        
        table = self._build_table(headers, table_data)
        story.append(table)
        
        story.append(Spacer(1, 1*cm))
        story.append(Paragraph(
            f"<b>Total de productos:</b> {len(data)}",
            self.styles['ReportSubtitle']
        ))
        
        doc.build(story)
        return buffer.getvalue()