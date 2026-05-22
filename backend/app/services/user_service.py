"""
User service - Gestión profesional de usuarios
"""
import secrets
import string
import re
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
import logging

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.constants.roles import UserRole
from app.core.security import security_service

logger = logging.getLogger(__name__)


class UserService:
    """Servicio profesional para gestión de usuarios"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)
    
    # ============================================
    # MÉTODOS PÚBLICOS - CRUD
    # ============================================
    
    def get_user_by_id(self, user_id: UUID, business_id: UUID = None) -> Optional[User]:
        """Obtener usuario por ID, opcionalmente filtrando por negocio"""
        if business_id:
            return self.repo.get_by_id_and_business(user_id, business_id)
        return self.repo.get(user_id)
    
    def get_users_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[User]:
        """Listar usuarios de un negocio con filtros"""
        return self.repo.get_by_business(
            business_id=business_id,
            skip=skip,
            limit=limit,
            search=search,
            is_active=is_active,
        )
    
    def count_users_by_business(self, business_id: UUID) -> int:
        """Contar usuarios activos de un negocio"""
        return self.repo.count_active_by_business(business_id)
    
    # ============================================
    # CREATE - CON GENERACIÓN AUTOMÁTICA
    # ============================================
    
    def create_user(
        self,
        user_in: UserCreate,
        business_id: UUID,
        created_by: UUID,
    ) -> Tuple[User, str]:
        """
        Crear un nuevo usuario (empleado)
        
        Returns:
            Tuple[User, str]: (usuario_creado, contraseña_generada)
        """
        # 1. Generar username si no se proporcionó
        username = self._generate_username(user_in)
        
        # 2. Generar contraseña si no se proporcionó
        password = user_in.password if user_in.password else self._generate_secure_password()
        
        # 3. Validar unicidad
        self._validate_uniqueness(user_in.email, username)
        
        # 4. Validar rol
        if user_in.role not in [r.value for r in UserRole]:
            raise ValueError(f"Rol inválido. Opciones: {[r.value for r in UserRole]}")
        
        # 5. Crear usuario
        user = User(
            email=user_in.email,
            username=username,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            phone=user_in.phone,
            business_id=business_id,
            role=user_in.role,
            is_active=True,
            is_verified=True,
            password_hash = security_service.get_password_hash(password),
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(
            f"User created: {user.email} (role: {user.role}) "
            f"by {created_by} | password_generated={not user_in.password}"
        )
        
        return user, password
    
    # ============================================
    # UPDATE
    # ============================================
    
    def update_user_role(self, user_id: UUID, business_id: UUID, new_role: str) -> User:
        """Cambiar rol de usuario (solo owner)"""
        user = self.repo.get_by_id_and_business(user_id, business_id)
        if not user:
            raise ValueError("Usuario no encontrado")
        
        if new_role not in [r.value for r in UserRole]:
            raise ValueError(f"Rol inválido. Opciones: {[r.value for r in UserRole]}")
        
        old_role = user.role
        user.role = new_role
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"User role changed: {user.email} | {old_role} → {new_role}")
        return user
    
    def update_user(
        self,
        user_id: UUID,
        user_update: UserUpdate,
        current_user: User,
    ) -> User:
        """Actualizar un usuario existente"""
        user = self.repo.get(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")
        
        if user_update.first_name is not None:
            user.first_name = user_update.first_name
        if user_update.last_name is not None:
            user.last_name = user_update.last_name
        if user_update.phone is not None:
            user.phone = user_update.phone
        if user_update.is_active is not None and current_user.role == UserRole.OWNER:
            user.is_active = user_update.is_active
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"User updated: {user.email}")
        return user
    
    # ============================================
    # DELETE (SOFT DELETE)
    # ============================================
    
    def delete_user(self, user_id: UUID, business_id: UUID, deleted_by: UUID) -> bool:
        """Soft delete de usuario"""
        user = self.repo.get_by_id_and_business(user_id, business_id)
        if not user:
            return False
        
        user.soft_delete(deleted_by)
        self.db.commit()
        
        logger.info(f"User deleted: {user.email} by {deleted_by}")
        return True
    
    def set_user_active_status(
        self,
        user_id: UUID,
        business_id: UUID,
        is_active: bool,
    ) -> bool:
        """Activar o desactivar un usuario"""
        user = self.repo.get_by_id_and_business(user_id, business_id)
        if not user:
            return False
        
        user.is_active = is_active
        self.db.commit()
        
        status = "activated" if is_active else "deactivated"
        logger.info(f"User {status}: {user.email}")
        return True
    
    # ============================================
    # MÉTODOS PRIVADOS - LÓGICA DE NEGOCIO
    # ============================================
    
    def _generate_username(self, user_in: UserCreate) -> str:
        """Generar username profesional a partir del email o nombre"""
        if user_in.username:
            return user_in.username.lower()
        
        # Base: parte local del email (antes del @)
        base_username = user_in.email.split('@')[0].lower()
        
        # Limpiar caracteres no permitidos
        base_username = re.sub(r'[^a-z0-9_.-]', '_', base_username)
        
        # Verificar si ya existe
        existing = self.repo.get_by_username(base_username)
        if not existing:
            return base_username
        
        # Si existe, agregar sufijo numérico
        counter = 1
        while True:
            candidate = f"{base_username}_{counter}"
            if not self.repo.get_by_username(candidate):
                return candidate
            counter += 1
    
    def _generate_secure_password(self, length: int = 12) -> str:
        """Generar contraseña segura"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        
        # Asegurar que tenga al menos una mayúscula, minúscula, número y especial
        if not re.search(r'[A-Z]', password):
            password = password[:-1] + 'A'
        if not re.search(r'[a-z]', password):
            password = password[:-1] + 'a'
        if not re.search(r'[0-9]', password):
            password = password[:-1] + '1'
        if not re.search(r'[!@#$%^&*]', password):
            password = password[:-1] + '!'
        
        return password
    
    def _validate_uniqueness(self, email: str, username: str) -> None:
        """Validar que email y username sean únicos"""
        if self.repo.get_by_email(email):
            raise ValueError("Email ya registrado")
        
        if self.repo.get_by_username(username):
            raise ValueError(f"Nombre de usuario '{username}' ya está en uso")
    
    def change_password(
        self,
        user_id: UUID,
        old_password: str,
        new_password: str,
    ) -> bool:
        """Cambiar contraseña de usuario"""
        user = self.repo.get(user_id)
        if not user:
            return False
        
        if not user.check_password(old_password):
            return False
        
        user.set_password(new_password)
        self.db.commit()
        
        logger.info(f"Password changed for user: {user.email}")
        return True