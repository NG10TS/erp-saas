"""
SRI Service - Orchestrates SRI operations
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime, date
import base64
import logging

from app.models.invoice import Invoice
from app.models.business import Business
from app.services.sri.xml_generator import SRIXMLGenerator
from app.services.sri.signer import SRISigner
from app.services.sri.sri_client import SRIClient
from app.services.sri.pdf_generator import SRIPDFGenerator
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.business_repository import BusinessRepository
from app.utils.encryption import decrypt_value
from app.core.logging import logger


class SRIService:
    """Service for SRI operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.business_repo = BusinessRepository(db)
        self.xml_generator = SRIXMLGenerator()
        self.signer = SRISigner()
        self.pdf_generator = SRIPDFGenerator()
    
    async def process_invoice(self, invoice_id: UUID) -> Dict[str, Any]:
        """
        Process invoice through complete SRI flow:
        1. Generate XML
        2. Validar certificado ANTES de firmar
        3. Sign XML
        4. Send to SRI
        5. Generate PDF
        6. Update invoice status
        
        Args:
            invoice_id: Invoice UUID
            
        Returns:
            Processing result
        """
        logger.info(f"Processing invoice {invoice_id}")
        
        # Get invoice with related data
        invoice = self.invoice_repo.get_with_relations(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        # Get business
        business = self.business_repo.get(invoice.business_id)
        if not business:
            raise ValueError(f"Business {invoice.business_id} not found")
        
        # Check if already processed
        if invoice.sri_status == "AUTHORIZED":
            return {
                "status": "ALREADY_AUTHORIZED",
                "invoice_id": str(invoice_id),
                "authorization": invoice.invoice_number
            }
        
        try:
            # 1. Generate XML
            logger.debug("Generating XML")
            xml_content, access_key = self.xml_generator.generate_invoice_xml(
                invoice_data={
                    "sequential": invoice.sequential,
                    "issue_date": invoice.issue_date,
                    "subtotal": invoice.subtotal,
                    "iva": invoice.iva,
                    "total": invoice.total,
                    "discount": invoice.discount or 0,
                    "payment_method": invoice.payment_method or "01",
                    "notes": invoice.notes or "",
                },
                business_data={
                    "ruc": business.ruc,
                    "business_name": business.business_name,
                    "commercial_name": business.commercial_name or "",
                    "address": business.address or "",
                    "sri_environment": business.sri_environment or "1",
                },
                items=[
                    {
                        "product_sku": d.product_sku or "",
                        "product_name": d.product_name,
                        "quantity": d.quantity,
                        "unit_price": d.unit_price,
                        "total_price": d.total_price,
                        "iva_percentage": d.iva_percentage or (15 if invoice.issue_date.date() >= date(2024,5,1) else 12),
                        "iva_amount": d.iva_amount or 0,
                    }
                    for d in invoice.details
                ]
            )
            
            # Guardar access_key como invoice_number si no existe
            if not invoice.invoice_number:
                invoice.invoice_number = access_key
                self.db.commit()
            
            # 2. Validar certificado ANTES de firmar
            logger.debug("Validating digital certificate")
            cert_password = decrypt_value(business.digital_certificate_password_encrypted)
            
            # Decodificar certificado
            cert_bytes = base64.b64decode(business.digital_certificate)
            cert_info = self.signer.extract_certificate_info(cert_bytes, cert_password)
            
            if cert_info.get("is_expired"):
                raise ValueError(f"Certificado digital expirado desde {cert_info['not_valid_after']}")
            if cert_info.get("expires_soon"):
                logger.warning(f"Certificado expira en {cert_info['days_until_expiry']} días")
            
            # 3. Sign XML (SOLO UNA VEZ)
            logger.debug("Signing XML")
            signed_xml, fingerprint = self.signer.sign_xml_from_bytes(
                xml_content,
                cert_bytes,
                cert_password
            )
            
            invoice.xml_signed = signed_xml
            invoice.sri_attempts += 1
            self.db.commit()
            
            # 4. Send to SRI
            logger.debug("Sending to SRI")
            sri_client = SRIClient(environment=business.sri_environment)
            reception_response = sri_client.send_invoice(signed_xml)
            
            invoice.sri_response = reception_response
            
            if reception_response.get("estado") == "RECIBIDA":
                # Wait for authorization
                import asyncio
                await asyncio.sleep(3)
                
                # 5. Authorize
                auth_response = sri_client.authorize_invoice(invoice.invoice_number)
                
                if auth_response.get("estado") == "AUTORIZADO":
                    invoice.sri_status = "AUTHORIZED"
                    invoice.authorization_date = datetime.utcnow()
                    invoice.xml_authorized = auth_response.get("comprobante")
                    
                    # 6. Generate PDF
                    logger.debug("Generating PDF")
                    pdf_bytes = self.pdf_generator.generate_pdf(
                        invoice_data={
                            "number": invoice.invoice_number,
                            "sequential": invoice.sequential,
                            "issue_date": invoice.issue_date,
                            "subtotal": invoice.subtotal,
                            "iva": invoice.iva,
                            "total": invoice.total,
                            "notes": invoice.notes,
                            "access_key": access_key,
                            "authorization_number": auth_response.get("numero_autorizacion"),
                            "authorization_date": auth_response.get("fecha_autorizacion"),
                        },
                        business_data={
                            "ruc": business.ruc,
                            "name": business.business_name,
                            "commercial_name": business.commercial_name,
                            "address": business.address,
                            "phone": business.phone,
                            "environment": business.sri_environment
                        },
                        customer_data={
                            "name": invoice.customer.name if invoice.customer else "CONSUMIDOR FINAL",
                            "identification": invoice.customer.identification if invoice.customer else "9999999999999",
                            "address": invoice.customer.address if invoice.customer else "",
                            "phone": invoice.customer.phone_number if invoice.customer else ""
                        },
                        items=[
                            {
                                "product_name": d.product_name,
                                "quantity": d.quantity,
                                "unit_price": d.unit_price,
                                "total_price": d.total_price,
                                "discount": 0,
                            }
                            for d in invoice.details
                        ]
                    )
                    
                    # 7. Upload PDF
                    filename = f"{invoice.invoice_number}.pdf"
                    pdf_url = await self.pdf_generator.upload_to_s3(pdf_bytes, filename)
                    invoice.pdf_url = pdf_url
                    
                    self.db.commit()
                    
                    return {
                        "status": "AUTHORIZED",
                        "invoice_id": str(invoice_id),
                        "authorization": invoice.invoice_number,
                        "pdf_url": pdf_url,
                        "certificate_fingerprint": fingerprint
                    }
                else:
                    invoice.sri_status = "REJECTED"
                    self.db.commit()
                    
                    return {
                        "status": "REJECTED",
                        "invoice_id": str(invoice_id),
                        "errors": auth_response.get("mensaje", [])
                    }
            else:
                invoice.sri_status = "ERROR"
                self.db.commit()
                
                return {
                    "status": "ERROR",
                    "invoice_id": str(invoice_id),
                    "errors": reception_response.get("mensaje", [])
                }
                
        except Exception as e:
            logger.error(f"Error processing invoice {invoice_id}: {e}", exc_info=True)
            invoice.sri_status = "ERROR"
            invoice.sri_error = str(e)
            self.db.commit()
            raise
    
    async def check_invoice_status(self, invoice_id: UUID) -> Dict[str, Any]:
        """Check invoice status with SRI"""
        invoice = self.invoice_repo.get(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        business = self.business_repo.get(invoice.business_id)
        
        sri_client = SRIClient(environment=business.sri_environment)
        response = sri_client.authorize_invoice(invoice.invoice_number)
        
        return response
    
    async def retry_failed_invoice(self, invoice_id: UUID) -> Dict[str, Any]:
        """Retry processing a failed invoice"""
        invoice = self.invoice_repo.get(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        # Reset status
        invoice.sri_status = "PENDING"
        invoice.sri_error = None
        self.db.commit()
        
        # Reprocess
        return await self.process_invoice(invoice_id)
    
    # En app/services/sri/sri_service.py, agrega este método:

    async def process_credit_note(self, credit_note_id: UUID) -> Dict[str, Any]:
        """
        Procesa nota de crédito: XML → Firmar → SRI → PDF
        """
        from app.models.credit_note import CreditNote
        from app.services.sri.nota_credito_xml import NotaCreditoXMLGenerator
        
        credit_note = self.db.query(CreditNote).get(credit_note_id)
        if not credit_note:
            raise ValueError(f"Credit note {credit_note_id} not found")
        
        business = self.business_repo.get(credit_note.business_id)
        invoice = self.invoice_repo.get(credit_note.invoice_id)
        
        # 1. Generar XML
        nc_generator = NotaCreditoXMLGenerator()
        xml_content, access_key = nc_generator.generate_credit_note_xml(
            nota_data={
                "sequential": credit_note.sequential,
                "issue_date": credit_note.issue_date,
                "tipo_nota": credit_note.tipo_nota,
                "motivo": credit_note.motivo,
                "numero_factura_modificada": invoice.invoice_number,
                "fecha_factura_modificada": invoice.issue_date,
                "subtotal": credit_note.subtotal,
                "iva": credit_note.iva,
                "total": credit_note.total,
            },
            business_data={
                "ruc": business.ruc,
                "business_name": business.business_name,
                "commercial_name": business.commercial_name or "",
                "address": business.address or "",
                "sri_environment": business.sri_environment or "1",
            },
            invoice_data={
                "customer_name": invoice.customer_name if hasattr(invoice, 'customer_name') else "CONSUMIDOR FINAL",
                "customer_identification": invoice.customer_identification if hasattr(invoice, 'customer_identification') else "9999999999999",
            },
            items=[{
                "product_sku": d.product_sku or "",
                "product_name": d.product_name,
                "quantity": d.quantity,
                "unit_price": d.unit_price,
                "discount": d.discount or 0,
                "total_price": d.total_price,
                "iva_amount": d.iva_amount or 0,
            } for d in credit_note.details]
        )
        
        credit_note.credit_note_number = access_key
        credit_note.xml_content = xml_content
        
        # 2. Firmar (si hay certificado)
        if business.digital_certificate:
            cert_password = decrypt_value(business.digital_certificate_password_encrypted)
            signed_xml, fingerprint = self.signer.sign_xml_from_bytes(
                xml_content,
                base64.b64decode(business.digital_certificate),
                cert_password
            )
            credit_note.xml_signed = signed_xml
        
        credit_note.sri_status = "pending"
        self.db.commit()
        
        return {
            "status": "pending",
            "credit_note_id": str(credit_note_id),
            "access_key": access_key
        }
    
        # En app/services/sri/sri_service.py, agrega este método:

    async def process_waybill(self, waybill_id: UUID) -> Dict[str, Any]:
        """
        Procesa guía de remisión: XML → Firmar → SRI
        """
        from app.models.waybill import Waybill
        from app.services.sri.guia_remision_xml import GuiaRemisionXMLGenerator
        
        waybill = self.db.query(Waybill).get(waybill_id)
        if not waybill:
            raise ValueError(f"Waybill {waybill_id} not found")
        
        business = self.business_repo.get(waybill.business_id)
        
        # 1. Generar XML
        guia_gen = GuiaRemisionXMLGenerator()
        xml_content, access_key = guia_gen.generate_waybill_xml(
            guia_data={
                "sequential": waybill.sequential,
                "issue_date": waybill.fecha_inicio,
                "end_date": waybill.fecha_fin,
                "tipo_guia": waybill.tipo_guia,
                "motivo_traslado": waybill.motivo_traslado,
                "direccion_partida": waybill.direccion_partida,
                "ruta": waybill.ruta,
                "cod_estab_destino": "001",
            },
            business_data={
                "ruc": business.ruc,
                "business_name": business.business_name,
                "commercial_name": business.commercial_name or "",
                "address": business.address or "",
                "sri_environment": business.sri_environment or "1",
            },
            destinatario_data={
                "name": waybill.destinatario_name,
                "identification": waybill.destinatario_identification,
                "address": waybill.destinatario_address or "",
            },
            items=[{
                "product_sku": d.product_sku or "",
                "product_name": d.product_name,
                "quantity": d.quantity,
            } for d in waybill.details],
            transporte_data={
                "tipo": waybill.tipo_transporte,
                "placa": waybill.placa,
                "ruc": waybill.transportista_ruc or "9999999999999",
                "marca": waybill.marca_vehiculo or "",
                "color": waybill.color_vehiculo or "",
            }
        )
        
        waybill.waybill_number = access_key
        waybill.xml_content = xml_content
        
        # 2. Firmar (si hay certificado)
        if business.digital_certificate:
            cert_password = decrypt_value(business.digital_certificate_password_encrypted)
            signed_xml, _ = self.signer.sign_xml_from_bytes(
                xml_content,
                base64.b64decode(business.digital_certificate),
                cert_password
            )
            waybill.xml_signed = signed_xml
        
        waybill.sri_status = "pending"
        self.db.commit()
        
        return {
            "status": "pending",
            "waybill_id": str(waybill_id),
            "access_key": access_key
        }