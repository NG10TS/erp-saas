# backend/app/services/auth_service.py
"""
Authentication service - VERSIÓN COMPLETA Y MEJORADA
"""
from sqlalchemy.orm import Session
from typing import Optional, Tuple, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import secrets
import random  # ✅ AGREGAR ESTE IMPORT
import logging

from jose import JWTError, jwt

from app.core.security import security_service
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.business import Business
from app.repositories.user_repository import UserRepository
from app.repositories.business_repository import BusinessRepository
from app.utils.validators import validate_email
from app.schemas.auth import RegisterRequest
from app.services.email_service import EmailService
from app.core.exceptions import AuthenticationError, ValidationError

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.business_repo = BusinessRepository(db)

    # ============================================
    # JWT TOKEN METHODS
    # ============================================
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        return encoded_jwt
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")
    
    # ============================================
    # ✅ MÉTODO GET CURRENT USER
    # ============================================
    
    def get_current_user(self, token: str) -> Optional[User]:
        """
        Get current user from JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            User object if valid, None otherwise
        """
        try:
            payload = self.decode_token(token)
            user_id: str = payload.get("sub")
            user_email: str = payload.get("email")
            
            if not user_id and not user_email:
                logger.warning("Token missing user identifier")
                return None
            
            if user_id:
                try:
                    user_uuid = UUID(user_id)
                    user = self.user_repo.get(user_uuid)
                    if user:
                        return user
                except ValueError:
                    pass
            
            if user_email:
                user = self.user_repo.get_by_email(user_email)
                if user:
                    return user
            
            logger.warning(f"User not found for token")
            return None
            
        except AuthenticationError:
            return None
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            return None

    # ============================================
    # AUTHENTICATION METHODS
    # ============================================
    
    def authenticate(self, username: str, password: str) -> Tuple[Optional[User], Optional[Business]]:
        """
        Autentica un usuario por username o email
        Returns: (user, business) o (None, None) si falla
        """
        user = self.user_repo.get_by_username(username) or self.user_repo.get_by_email(username)

        if not user:
            logger.warning(f"Login failed: user not found - {username}")
            return None, None

        if not user.is_verified:
            logger.warning(f"Login failed: unverified user - {user.email}")
            return None, None

        if not security_service.verify_password(password, user.password_hash):
            logger.warning(f"Login failed: invalid password - {user.email}")
            return None, None

        business = self.business_repo.get(user.business_id)

        logger.info(f"User authenticated successfully: {user.email}")
        return user, business

    # ============================================
    # ✅ REGISTRATION METHODS - CORREGIDO
    # ============================================
    
    def register(self, user_in: RegisterRequest, current_user: Optional[User] = None) -> User:
        """Registra un nuevo usuario y su negocio"""
        
        # Validaciones
        if not validate_email(user_in.email):
            raise ValidationError("Invalid email format", field="email")
        
        # Verificar email duplicado
        existing_email = self.user_repo.get_by_email(user_in.email)
        if existing_email:
            raise ValidationError("Email already registered", field="email")
        
        # Verificar username duplicado
        existing_username = self.user_repo.get_by_username(user_in.username)
        if existing_username:
            raise ValidationError("Username already taken", field="username")
        
        # Crear o buscar negocio
        business = self.business_repo.get_by_ruc(user_in.ruc)
        
        if not business:
            business = Business(
                ruc=user_in.ruc,
                business_name=user_in.business_name,
                commercial_name=user_in.commercial_name,
                email=user_in.business_email,
                phone=user_in.business_phone,
                address=user_in.address,
                sri_emisor_type="01",
                is_active=True,
                subscription_plan="free",
                subscription_status="active"
            )
            self.db.add(business)
            self.db.flush()
            logger.info(f"New business created: {business.ruc} - {business.business_name}")
        
        # Determinar rol
        role = UserRole.OWNER if not current_user else UserRole.SELLER
        
        # ✅ GENERAR CÓDIGO DE VERIFICACIÓN DE 6 DÍGITOS
        verification_code = str(random.randint(100000, 999999))
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Crear usuario
        user = User(
            business_id=business.id,
            email=user_in.email,
            username=user_in.username,
            password_hash=security_service.get_password_hash(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            phone=user_in.phone,
            role=role,
            verification_token=verification_token,
            verification_code=verification_code,  # ✅ AGREGAR CÓDIGO
            verification_expires=verification_expires,
            is_verified=False,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        try:
            verification_link = f"{settings.FRONTEND_URL}/verify-email?token={user.verification_token}"
            EmailService.send_verification_email(
                to_email=user.email,
                verification_link=verification_link,
                verification_code=user.verification_code,
                name=user.first_name
            )
            logger.info(f"Verification email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")

            return user
    
    # ============================================
    # PASSWORD METHODS
    # ============================================
    
    def update_password(self, user_id: UUID, new_password: str):
        """Cambia la contraseña de un usuario autenticado"""
        user = self.user_repo.get(user_id)
        if user:
            user.password_hash = security_service.get_password_hash(new_password)
            user.password_updated_at = datetime.utcnow()
            self.db.commit()
            logger.info(f"Password updated for user {user_id}")

    def request_password_reset(self, email: str):
        """Solicita reset de contraseña enviando email con token"""
        user = self.user_repo.get_by_email(email)
        
        if not user:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return
        
        if not user.is_verified:
            logger.warning(f"Password reset requested for unverified user: {email}")
            return
        
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=24)
        self.db.commit()
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        try:
            EmailService.send_password_reset_email(
                user.email,
                reset_link,
                user.first_name
            )
            logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")

    def reset_password(self, token: str, new_password: str) -> bool:
        """Restablece la contraseña usando token de reset"""
        user = self.db.query(User).filter(
            User.reset_password_token == token,
            User.reset_password_expires > datetime.utcnow()
        ).first()

        if not user:
            logger.warning(f"Invalid or expired reset token")
            return False
        
        if not user.is_active or not user.is_verified:
            logger.warning(f"Reset attempt for inactive/unverified user: {user.email}")
            return False
        
        user.password_hash = security_service.get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_expires = None
        user.password_updated_at = datetime.utcnow()
        
        self.db.commit()
        logger.info(f"Password reset successfully for user: {user.email}")
        
        return True

    def check_user_exists(self, email: str) -> bool:
        """Verifica si existe un usuario con ese email"""
        user = self.user_repo.get_by_email(email)
        return user is not None

    # ============================================
    # VERIFICATION METHODS
    # ============================================
    
    def verify_email(self, token: str) -> bool:
        """Verifica el email usando token de verificación"""
        try:
            user = self.db.query(User).filter(
                User.verification_token == token,
                User.verification_expires > datetime.utcnow()
            ).first()

            if not user:
                logger.warning(f"Invalid or expired verification token")
                return False

            if user.is_verified:
                logger.info(f"User already verified: {user.email}")
                return True

            user.is_verified = True
            user.verification_token = None
            user.verification_code = None  # ✅ LIMPIAR CÓDIGO
            user.verification_expires = None
            user.verified_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"Email verified successfully for user: {user.email}")
            
            try:
                EmailService.send_welcome_email(user.email, user.first_name)
            except Exception as e:
                logger.error(f"Failed to send welcome email: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error in verify_email: {e}", exc_info=True)
            self.db.rollback()
            return False

    def resend_verification(self, email: str):
        """Reenvía email de verificación"""
        user = self.user_repo.get_by_email(email)

        if not user:
            logger.info(f"Resend verification requested for non-existent email: {email}")
            return
        
        if user.is_verified:
            logger.info(f"Resend verification requested for already verified user: {email}")
            return
        
        verification_code = str(random.randint(100000, 999999))  # ✅ NUEVO CÓDIGO
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.utcnow() + timedelta(hours=24)

        user.verification_token = verification_token
        user.verification_code = verification_code
        user.verification_expires = verification_expires
        self.db.commit()

        verification_link = f"{settings.BACKEND_URL}/api/v1/auth/verify-email?token={verification_token}"
        
        try:
            EmailService.send_verification_email(
                to_email=user.email,
                verification_link=verification_link,
                verification_code=verification_code,
                name=user.first_name
            )
            logger.info(f"Verification email resent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to resend verification email: {e}")
            raise

    # ============================================
    # USER MANAGEMENT
    # ============================================
    
    def update_last_login(self, user_id: UUID, ip_address: str = None):
        """Actualiza la fecha y IP del último login"""
        user = self.user_repo.get(user_id)
        if user:
            user.last_login_at = datetime.utcnow()
            user.last_login_ip = ip_address
            self.db.commit()
            logger.debug(f"Updated last login for user {user_id}")

    def get_user(self, user_id: str) -> Optional[User]:
        """Obtiene usuario por ID"""
        try:
            return self.user_repo.get(UUID(user_id))
        except ValueError:
            logger.error(f"Invalid UUID format: {user_id}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.user_repo.get_by_email(email)
    
    def logout(self, user_id: UUID, token: str):
        """Invalida el token actual"""
        logger.info(f"User {user_id} logged out")
        pass