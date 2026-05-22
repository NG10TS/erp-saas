# app/core/logging.py

import logging
import sys
from datetime import datetime
from typing import Optional
from pythonjsonlogger import jsonlogger
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

from app.core.config import settings

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = self.formatTime(record, self.datefmt)
        log_record['level'] = record.levelname
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno
        
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        if hasattr(record, 'business_id'):
            log_record['business_id'] = record.business_id
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

# ------------------------
# Logger global
# ------------------------
logger = logging.getLogger("erp_logger")

def setup_logging() -> None:
    """Configure logging for the application"""
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    
    root_logger.setLevel(logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    if settings.ENVIRONMENT == "production":
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(module)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    logger.addHandler(console_handler)  # attach to global logger
    
    # File handler for development
    if settings.ENVIRONMENT == "development":
        file_handler = logging.FileHandler('app.log')
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
        logger.addHandler(file_handler)
    
    # Sentry
    if settings.SENTRY_DSN and settings.ENVIRONMENT == "production":
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
                RedisIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
    
    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)
    
    logger.info(f"✅ Logging configured for {settings.ENVIRONMENT} environment")

# ------------------------
# Audit Logger
# ------------------------
class AuditLogger:
    """Audit logging for sensitive operations"""
    def __init__(self):
        self.logger = logging.getLogger("audit")
        if not self.logger.handlers:
            handler = logging.FileHandler('audit.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    def log(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None
    ):
        log_data = {
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "details": details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.logger.info(f"Audit: {log_data}")

audit_logger = AuditLogger()

def get_audit_logger() -> AuditLogger:
    return audit_logger