"""
Servicio OAuth para autenticación con Google
"""
import httpx
from typing import Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import security_service
import logging

logger = logging.getLogger(__name__)


class OAuthService:
    def __init__(self, db: Session):
        self.db = db

    async def get_google_user_info(self, access_token: str) -> Dict[str, Any]:
        """Obtiene información del usuario desde Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()

    async def authenticate_or_create_google_user(self, user_info: Dict[str, Any]) -> Tuple[User, bool]:
        """
        Autentica o crea un usuario con datos de Google
        Retorna (user, is_new_user) donde is_new_user=True si fue creado ahora
        """
        email = user_info.get("email")
        google_id = user_info.get("id")
        name = user_info.get("name", "").split(" ")
        first_name = name[0] if len(name) > 0 else ""
        last_name = name[1] if len(name) > 1 else ""
        avatar = user_info.get("picture")

        # Buscar usuario por email
        user = self.db.query(User).filter(User.email == email).first()
        is_new = False

        if not user:
            # Crear nuevo usuario con Google SIN NEGOCIO (business_id = None)
            username = email.split("@")[0]
            base_username = username
            counter = 1
            while self.db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                password_hash=security_service.get_password_hash(google_id),
                is_active=True,
                is_verified=True,
                verified_at=datetime.utcnow(),
                business_id=None,  # ← IMPORTANTE: Sin negocio inicialmente
                extra_data={"google_id": google_id, "avatar": avatar}
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            is_new = True
            logger.info(f"Usuario nuevo creado vía Google: {email}")
        else:
            # Actualizar Google ID si no existe
            if not user.extra_data:
                user.extra_data = {}
            if not user.extra_data.get("google_id"):
                user.extra_data["google_id"] = google_id
                user.extra_data["avatar"] = avatar
                self.db.commit()
            logger.info(f"Usuario existente autenticado vía Google: {email}")

        return user, is_new