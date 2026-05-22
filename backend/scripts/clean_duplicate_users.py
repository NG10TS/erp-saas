# backend/scripts/clean_duplicate_users.py
"""
Script para limpiar usuarios duplicados en la base de datos
Ejecutar: python scripts/clean_duplicate_users.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path para poder importar app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.business import Business
from sqlalchemy import func, delete
from sqlalchemy.sql import exists
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_duplicate_users():
    """Limpia usuarios duplicados manteniendo el más reciente"""
    db = SessionLocal()
    try:
        logger.info("🔍 Buscando usuarios duplicados...")
        
        # Encontrar emails duplicados
        duplicates = db.query(
            User.email, 
            func.count(User.id).label('count')
        ).group_by(User.email).having(func.count(User.id) > 1).all()
        
        if not duplicates:
            logger.info("✅ No se encontraron usuarios duplicados")
            return
        
        logger.info(f"📊 Se encontraron {len(duplicates)} emails duplicados:")
        for email, count in duplicates:
            logger.info(f"  - {email}: {count} registros")
        
        # Procesar cada email duplicado
        for email, count in duplicates:
            # Obtener todos los usuarios con ese email, ordenados por fecha de creación
            users = db.query(User).filter(User.email == email).order_by(User.created_at.desc()).all()
            
            # Mantener el más reciente (primer elemento), eliminar los demás
            keep_user = users[0]
            users_to_delete = users[1:]
            
            logger.info(f"\n📧 Procesando {email}:")
            logger.info(f"  ✅ Manteniendo usuario: {keep_user.id} ({keep_user.username}) - creado: {keep_user.created_at}")
            
            for user in users_to_delete:
                logger.info(f"  ❌ Eliminando usuario: {user.id} ({user.username}) - creado: {user.created_at}")
                
                # Verificar si este usuario tiene negocios asociados
                if user.business:
                    logger.info(f"     - Negocio asociado: {user.business.business_name}")
                    # Opcional: transferir negocio al usuario que mantenemos si es necesario
                    # keep_user.business_id = user.business_id
                
                db.delete(user)
        
        # Confirmar cambios
        db.commit()
        logger.info("\n✅ Limpieza completada exitosamente")
        
        # Mostrar resumen final
        remaining_users = db.query(User).count()
        logger.info(f"📊 Total de usuarios después de limpieza: {remaining_users}")
        
    except Exception as e:
        logger.error(f"❌ Error durante la limpieza: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def check_user_exists(email: str):
    """Verifica si un email ya existe"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            logger.info(f"✅ Usuario encontrado: {user.email} (ID: {user.id})")
            logger.info(f"   - Username: {user.username}")
            logger.info(f"   - Verificado: {user.is_verified}")
            logger.info(f"   - Activo: {user.is_active}")
            return True
        else:
            logger.info(f"❌ No se encontró usuario con email: {email}")
            return False
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Limpieza de usuarios duplicados')
    parser.add_argument('--check', type=str, help='Verificar si un email existe')
    parser.add_argument('--dry-run', action='store_true', help='Simular limpieza sin eliminar')
    
    args = parser.parse_args()
    
    if args.check:
        check_user_exists(args.check)
    else:
        logger.info("🚀 Iniciando script de limpieza de usuarios duplicados")
        if args.dry_run:
            logger.info("⚠️  Modo DRY RUN - No se eliminarán usuarios")
            # Implementar dry run si es necesario
        else:
            confirm = input("⚠️  ¿Estás seguro de eliminar usuarios duplicados? (sí/no): ")
            if confirm.lower() == 'sí' or confirm.lower() == 'si' or confirm.lower() == 's':
                clean_duplicate_users()
            else:
                logger.info("❌ Operación cancelada")