"""
Base class with multi-database support
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime, func, Index, String
from sqlalchemy.types import TypeDecorator, VARCHAR
import uuid
import json

from app.core.config import settings

Base = declarative_base()


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Usa UUID de PostgreSQL nativo, y CHAR(32) en otros motores
    """
    impl = VARCHAR(32)
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(VARCHAR(32))
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value.hex
            return value
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return uuid.UUID(value)


class JSONType(TypeDecorator):
    """
    Platform-independent JSON type.
    Usa JSONB en PostgreSQL, TEXT con JSON en otros motores
    """
    impl = VARCHAR
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(VARCHAR())
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            try:
                return json.loads(value)
            except:
                return {}


class TimestampMixin:
    """Mixin for timestamp fields - works with all databases"""
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class BaseModel(Base, TimestampMixin):
    """Base model with common fields - database agnostic"""
    __abstract__ = True
    
    # ID universal - funciona en todos los motores
    id = Column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    # Metadata como JSON - funciona en todos los motores
    extra_data = Column(
        JSONType(),
        nullable=False,
        default={}
    )
    
    def dict(self):
        """Convert model to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, uuid.UUID):
                value = str(value)
            elif hasattr(value, 'isoformat'):  # datetime
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def update(self, **kwargs):
        """Update model attributes"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return self