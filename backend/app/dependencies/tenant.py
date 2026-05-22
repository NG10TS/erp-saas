# backend/app/dependencies/tenant.py
"""
Tenant dependencies for multi-business isolation.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.business import Business
from app.repositories.business_repository import BusinessRepository

logger = logging.getLogger(__name__)


async def get_current_business_id(
    current_user: User = Depends(get_current_active_user),
) -> str:
    """
    Get the current business ID from the authenticated user.
    
    Returns:
        Business ID as string
        
    Raises:
        HTTPException 400: If user has no business associated
    """
    if not current_user.business_id:
        logger.error(f"User {current_user.id} has no associated business")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is not associated with any business."
        )
    
    return str(current_user.business_id)


async def get_current_business(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Business:
    """
    Get the current business object from the authenticated user.
    
    This dependency fetches the full Business entity and validates it exists.
    
    Returns:
        Business object
        
    Raises:
        HTTPException 404: If business not found
        HTTPException 403: If business is inactive
    """
    if not current_user.business_id:
        logger.error(f"User {current_user.id} has no associated business")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is not associated with any business."
        )
    
    business_repo = BusinessRepository(db)
    business = business_repo.get(current_user.business_id)
    
    if not business:
        logger.error(f"Business {current_user.business_id} not found for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated business not found."
        )
    
    if not business.is_active:
        logger.warning(f"Business {current_user.business_id} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business account is inactive. Please contact support."
        )
    
    return business


async def get_optional_business_id(
    current_user: User = Depends(get_current_active_user),
) -> Optional[str]:
    """
    Get business ID if exists, returns None otherwise.
    Useful for endpoints that work with or without business context.
    """
    return str(current_user.business_id) if current_user.business_id else None


async def get_optional_business(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Optional[Business]:
    """
    Get business object if exists, returns None otherwise.
    """
    if not current_user.business_id:
        return None
    
    business_repo = BusinessRepository(db)
    business = business_repo.get(current_user.business_id)
    
    if not business or not business.is_active:
        return None
    
    return business