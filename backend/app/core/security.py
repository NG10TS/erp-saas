# app/core/security.py - VERSIÓN CORREGIDA
"""
Security utilities: JWT, password hashing, webhook signature verification
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib
import hmac
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# ✅ ARGON2 - más seguro que bcrypt
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__rounds=4,
    argon2__memory_cost=1024,
    argon2__parallelism=2,
    argon2__hash_len=32,
    argon2__salt_len=16,
)


class SecurityService:
    """Security utilities for authentication and encryption"""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password with Argon2"""
        if not plain_password:
            return False
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash password with Argon2"""
        if not password:
            raise ValueError("Password cannot be empty")
        try:
            return pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            from werkzeug.security import generate_password_hash
            return generate_password_hash(password, method='pbkdf2:sha256:600000')

    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + (
            expires_delta
            if expires_delta
            else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(32),
        })
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({
            "exp": expire,
            "type": "refresh",
            "iat": datetime.utcnow(),
            "jti": secrets.token_urlsafe(32),
        })
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def verify_token(
        token: str,
        token_type: Optional[str] = "access",
        db_session=None,  # ← NUEVO: para consultar blacklist
    ) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token, checking blacklist"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            
            if token_type is not None and payload.get("type") != token_type:
                logger.warning(f"Token type mismatch: expected '{token_type}'")
                return None
            
            # ✅ NUEVO: Verificar si el token está en blacklist
            if db_session and payload.get("jti"):
                from app.models.token_blacklist import TokenBlacklist
                is_blacklisted = db_session.query(TokenBlacklist).filter(
                    TokenBlacklist.jti == payload["jti"]
                ).first() is not None
                
                if is_blacklisted:
                    logger.warning(f"Token {payload['jti']} is blacklisted")
                    return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except JWTError as e:
            logger.warning(f"JWT error: {e}")
            return None

    @staticmethod
    def generate_api_key() -> str:
        return f"erp_{secrets.token_urlsafe(32)}"

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        salt = settings.SECRET_KEY
        return hashlib.sha256(f"{api_key}{salt}".encode()).hexdigest()

    @staticmethod
    def verify_webhook_signature(
        payload: bytes,
        signature: str,
        secret: str,
    ) -> bool:
        """Verify WhatsApp webhook signature"""
        if not secret:
            logger.warning("WHATSAPP_APP_SECRET not configured, skipping signature verification")
            return True  # En desarrollo, permitir sin firma
        
        try:
            expected = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(f"sha256={expected}", signature)
        except Exception as e:
            logger.error(f"Webhook signature error: {e}")
            return False

    @staticmethod
    def generate_secure_password(length: int = 16) -> str:
        alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        return "".join(secrets.choice(alphabet) for _ in range(length))


security_service = SecurityService()