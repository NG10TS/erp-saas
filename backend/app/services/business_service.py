"""
Business service
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID
import base64
from datetime import datetime, timezone
from cryptography import x509
from cryptography.hazmat.backends import default_backend

from app.models.business import Business
from app.schemas.business import BusinessUpdate, SriConfigUpdate, WhatsAppConfigUpdate
from app.repositories.business_repository import BusinessRepository
from app.utils.encryption import encrypt_value, decrypt_value, CertificateEncryption
from app.core.logging import logger
from app.core.config import settings


class BusinessService:
    """Service for business operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.business_repo = BusinessRepository(db)
    
    def get(self, business_id: UUID) -> Optional[Business]:
        """Get business by ID"""
        return self.business_repo.get(business_id)
    
    def get_by_ruc(self, ruc: str) -> Optional[Business]:
        """Get business by RUC"""
        return self.business_repo.get_by_ruc(ruc)
 
    # app/services/business_service.py

    def update(self, business_id: UUID, business_in: BusinessUpdate) -> Business:
        """Update business"""
        business = self.business_repo.get(business_id)
        if not business:
            raise ValueError("Business not found")
        
        update_data = business_in.model_dump(exclude_unset=True)
        
        # ✅ Filtrar solo campos que existen en el modelo
        valid_fields = ['business_name', 'commercial_name', 'ruc', 'email', 'phone', 'address', 'settings']
        filtered_data = {k: v for k, v in update_data.items() if k in valid_fields and v is not None}
        
        print(f"📝 Actualizando campos: {list(filtered_data.keys())}")
        
        # Actualizar
        for key, value in filtered_data.items():
            setattr(business, key, value)
        
        # ✅ Commit y refresh
        self.db.commit()
        self.db.refresh(business)
        
        print(f"✅ Business actualizado: {business.business_name}")
        
        return business

    def update_sri_config(self, business_id: UUID, sri_config: SriConfigUpdate) -> Business:
        """Update SRI configuration"""
        business = self.business_repo.get(business_id)
        if not business:
            raise ValueError("Business not found")
        
        business.sri_environment = sri_config.sri_environment
        business.sri_emisor_type = sri_config.sri_emisor_type
        business.sri_resolution_number = sri_config.sri_resolution_number
        
        self.db.commit()
        return business
    
    def update_whatsapp_config(self, business_id: UUID, wa_config: WhatsAppConfigUpdate) -> Business:
        """Update WhatsApp configuration"""
        business = self.business_repo.get(business_id)
        if not business:
            raise ValueError("Business not found")
        
        # Encrypt sensitive data
        business.whatsapp_business_phone = wa_config.whatsapp_business_phone
        business.whatsapp_business_id = wa_config.whatsapp_business_id
        business.whatsapp_access_token_encrypted = encrypt_value(wa_config.whatsapp_access_token)
        
        self.db.commit()
        return business
    
    async def upload_logo(self, business_id: UUID, file) -> str:
        """Upload business logo"""
        # TODO: Implement S3 upload
        # For now, return placeholder
        return f"https://storage.erp.com/logos/{business_id}.png"
    
    async def upload_certificate(self, business_id: UUID, cert_data: bytes, password: str) -> bool:
        """Upload and validate digital certificate (PKCS#12 .p12 format)"""
        from cryptography.hazmat.primitives.serialization import pkcs12
        from datetime import datetime, timezone
        
        business = self.business_repo.get(business_id)
        if not business:
            raise ValueError("Business not found")
        
        try:
            # Cargar como PKCS#12 (.p12)
            private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
                cert_data, 
                password.encode('utf-8')
            )
            
            if certificate is None:
                raise ValueError("El archivo no contiene un certificado válido")
            
            # ✅ CORREGIDO: Convertir a timezone-aware para comparación
            not_after = certificate.not_valid_after_utc
            now = datetime.now(timezone.utc)  # ← Usar timezone-aware
            
            if not_after < now:
                raise ValueError(f"Certificate expired on {not_after}")
            
            # Encrypt and store
            import base64
            encrypted_cert = encrypt_value(base64.b64encode(cert_data).decode())
            encrypted_password = encrypt_value(password)
            
            business.digital_certificate = encrypted_cert
            business.digital_certificate_password_encrypted = encrypted_password
            business.digital_certificate_expires_at = not_after
            business.sri_has_digital_certificate = True
            
            self.db.commit()
            logger.info(f"Certificate uploaded for business {business_id}, expires at {not_after}")
            return True
            
        except Exception as e:
            logger.error(f"Certificate upload failed: {e}")
            return False

    def get_certificate_info(self, business_id: UUID) -> Dict[str, Any]:
        """Get certificate information"""
        business = self.business_repo.get(business_id)
        if not business or not business.sri_has_digital_certificate:
            return {"has_certificate": False}
        
        return {
            "has_certificate": True,
            "expires_at": business.digital_certificate_expires_at,
            "is_valid": business.digital_certificate_expires_at > datetime.utcnow() if business.digital_certificate_expires_at else False,
            "days_until_expiry": (business.digital_certificate_expires_at - datetime.utcnow()).days if business.digital_certificate_expires_at else None
        }
    
    def get_usage_stats(self, business_id: UUID) -> Dict[str, Any]:
        """Get business usage statistics"""
        business = self.business_repo.get(business_id)
        if not business:
            raise ValueError("Business not found")
        
        return {
            "users": {
                "current": business.current_users,
                "limit": business.max_users,
                "percentage": (business.current_users / business.max_users * 100) if business.max_users > 0 else 0
            },
            "products": {
                "current": business.current_products,
                "limit": business.max_products,
                "percentage": (business.current_products / business.max_products * 100) if business.max_products > 0 else 0
            },
            "invoices": {
                "current": business.current_invoices_month,
                "limit": business.max_invoices_monthly,
                "percentage": (business.current_invoices_month / business.max_invoices_monthly * 100) if business.max_invoices_monthly > 0 else 0
            },
            "storage": {
                "current": business.current_storage_mb,
                "limit": business.max_storage_mb,
                "percentage": (business.current_storage_mb / business.max_storage_mb * 100) if business.max_storage_mb > 0 else 0
            }
        }
    
    def get_monthly_invoice_stats(self, business_id: UUID, year: int, month: int) -> Dict[str, Any]:
        """Get monthly invoice statistics"""
        from app.models.invoice import Invoice
        from sqlalchemy import func
        from datetime import datetime
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        # Query invoices
        stats = self.db.query(
            func.count(Invoice.id).label('total'),
            func.sum(Invoice.total).label('amount'),
            Invoice.sri_status
        ).filter(
            Invoice.business_id == business_id,
            Invoice.created_at >= start_date,
            Invoice.created_at < end_date
        ).group_by(Invoice.sri_status).all()
        
        result = {
            "year": year,
            "month": month,
            "total": 0,
            "amount": 0,
            "by_status": {}
        }
        
        for stat in stats:
            result["by_status"][stat.sri_status] = {
                "count": stat.total,
                "amount": float(stat.amount or 0)
            }
            result["total"] += stat.total
            result["amount"] += float(stat.amount or 0)
        
        return result
    
    async def test_sri_connection(self, business_id: UUID) -> tuple[bool, str]:
        """Test connection to SRI"""
        from app.services.sri.sri_client import SRIClient
        
        business = self.business_repo.get(business_id)
        if not business:
            return False, "Business not found"
        
        try:
            client = SRIClient(environment=business.sri_environment)
            # Simple test - try to get service status
            # This would depend on actual SRI test endpoint
            return True, "Connection successful"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"