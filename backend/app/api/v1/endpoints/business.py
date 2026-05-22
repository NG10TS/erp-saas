"""
Business endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Any, List
import base64

from app.core.database import get_db
from app.schemas.business import (
    BusinessResponse,
    BusinessUpdate,
    SriConfigUpdate,
    WhatsAppConfigUpdate,
    CertificateUpload,
)
from app.services.business_service import BusinessService
from app.dependencies.auth import get_current_business, require_admin, get_current_user
from app.models.business import Business
from app.models.user import User  # ← AGREGAR ESTA LÍNEA
from app.core.logging import audit_logger

router = APIRouter()


# app/api/v1/endpoints/business.py

@router.put("/me", response_model=BusinessResponse)
async def update_my_business(
    business_in: BusinessUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Update current business
    """
    try:
        business_service = BusinessService(db)
        business = business_service.update(
            current_business.id,
            business_in
        )
        
        # ✅ Forzar refresh para asegurar datos actualizados
        db.refresh(business)
        
        # ✅ Log para debugging
        print(f"✅ Business updated: {business.id} - {business.business_name}")
        
        return business
        
    except Exception as e:
        print(f"❌ Error updating business: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@router.post("/me/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Upload business logo
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    business_service = BusinessService(db)
    logo_url = await business_service.upload_logo(
        current_business.id,
        file
    )
    
    return {"logo_url": logo_url}


@router.post("/me/sri-config")
async def configure_sri(
    sri_config: SriConfigUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Configure SRI settings
    """
    business_service = BusinessService(db)
    business = business_service.update_sri_config(
        current_business.id,
        sri_config
    )
    return {"message": "SRI configuration updated"}

@router.post("/me/upload-certificate")
async def upload_certificate(
    certificate: UploadFile = File(...),
    password: str = Form(...),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Upload digital certificate for SRI
    """
    from app.services.business_service import BusinessService
    
    # Crear instancia del servicio
    business_service = BusinessService(db)
    
    # Leer el archivo
    cert_data = await certificate.read()
    
    # Validar tipo de archivo
    if not certificate.filename.endswith(('.p12', '.pfx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos .p12 o .pfx"
        )
    
    try:
        success = await business_service.upload_certificate(
            current_business.id,
            cert_data,
            password
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing certificate: {str(e)}"
        )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid certificate or password"
        )
    
    # Audit log
    audit_logger.log(
        user_id=str(current_business.id),
        action="UPLOAD_CERTIFICATE",
        resource="business",
        resource_id=str(current_business.id)
    )
    
    return {"message": "Certificate uploaded successfully"}

@router.post("/me/whatsapp-config")
async def configure_whatsapp(
    wa_config: WhatsAppConfigUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Configure WhatsApp integration
    """
    business_service = BusinessService(db)
    business = business_service.update_whatsapp_config(
        current_business.id,
        wa_config
    )
    return {"message": "WhatsApp configuration updated"}


@router.get("/me/usage-stats")
async def get_usage_stats(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get business usage statistics
    """
    business_service = BusinessService(db)
    stats = business_service.get_usage_stats(current_business.id)
    return stats


@router.get("/me/invoices/monthly")
async def get_monthly_invoice_stats(
    year: int,
    month: int,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get monthly invoice statistics
    """
    business_service = BusinessService(db)
    stats = business_service.get_monthly_invoice_stats(
        current_business.id,
        year,
        month
    )
    return stats


@router.get("/me/certificate-info")
async def get_certificate_info(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get digital certificate information
    """
    business_service = BusinessService(db)
    info = business_service.get_certificate_info(current_business.id)
    return info


@router.post("/me/test-sri-connection")
async def test_sri_connection(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin)
) -> Any:
    """
    Test connection to SRI
    """
    business_service = BusinessService(db)
    success, message = await business_service.test_sri_connection(
        current_business.id
    )
    
    return {
        "success": success,
        "message": message
    }
@router.get("/me", response_model=BusinessResponse)
async def get_my_business(
    current_user: User = Depends(get_current_user),  # ← Cambiar a get_current_user
    db: Session = Depends(get_db)
) -> Any:
    # ✅ PRIMERO: Verificar si el usuario tiene negocio
    if not current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario sin negocio asociado. Completa el onboarding."
        )
    
    # Luego obtener el negocio
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    return business