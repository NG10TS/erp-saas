#!/usr/bin/env python3
"""
Script para verificar conexión a base de datos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_database():
    """Verifica conexión a base de datos"""
    logger.info(f"🔍 Verificando conexión a base de datos...")
    logger.info(f"📊 Tipo: {settings.DATABASE_TYPE}")
    logger.info(f"🔗 URL: {settings.DATABASE_URL}")
    
    try:
        with engine.connect() as conn:
            # Prueba simple
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
            
            # Información específica por motor
            if settings.IS_POSTGRESQL:
                version = conn.execute(text("SELECT version()")).scalar()
                logger.info(f"✅ PostgreSQL conectado: {version[:50]}...")
                
            elif settings.IS_MYSQL:
                version = conn.execute(text("SELECT version()")).scalar()
                logger.info(f"✅ MySQL conectado: {version}")
                
            elif settings.IS_SQLITE:
                version = conn.execute(text("SELECT sqlite_version()")).scalar()
                logger.info(f"✅ SQLite conectado: {version}")
                
            elif settings.IS_MSSQL:
                version = conn.execute(text("SELECT @@version")).scalar()
                logger.info(f"✅ SQL Server conectado")
            
            logger.info("✅ Conexión exitosa!")
            return True
            
    except Exception as e:
        logger.error(f"❌ Error de conexión: {e}")
        return False


if __name__ == "__main__":
    success = check_database()
    sys.exit(0 if success else 1)