# backend/app/services/reports/__init__.py
"""
Módulo de Reportes Profesionales

Exporta los generadores de reportes y servicios principales
"""

from app.services.reports.excel_generator import ExcelReportGenerator
from app.services.reports.pdf_generator import PDFReportGenerator

__all__ = [
    "ExcelReportGenerator",
    "PDFReportGenerator",
]

__version__ = "1.0.0"
__author__ = "ERP Conversacional"
__description__ = "Sistema profesional de generación de reportes en Excel y PDF"