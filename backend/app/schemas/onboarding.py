"""
Onboarding schemas (Pydantic v2)
Actualizado: añadidos SriConfigRequest y SriValidationResponse
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class PlanTier(str, Enum):
    FREE     = "free"
    PRO      = "pro"
    BUSINESS = "business"


# ─── Plan catalogue ───────────────────────────────────────────────────────────

class PlanFeature(BaseModel):
    label:    str
    included: bool
    limit:    Optional[str] = None


class Plan(BaseModel):
    id:          PlanTier
    name:        str
    price_usd:   float
    billing:     str = "mes"
    description: str
    features:    List[PlanFeature]
    recommended: bool = False
    badge:       Optional[str] = None


# ─── Progress I/O ─────────────────────────────────────────────────────────────

class OnboardingProgressSave(BaseModel):
    current_step:    int             = Field(..., ge=0, le=10)
    completed_steps: List[int]       = Field(default_factory=list)
    step_data:       Dict[str, Any]  = Field(default_factory=dict)
    selected_plan:   Optional[PlanTier] = None


class OnboardingProgressResponse(BaseModel):
    id:              UUID
    user_id:         UUID
    current_step:    int
    completed_steps: List[int]
    selected_plan:   Optional[str]
    step_data:       Dict[str, Any]
    is_completed:    bool
    completed_at:    Optional[datetime]
    updated_at:      datetime

    model_config = {"from_attributes": True}


class OnboardingCompleteRequest(BaseModel):
    selected_plan: PlanTier = PlanTier.FREE


class SelectPlanRequest(BaseModel):
    plan: PlanTier


# ─── SRI Certificate ──────────────────────────────────────────────────────────

class SriConfigRequest(BaseModel):
    """Payload para guardar el certificado SRI validado"""
    certificate_b64: str = Field(..., description="Certificado .p12 en Base64")
    password:        str = Field(..., min_length=1)
    environment:     str = Field("1", pattern="^[12]$")  # "1"=pruebas, "2"=producción


class SriValidationResponse(BaseModel):
    """Respuesta de validación del certificado (no guarda nada)"""
    valid:             bool
    subject:           Optional[str] = None
    issuer:            Optional[str] = None
    not_valid_after:   Optional[str] = None
    days_until_expiry: Optional[int] = None
    is_expired:        Optional[bool] = None
    expires_soon:      Optional[bool] = None
    fingerprint_sha256: Optional[str] = None
    certificate_b64:   Optional[str] = None   # Devuelto para que el frontend lo use en save-certificate