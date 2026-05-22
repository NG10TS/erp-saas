# backend/app/api/deps.py
"""
Dependencies for API endpoints
"""
from typing import Optional, Any
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.business import Business
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.business_service import BusinessService
from app.core.exceptions import AuthenticationError

# Security
security = HTTPBearer(auto_error=False)  # ✅ auto_error=False para manejar nosotros


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from JWT token
    Returns None if no token provided (for optional auth)
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    auth_service = AuthService(db)
    
    try:
        user = auth_service.get_current_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (required authentication)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return current_user


async def get_current_business(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Business:
    """
    Get current business for the authenticated user
    """
    if not current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no associated business"
        )
    
    business_service = BusinessService(db)
    business = business_service.get(current_user.business_id)
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if not business.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business is inactive"
        )
    
    return business


def require_role(required_roles: list[str]):
    """
    Dependency factory to require specific user roles
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {current_user.role} not allowed. Required: {required_roles}"
            )
        return current_user
    
    return role_checker


# Convenience dependencies
require_admin = require_role(["admin", "super_admin"])
require_manager = require_role(["admin", "manager", "super_admin"])
require_seller = require_role(["admin", "manager", "seller", "super_admin"])


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get user if authenticated, returns None otherwise"""
    if not credentials:
        return None
    
    try:
        auth_service = AuthService(db)
        user = auth_service.get_current_user(credentials.credentials)
        return user
    except Exception:
        return None