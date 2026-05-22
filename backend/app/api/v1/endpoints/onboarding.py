"""
Onboarding endpoints
Incluye: progress, plans, complete, select-plan + validación certificado SRI
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import base64
import logging

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.business import Business
from app.schemas.onboarding import (
    OnboardingProgressResponse,
    OnboardingProgressSave,
    OnboardingCompleteRequest,
    SelectPlanRequest,
    Plan,
    SriConfigRequest,
    SriValidationResponse,
)
from app.schemas.business import BusinessCreate
from app.services.onboarding_service import OnboardingService
from app.services.sri.signer import SRISigner
from uuid import uuid4
from app.constants.roles import UserRole

router = APIRouter(tags=["onboarding"])
logger = logging.getLogger(__name__)


@router.get("/progress", response_model=Optional[OnboardingProgressResponse])
async def get_progress(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Retorna el progreso guardado del onboarding. Null si aún no comenzó."""
    service = OnboardingService(db)
    return service.get_progress(current_user.id)


@router.post("/progress", response_model=OnboardingProgressResponse)
async def save_progress(
    payload: OnboardingProgressSave,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Guarda (upsert) el progreso del onboarding tras cada paso."""
    try:
        service = OnboardingService(db)
        return service.save_progress(current_user.id, payload)
    except Exception as e:
        logger.error(f"save_progress error: {e}", exc_info=True)
        raise HTTPException(500, "Error al guardar el progreso")


@router.post("/complete", response_model=OnboardingProgressResponse)
async def complete_onboarding(
    req: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Marca el onboarding como completado y aplica los límites del plan elegido."""
    try:
        service = OnboardingService(db)
        return service.complete_onboarding(current_user.id, req)
    except Exception as e:
        logger.error(f"complete_onboarding error: {e}", exc_info=True)
        raise HTTPException(500, "Error al completar el onboarding")


@router.get("/plans", response_model=List[Plan])
async def get_plans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Retorna el catálogo de planes disponibles con precios y características."""
    service = OnboardingService(db)
    return service.get_plans()


@router.post("/select-plan", response_model=OnboardingProgressResponse)
async def select_plan(
    req: SelectPlanRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Persiste la elección de plan en mitad del wizard."""
    try:
        service = OnboardingService(db)
        return service.select_plan(current_user.id, req.plan)
    except Exception as e:
        logger.error(f"select_plan error: {e}", exc_info=True)
        raise HTTPException(500, "Error al seleccionar plan")


# ============================================================
# 🔐 NUEVO: Crear negocio durante el onboarding (OAuth)
# ============================================================

@router.post("/business", status_code=201)
async def create_business_onboarding(
    business_data: BusinessCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Crear negocio durante el onboarding (solo para usuarios nuevos sin negocio)
    Endpoint usado después de Google OAuth
    """
    # Verificar que el usuario no tenga ya un negocio
    if current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="El usuario ya tiene un negocio asociado"
        )
    
    # Verificar que el RUC no esté registrado
    existing_business = db.query(Business).filter(
        Business.ruc == business_data.ruc
    ).first()
    if existing_business:
        raise HTTPException(
            status_code=400,
            detail="El RUC ya está registrado en el sistema"
        )
    
    # Crear nuevo negocio
    business = Business(
        id=uuid4(),
        ruc=business_data.ruc,
        business_name=business_data.business_name,
        commercial_name=business_data.commercial_name,
        email=business_data.email,
        phone=business_data.phone,
        address=business_data.address,
        is_active=True,
        subscription_plan="free",
        max_users=1,
        max_products=50,
        max_invoices_monthly=50,
        sri_environment=business_data.sri_environment,
        sri_emisor_type=business_data.sri_emisor_type,
    )
    
    db.add(business)
    db.flush()  # Para obtener el ID
    
    # Asignar negocio al usuario y darle rol OWNER
    current_user.business_id = business.id
    if hasattr(UserRole, 'OWNER'):
        current_user.role = UserRole.OWNER
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"✅ Negocio creado durante onboarding: {business.business_name} (RUC: {business.ruc}) para usuario {current_user.email}")
    
    return {
        "message": "Negocio creado exitosamente",
        "business": {
            "id": str(business.id),
            "business_name": business.business_name,
            "ruc": business.ruc
        },
        "user_id": str(current_user.id)
    }


@router.get("/check")
async def check_onboarding_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Verificar si el usuario necesita onboarding de negocio
    """
    return {
        "needs_onboarding": current_user.business_id is None,
        "has_business": current_user.business_id is not None,
        "user_id": str(current_user.id),
        "email": current_user.email
    }

@router.post("/sri/validate-certificate", response_model=SriValidationResponse)
async def validate_sri_certificate(
    certificate: UploadFile = File(..., description="Archivo .p12 o .pfx"),
    password: str = Form(..., description="Contraseña del certificado"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Valida el certificado digital SRI antes de guardarlo.
    Verifica: formato p12, clave privada, firma SHA-256, vigencia.
    NO guarda nada — solo valida.
    """
    # Validar extensión
    if not certificate.filename.lower().endswith((".p12", ".pfx")):
        raise HTTPException(400, "El archivo debe ser .p12 o .pfx")

    cert_bytes = await certificate.read()
    if len(cert_bytes) > 5 * 1024 * 1024:  # 5 MB máx
        raise HTTPException(400, "El certificado no puede superar 5 MB")

    signer = SRISigner()
    result = signer.validate_certificate(cert_bytes, password)

    if not result.get("valid"):
        raise HTTPException(422, result.get("error", "Certificado inválido"))

    return SriValidationResponse(
        valid=True,
        subject=result["subject"],
        issuer=result["issuer"],
        not_valid_after=result["not_valid_after"],
        days_until_expiry=result["days_until_expiry"],
        is_expired=result["is_expired"],
        expires_soon=result["expires_soon"],
        fingerprint_sha256=result["fingerprint_sha256"],
        certificate_b64=base64.b64encode(cert_bytes).decode(),
    )


@router.post("/sri/save-certificate", response_model=dict)
async def save_sri_certificate(
    req: SriConfigRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Guarda el certificado SRI en el negocio del usuario.
    El certificado debe haber sido validado previamente con /validate-certificate.
    """
    business: Business = db.query(Business).filter(
        Business.id == current_user.business_id
    ).first()

    if not business:
        raise HTTPException(404, "Negocio no encontrado")

    # Verificar una última vez que el cert es válido
    try:
        cert_bytes = base64.b64decode(req.certificate_b64)
    except Exception:
        raise HTTPException(400, "certificate_b64 inválido")

    signer = SRISigner()
    validation = signer.validate_certificate(cert_bytes, req.password)
    if not validation.get("valid"):
        raise HTTPException(422, validation.get("error", "Certificado inválido"))

    # Guardar en Business
    # En producción: encripta password con Fernet/KMS antes de guardar
    from datetime import datetime
    business.digital_certificate = req.certificate_b64
    business.digital_certificate_password_encrypted = req.password  # TODO: encrypt
    business.sri_environment = req.environment  # "1" = pruebas, "2" = producción
    business.sri_has_digital_certificate = True
    business.digital_certificate_expires_at = datetime.fromisoformat(
        validation["not_valid_after"]
    )

    db.commit()

    return {
        "message": "Certificado SRI guardado correctamente",
        "environment": "Pruebas" if req.environment == "1" else "Producción",
        "expires_at": validation["not_valid_after"],
        "days_until_expiry": validation["days_until_expiry"],
    }