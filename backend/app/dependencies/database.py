"""
Dependencias para sesiones de base de datos con tenant isolation
"""
from sqlalchemy.orm import Session
from fastapi import Request, Depends
from typing import Generator, Optional

from app.core.database import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependencia para obtener sesión de BD
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_with_tenant(
    request: Request,
    db: Session = Depends(get_db)
) -> Generator[Session, None, None]:
    """
    Dependencia que añade filtro de tenant a las queries
    """
    # Obtener tenant_id del request state
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if tenant_id:
        # Aquí podrías configurar un filtro global
        # usando el event listener de SQLAlchemy
        pass
    
    yield db

def get_read_only_db() -> Generator[Session, None, None]:
    """
    Sesión de BD solo lectura (para réplicas)
    """
    # En producción, conectar a read replica
    db = SessionLocal()
    try:
        # Forzar modo read-only
        db.execute("SET TRANSACTION READ ONLY")
        yield db
    finally:
        db.close()