"""
Database session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from typing import Generator

from app.core.config import settings

# Read-write engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DATABASE_ECHO,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Read-only engine (for replicas)
if settings.ENVIRONMENT == "production":
    read_engine = create_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql://replica."),
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=False,
    )
    ReadOnlySession = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=read_engine,
        expire_on_commit=False
    )
else:
    ReadOnlySession = SessionLocal


def get_db() -> Generator:
    """
    Dependency for getting DB session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_read_only_db() -> Generator:
    """
    Dependency for getting read-only DB session
    """
    db = ReadOnlySession()
    try:
        # Force read-only transaction
        db.execute("SET TRANSACTION READ ONLY")
        yield db
    finally:
        db.close()


@contextmanager
def transaction():
    """
    Context manager for database transactions
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()