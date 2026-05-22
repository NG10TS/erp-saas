"""
Database configuration with multi-engine support
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from typing import Generator, Dict, Any
import logging
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.db.base_class import Base

from sqlalchemy import text

logger = logging.getLogger(__name__)


class DatabaseFactory:
    """Factory para crear conexiones según el motor"""
    
    @staticmethod
    def get_connection_args() -> Dict[str, Any]:
        """Obtiene argumentos de conexión según el motor"""
        args = {}
        
        if settings.IS_POSTGRESQL:
            args.update({
                "connect_args": {
                    "connect_timeout": 10,
                    "options": "-c timezone=utc"
                }
            })
        elif settings.IS_MYSQL:
            args.update({
                "connect_args": {
                    "charset": "utf8mb4",
                    "use_unicode": True
                }
            })
        elif settings.IS_SQLITE:
            args.update({
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 30
                }
            })
        elif settings.IS_MSSQL:
            args.update({
                "connect_args": {
                    "timeout": 30,
                    "autocommit": False
                }
            })
        
        return args
    
    @staticmethod
    def get_pool_class():
        """Obtiene la clase de pool apropiada"""
        if settings.IS_SQLITE:
            return NullPool  # SQLite no soporta pool multi-thread
        return QueuePool
    
    @staticmethod
    def get_engine_kwargs() -> Dict[str, Any]:
        """Obtiene kwargs para create_engine"""
        kwargs = {
            "poolclass": DatabaseFactory.get_pool_class(),
            "echo": settings.DATABASE_ECHO,
            "future": True,
        }
        
        # Configuración específica por motor
        if not settings.IS_SQLITE:
            kwargs.update({
                "pool_size": settings.DATABASE_POOL_SIZE,
                "max_overflow": settings.DATABASE_MAX_OVERFLOW,
                "pool_pre_ping": settings.DATABASE_POOL_PRE_PING,
                "pool_recycle": settings.DATABASE_POOL_RECYCLE,
            })
        
        # Argumentos de conexión específicos
        kwargs.update(DatabaseFactory.get_connection_args())
        
        return kwargs


# Crear engine universal
engine = create_engine(
    settings.DATABASE_URL,
    **DatabaseFactory.get_engine_kwargs()
)


# Configurar eventos según motor
@event.listens_for(engine, "connect")
def on_connect(dbapi_connection, connection_record):
    """Configura conexión según el motor"""
    if settings.IS_POSTGRESQL:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET timezone = 'UTC'")
        if settings.DATABASE_STATEMENT_TIMEOUT:
            cursor.execute(f"SET statement_timeout = {settings.DATABASE_STATEMENT_TIMEOUT}")
        cursor.close()
    
    elif settings.IS_MYSQL:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET time_zone = '+00:00'")
        cursor.execute("SET NAMES 'utf8mb4'")
        cursor.close()
    
    elif settings.IS_SQLITE:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute("PRAGMA journal_mode = WAL")
        cursor.execute("PRAGMA synchronous = NORMAL")
        cursor.close()


# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    class_=Session
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database (creates tables if they don't exist)
    """
    try:
        # Ejecutar setup específico por motor
        with engine.connect() as conn:
            if settings.IS_POSTGRESQL:
                conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
                conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
                conn.commit()
        
        # Crear tablas
        Base.metadata.create_all(bind=engine)
        logger.info(f"✅ Database initialized successfully with {settings.DATABASE_TYPE}")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise