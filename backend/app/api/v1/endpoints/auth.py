"""
Authentication endpoints — with token blacklist + refresh rotation
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Any
import secrets
import logging
from urllib.parse import quote
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import get_db
from app.core.security import security_service
from app.core.config import settings
from app.core.logging import audit_logger
from app.schemas.auth import (
    Token,
    LoginResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.token_service import TokenService, ensure_jti_in_payload
from app.dependencies.auth import get_current_user
from app.models.user import User

# 🔥 DESHABILITADO - GOOGLE OAUTH
# from app.models.business import Business

router = APIRouter(tags=["autenticación"])
logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

REDIRECT_HEADERS = {
    "Access-Control-Allow-Origin": settings.FRONTEND_URL,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Login with username/email + password.
    Returns access token (30 min) + refresh token (7 days).
    Both tokens include a JTI for revocation support.
    """
    auth_service = AuthService(db)
    user, business = auth_service.authenticate(
        username=login_data.username,
        password=login_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_service.update_last_login(user.id, request.client.host)

    # Add JTI to both tokens for revocation support
    access_jti  = secrets.token_urlsafe(32)
    refresh_jti = secrets.token_urlsafe(32)

    access_token = security_service.create_access_token(
        data={"sub": str(user.id), "business_id": str(business.id), "jti": access_jti}
    )
    refresh_token = security_service.create_refresh_token(
        data={"sub": str(user.id), "jti": refresh_jti}
    )

    audit_logger.log(
        user_id=str(user.id),
        action="LOGIN",
        resource="auth",
        ip_address=request.client.host,
    )

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user":          user,
        "business":      business,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: RegisterRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Register a new user + business"""
    auth_service = AuthService(db)
    try:
        user = auth_service.register(user_in)
        logger.info(f"User registered: {user.email}")
        return user
    except ValueError as e:
        msg = str(e)
        if "Email already registered" in msg:
            raise HTTPException(400, "Email ya registrado. Inicia sesión.")
        if "Username already taken" in msg:
            raise HTTPException(400, "Nombre de usuario ya en uso.")
        raise HTTPException(400, msg)
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(500, "Error al registrar. Intenta de nuevo.")


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Exchange a refresh token for a new access token.

    SECURITY: Refresh tokens now rotate on each use.
    The old refresh token is blacklisted and a new one is issued.
    If the old token is used again (replay attack), all tokens are revoked.
    """
    token_service = TokenService(db)
    auth_service  = AuthService(db)

    # Verify the refresh token is structurally valid
    payload = security_service.verify_token(refresh_data.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado",
        )

    user_id = payload.get("sub")
    user = auth_service.get_user(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    # Rotate the refresh token (old one is blacklisted)
    new_refresh_token = token_service.rotate_refresh_token(refresh_data.refresh_token, user)
    if not new_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revocado. Inicia sesión nuevamente.",
        )

    # Issue new access token with fresh JTI
    access_jti = secrets.token_urlsafe(32)
    access_token = security_service.create_access_token(
        data={"sub": str(user.id), "business_id": str(user.business_id), "jti": access_jti}
    )

    return {
        "access_token":  access_token,
        "refresh_token": new_refresh_token,   # ← rotated, not the old one
        "token_type":    "bearer",
        "expires_in":    settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/forgot-password")
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Request password reset email.
    NOW: Returns whether user exists or not.
    """
    auth_service = AuthService(db)
    user_exists = auth_service.check_user_exists(forgot_data.email)
    
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe una cuenta con este email. ¿Quieres registrarte?"
        )
    
    auth_service.request_password_reset(forgot_data.email)
    return {"message": "Instrucciones enviadas a tu correo electrónico"}


@router.post("/reset-password")
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Reset password using token received by email."""
    auth_service = AuthService(db)
    success = auth_service.reset_password(reset_data.token, reset_data.new_password)
    if not success:
        raise HTTPException(400, "Token inválido o expirado")

    return {"message": "Contraseña actualizada exitosamente"}


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)) -> Any:
    """Verify email address and redirect to frontend."""
    try:
        auth_service = AuthService(db)
        success = auth_service.verify_email(token)

        if not success:
            msg = quote("Enlace de verificación inválido o expirado")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/verify-email?status=error&message={msg}",
                status_code=302,
                headers=REDIRECT_HEADERS,
            )

        msg = quote("Email verificado exitosamente")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/verify-email?status=success&message={msg}",
            status_code=302,
            headers=REDIRECT_HEADERS,
        )
    except Exception as e:
        logger.error(f"Email verification error: {e}", exc_info=True)
        msg = quote("Error al verificar email")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/verify-email?status=error&message={msg}",
            status_code=302,
            headers=REDIRECT_HEADERS,
        )


@router.post("/resend-verification")
async def resend_verification(email: str, db: Session = Depends(get_db)) -> Any:
    """Resend verification email."""
    auth_service = AuthService(db)
    auth_service.resend_verification(email)
    return {"message": "Email de verificación enviado"}


# ─────────────────────────────────────────────────────────────────────────────
# PROTECTED ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Logout: blacklist the current access token.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    token_service = TokenService(db)

    if credentials:
        token_service.revoke_token(credentials.credentials, current_user.id)

    logger.info(f"User {current_user.email} logged out")
    return {"message": "Sesión cerrada exitosamente"}


@router.post("/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Logout from ALL devices by revoking all active tokens."""
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    token_service = TokenService(db)
    token_service.revoke_all_user_tokens(current_user.id)

    logger.info(f"All tokens revoked for user {current_user.email}")
    return {"message": "Sesión cerrada en todos los dispositivos"}


@router.post("/change-password")
async def change_password(
    passwords: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Change password and revoke all existing tokens."""
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    if not security_service.verify_password(passwords.current_password, current_user.password_hash):
        raise HTTPException(400, "Contraseña actual incorrecta")

    auth_service  = AuthService(db)
    token_service = TokenService(db)

    auth_service.update_password(current_user.id, passwords.new_password)
    token_service.revoke_all_user_tokens(current_user.id)

    return {"message": "Contraseña actualizada. Inicia sesión nuevamente."}


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Obtiene el usuario activo actual"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user


# 🔥 DESHABILITADO - GOOGLE OAUTH / ENDPOINT /me
# @router.get("/me")
# async def get_current_user_info(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Obtener información del usuario autenticado actualmente"""
#     business = None
#     if current_user.business_id:
#         business = db.query(Business).filter(Business.id == current_user.business_id).first()
#     
#     return {
#         "user": {
#             "id": str(current_user.id),
#             "email": current_user.email,
#             "username": current_user.username,
#             "first_name": current_user.first_name,
#             "last_name": current_user.last_name,
#             "phone": current_user.phone,
#             "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
#             "is_active": current_user.is_active,
#             "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
#         },
#         "business": {
#             "id": str(business.id) if business else None,
#             "ruc": business.ruc if business else None,
#             "business_name": business.business_name if business else None,
#             "commercial_name": business.commercial_name if business else None,
#             "email": business.email if business else None,
#             "phone": business.phone if business else None,
#             "address": business.address if business else None,
#             "logo_url": business.logo_url if business else None,
#             "is_active": business.is_active if business else False,
#             "onboarding_completed": business.onboarding_completed if business else False,
#         }
#     }

# 🔥 DESHABILITADO - GOOGLE OAUTH
# @router.get("/google")
# async def google_login():
#     """Iniciar flujo OAuth con Google"""
#     from app.core.config import settings
#     redirect_uri = f"{settings.BACKEND_URL}/api/v1/auth/google/callback"
#     google_auth_url = (
#         f"https://accounts.google.com/o/oauth2/v2/auth"
#         f"?client_id={settings.GOOGLE_CLIENT_ID}"
#         f"&redirect_uri={redirect_uri}"
#         f"&response_type=code"
#         f"&scope=openid%20email%20profile"
#     )
#     return RedirectResponse(url=google_auth_url)