# backend/scripts/create_admin_user.py
"""
Script para crear un usuario administrador manualmente
Ejecutar: python scripts/create_admin_user.py
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.core.security import security_service
from app.models.user import User, UserRole
from app.models.business import Business
from datetime import datetime
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Crea un usuario administrador"""
    db = SessionLocal()
    
    try:
        print("\n👤 Crear usuario administrador")
        print("-" * 40)
        
        # Solicitar datos
        email = input("Email: ").strip()
        username = input("Username: ").strip()
        password = input("Password: ").strip()
        first_name = input("First name: ").strip()
        last_name = input("Last name: ").strip()
        business_name = input("Business name: ").strip()
        ruc = input("RUC (13 dígitos): ").strip()
        
        # Verificar si ya existe
        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if existing_user:
            logger.error(f"❌ Usuario ya existe: {existing_user.email}")
            return
        
        # Crear negocio
        business = Business(
            id=uuid.uuid4(),
            ruc=ruc,
            business_name=business_name,
            commercial_name=business_name,
            email=email,
            phone="0999999999",
            sri_emisor_type="01",
            is_active=True,
            subscription_plan="premium",
            subscription_status="active"
        )
        db.add(business)
        db.flush()
        
        # Crear usuario admin
        user = User(
            id=uuid.uuid4(),
            business_id=business.id,
            email=email,
            username=username,
            password_hash=security_service.get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            phone="0999999999",
            role=UserRole.OWNER,
            is_verified=True,  # Admin se crea verificado
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(user)
        db.commit()
        
        logger.info(f"✅ Usuario administrador creado exitosamente!")
        logger.info(f"   Email: {email}")
        logger.info(f"   Username: {username}")
        logger.info(f"   Rol: {UserRole.OWNER}")
        logger.info(f"   Negocio: {business_name}")
        
    except Exception as e:
        logger.error(f"❌ Error creando usuario: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("⚠️  ¿Crear usuario administrador? (sí/no): ")
    if confirm.lower() in ['sí', 'si', 's']:
        create_admin_user()
    else:
        print("❌ Operación cancelada")