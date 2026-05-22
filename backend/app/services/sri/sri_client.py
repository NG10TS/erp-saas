"""
SRI SOAP Client - VERSIÓN ÚNICA Y DEFINITIVA
Communicates with SRI web services
"""
from zeep import Client
from zeep.transports import Transport
from zeep.exceptions import Fault, TransportError
from zeep.helpers import serialize_object
import requests
from typing import Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SRIClient:
    """SOAP client for SRI web services"""
    
    def __init__(self, environment: str = "1"):
        """
        Initialize SRI client
        
        Args:
            environment: "1" for testing, "2" for production
        """
        self.environment = environment
        
        # Set endpoints based on environment
        if environment == "1":
            self.reception_url = settings.SRI_TEST_ENDPOINT
            self.authorization_url = settings.SRI_AUTHORIZATION_TEST
        else:
            self.reception_url = settings.SRI_PROD_ENDPOINT
            self.authorization_url = settings.SRI_AUTHORIZATION_PROD
        
        # Configure session with timeout
        session = requests.Session()
        session.timeout = settings.SRI_TIMEOUT_SECONDS
        
        # Create transport
        transport = Transport(session=session)
        
        # Create SOAP clients
        try:
            self.reception_client = Client(
                self.reception_url,
                transport=transport
            )
            self.authorization_client = Client(
                self.authorization_url,
                transport=transport
            )
            logger.info(f"SRI client initialized for environment {environment}")
        except Exception as e:
            logger.error(f"Error initializing SRI client: {e}")
            raise
    
    @retry(
        stop=stop_after_attempt(settings.SRI_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def send_invoice(self, xml_content: str) -> Dict[str, Any]:
        """
        Send invoice to SRI for reception
        
        Args:
            xml_content: Signed XML content
            
        Returns:
            SRI response
        """
        try:
            # Encode XML
            xml_bytes = xml_content.encode()
            
            # Call service
            response = self.reception_client.service.validarComprobante(
                xml_bytes
            )
            
            # Parse response
            return self._parse_reception_response(response)
            
        except Fault as e:
            logger.error(f"SOAP fault in send_invoice: {e}")
            return {
                "estado": "ERROR",
                "mensaje": str(e),
                "codigo": "SOAP_FAULT"
            }
        except TransportError as e:
            logger.error(f"Transport error in send_invoice: {e}")
            raise  # Let retry handle it
        except Exception as e:
            logger.error(f"Unexpected error in send_invoice: {e}")
            return {
                "estado": "ERROR",
                "mensaje": str(e),
                "codigo": "UNKNOWN_ERROR"
            }
    
    @retry(
        stop=stop_after_attempt(settings.SRI_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def authorize_invoice(self, clave_acceso: str) -> Dict[str, Any]:
        """
        Authorize previously sent invoice
        
        Args:
            clave_acceso: Access key (49 digits)
            
        Returns:
            Authorization response
        """
        try:
            response = self.authorization_client.service.autorizacionComprobante(
                clave_acceso
            )
            
            return self._parse_authorization_response(response)
            
        except Fault as e:
            logger.error(f"SOAP fault in authorize_invoice: {e}")
            return {
                "estado": "ERROR",
                "mensaje": str(e),
                "codigo": "SOAP_FAULT"
            }
        except TransportError as e:
            logger.error(f"Transport error in authorize_invoice: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in authorize_invoice: {e}")
            return {
                "estado": "ERROR",
                "mensaje": str(e),
                "codigo": "UNKNOWN_ERROR"
            }
    
    def _parse_reception_response(self, response) -> Dict[str, Any]:
        """
        Parse reception response from SRI
        """
        try:
            response_dict = serialize_object(response)
            
            result = {
                "estado": response_dict.get("estado", "RECIBIDA"),
                "mensaje": []
            }
            
            mensajes = response_dict.get("comprobantes", {}).get("comprobante", [])
            if not isinstance(mensajes, list):
                mensajes = [mensajes]
            
            for msg in mensajes:
                if msg.get("mensajes"):
                    for m in msg["mensajes"]:
                        result["mensaje"].append({
                            "identificador": m.get("identificador"),
                            "mensaje": m.get("mensaje"),
                            "tipo": m.get("tipo"),
                            "informacionAdicional": m.get("informacionAdicional")
                        })
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing reception response: {e}")
            return {
                "estado": "ERROR",
                "mensaje": [{"mensaje": str(e)}]
            }
    
    def _parse_authorization_response(self, response) -> Dict[str, Any]:
        """
        Parse authorization response from SRI
        """
        try:
            response_dict = serialize_object(response)
            
            autorizaciones = response_dict.get("autorizaciones", {})
            autorizacion = autorizaciones.get("autorizacion", {})
            
            if not autorizacion:
                return {
                    "estado": "NO_AUTORIZADO",
                    "mensaje": "No se encontró autorización"
                }
            
            result = {
                "estado": autorizacion.get("estado", "NO_AUTORIZADO"),
                "numero_autorizacion": autorizacion.get("numeroAutorizacion"),
                "fecha_autorizacion": autorizacion.get("fechaAutorizacion"),
                "comprobante": autorizacion.get("comprobante"),
                "ambiente": autorizacion.get("ambiente"),
                "mensaje": []
            }
            
            mensajes = autorizacion.get("mensajes", {})
            if mensajes:
                for m in mensajes.get("mensaje", []):
                    result["mensaje"].append({
                        "identificador": m.get("identificador"),
                        "mensaje": m.get("mensaje"),
                        "tipo": m.get("tipo"),
                        "informacionAdicional": m.get("informacionAdicional")
                    })
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing authorization response: {e}")
            return {
                "estado": "ERROR",
                "mensaje": [{"mensaje": str(e)}]
            }
    
    def check_service_status(self) -> bool:
        """
        Check if SRI services are available
        """
        try:
            response = requests.get(
                self.reception_url,
                timeout=10
            )
            return response.status_code == 200
        except:
            return False