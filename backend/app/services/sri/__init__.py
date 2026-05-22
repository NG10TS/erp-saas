"""
SRI services package
"""
from app.services.sri.xml_generator import SRIXMLGenerator
from app.services.sri.signer import SRISigner
from app.services.sri.sri_client import SRIClient
from app.services.sri.pdf_generator import SRIPDFGenerator
from app.services.sri.sri_service import SRIService
from app.services.sri.access_key import AccessKeyGenerator
from app.services.sri.sequential import SequentialManager
from app.services.sri.nota_credito_xml import NotaCreditoXMLGenerator
from app.services.sri.guia_remision_xml import GuiaRemisionXMLGenerator

# SOAPClient es un alias de SRIClient para mantener compatibilidad
SOAPClient = SRIClient

__all__ = [
    "SRIXMLGenerator",
    "SRISigner",
    "SRIClient",
    "SRIPDFGenerator",
    "SRIService",
    "SOAPClient",  
    "AccessKeyGenerator",
    "SequentialManager",
    "NotaCreditoXMLGenerator",
    "GuiaRemisionXMLGenerator"
]