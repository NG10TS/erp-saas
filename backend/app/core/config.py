"""
Configuration management with multi-database support
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field, field_validator
from typing import Optional, List
from functools import lru_cache
import secrets
from urllib.parse import urlparse


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # ============================================
    # APP CONFIGURATION
    # ============================================
    PROJECT_NAME: str = "ERP Conversacional"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    DEBUG: bool = Field(False)

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on", "release")
        return bool(v)

    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    
    # ============================================
    # SECURITY
    # ============================================
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # ============================================
    # CORS
    # ============================================
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
        env="BACKEND_CORS_ORIGINS"
    )
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # ============================================
    # DATABASE
    # ============================================
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(10, env="DATABASE_MAX_OVERFLOW")
    DATABASE_POOL_PRE_PING: bool = Field(True, env="DATABASE_POOL_PRE_PING")
    DATABASE_ECHO: bool = Field(False, env="DATABASE_ECHO")
    DATABASE_POOL_RECYCLE: int = Field(3600, env="DATABASE_POOL_RECYCLE")
    DATABASE_STATEMENT_TIMEOUT: Optional[int] = Field(None, env="DATABASE_STATEMENT_TIMEOUT")
    
    # ============================================
    # REDIS (para Celery)
    # ============================================
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    CELERY_BROKER_URL: str = Field("redis://localhost:6379/0", env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field("redis://localhost:6379/0", env="CELERY_RESULT_BACKEND")
    
    # ============================================
    # ALLOWED HOSTS
    # ============================================
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    # ============================================
    # LOGGING
    # ============================================
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")
    
    # ============================================
    # WHATSAPP BUSINESS API
    # ============================================
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = Field(None, env="WHATSAPP_PHONE_NUMBER_ID")
    WHATSAPP_BUSINESS_ACCOUNT_ID: Optional[str] = Field(None, env="WHATSAPP_BUSINESS_ACCOUNT_ID")
    WHATSAPP_ACCESS_TOKEN: Optional[str] = Field(None, env="WHATSAPP_ACCESS_TOKEN")
    WHATSAPP_VERIFY_TOKEN: str = Field("erp_webhook_verify_123", env="WHATSAPP_VERIFY_TOKEN")
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = Field("erp_webhook_verify_123", env="WHATSAPP_WEBHOOK_VERIFY_TOKEN")
    WHATSAPP_APP_SECRET: Optional[str] = Field(None, env="WHATSAPP_APP_SECRET")
    WHATSAPP_API_VERSION: str = Field("v18.0", env="WHATSAPP_API_VERSION")
    WHATSAPP_BASE_URL: str = Field("https://graph.facebook.com", env="WHATSAPP_BASE_URL")

    @property
    def WHATSAPP_CONFIGURED(self) -> bool:
        return bool(
            self.WHATSAPP_PHONE_NUMBER_ID and 
            self.WHATSAPP_ACCESS_TOKEN
        )
    
    # ============================================
    # SRI ECUADOR (Facturación Electrónica)
    # ============================================
    SRI_ENVIRONMENT: str = Field("1", env="SRI_ENVIRONMENT")
    SRI_TEST_ENDPOINT: str = Field(
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        env="SRI_TEST_ENDPOINT"
    )
    SRI_PROD_ENDPOINT: str = Field(
        "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        env="SRI_PROD_ENDPOINT"
    )
    SRI_AUTHORIZATION_TEST: str = Field(
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
        env="SRI_AUTHORIZATION_TEST"
    )
    SRI_AUTHORIZATION_PROD: str = Field(
        "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
        env="SRI_AUTHORIZATION_PROD"
    )
    SRI_MAX_RETRIES: int = Field(3, env="SRI_MAX_RETRIES")
    SRI_TIMEOUT_SECONDS: int = Field(60, env="SRI_TIMEOUT_SECONDS")
    SRI_CERTIFICATE_PATH: Optional[str] = Field(None, env="SRI_CERTIFICATE_PATH")
    SRI_CERTIFICATE_PASSWORD: Optional[str] = Field(None, env="SRI_CERTIFICATE_PASSWORD")
    
    DEFAULT_ESTABLISHMENT: str = Field("001", env="DEFAULT_ESTABLISHMENT")
    DEFAULT_POINT_OF_EMISSION: str = Field("001", env="DEFAULT_POINT_OF_EMISSION")
    
    @property
    def SRI_RECEPTION_ENDPOINT(self) -> str:
        return self.SRI_PROD_ENDPOINT if self.SRI_ENVIRONMENT == "2" else self.SRI_TEST_ENDPOINT
    
    @property
    def SRI_AUTHORIZATION_ENDPOINT(self) -> str:
        return self.SRI_AUTHORIZATION_PROD if self.SRI_ENVIRONMENT == "2" else self.SRI_AUTHORIZATION_TEST
    
    # ============================================
    # RATE LIMITING
    # ============================================
    RATE_LIMIT_REQUESTS: int = Field(100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(60, env="RATE_LIMIT_PERIOD")
    
    # ============================================
    # EMAIL
    # ============================================
    SMTP_HOST: Optional[str] = Field(None, env="SMTP_HOST")
    SMTP_PORT: int = Field(587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(None, env="SMTP_PASSWORD")
    SMTP_FROM: Optional[str] = Field(None, env="SMTP_FROM")
    SMTP_FROM_NAME: str = Field("ERP Conversacional", env="SMTP_FROM_NAME")
    SMTP_USE_TLS: bool = Field(True, env="SMTP_USE_TLS")
    SMTP_USE_SSL: bool = Field(False, env="SMTP_USE_SSL")
    
    # ============================================
    # AWS S3 (para PDFs y backups)
    # ============================================
    AWS_ACCESS_KEY_ID: Optional[str] = Field(None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(None, env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = Field("us-east-1", env="AWS_REGION")
    S3_BUCKET_NAME: Optional[str] = Field(None, env="S3_BUCKET_NAME")
    S3_PUBLIC_URL: Optional[str] = Field(None, env="S3_PUBLIC_URL")
    
    @property
    def S3_CONFIGURED(self) -> bool:
        return bool(
            self.AWS_ACCESS_KEY_ID and 
            self.AWS_SECRET_ACCESS_KEY and 
            self.S3_BUCKET_NAME
        )
    
    # ============================================
    # URLS
    # ============================================
    FRONTEND_URL: str = Field("http://localhost:5173", env="FRONTEND_URL")
    BACKEND_URL: str = Field("http://localhost:8000", env="BACKEND_URL")
    

    # ============================================
    # STRIPE PAYMENTS
    # ============================================
    STRIPE_SECRET_KEY: Optional[str] = Field(None, env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(None, env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(None, env="STRIPE_WEBHOOK_SECRET")
    
    @property
    def STRIPE_CONFIGURED(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY and self.STRIPE_WEBHOOK_SECRET)
    

    # 🔥 DESHABILITADO - GOOGLE OAUTH
    # GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    # GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # ============================================
    # DATABASE TYPE DETECTION
    # ============================================
    @property
    def DATABASE_TYPE(self) -> str:
        if not self.DATABASE_URL:
            return "unknown"
        parsed = urlparse(self.DATABASE_URL)
        scheme = parsed.scheme.split('+')[0]
        return scheme
    
    @property
    def IS_POSTGRESQL(self) -> bool:
        return self.DATABASE_TYPE in ['postgresql', 'postgres']
    
    @property
    def IS_MYSQL(self) -> bool:
        return self.DATABASE_TYPE in ['mysql', 'mariadb']
    
    @property
    def IS_SQLITE(self) -> bool:
        return self.DATABASE_TYPE == 'sqlite'
    
    @property
    def IS_MSSQL(self) -> bool:
        return self.DATABASE_TYPE == 'mssql'


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()