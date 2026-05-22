# backend/app/services/base_service.py
"""
Base service with tenant isolation.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Generic, TypeVar, Any
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class TenantAwareService:
    """
    Base service that enforces business isolation.
    All business-scoped services should inherit from this.
    """
    
    def __init__(self, db: AsyncSession, business_id: str):
        """
        Initialize service with database session and business context.
        
        Args:
            db: Database session
            business_id: Current business ID for tenant isolation
        """
        self.db = db
        self.business_id = UUID(business_id) if isinstance(business_id, str) else business_id
    
    def _apply_tenant_filter(self, query: Any, tenant_column: str = "business_id") -> Any:
        """
        Apply tenant filter to a query.
        
        Args:
            query: SQLAlchemy query object
            tenant_column: Name of the tenant ID column
            
        Returns:
            Filtered query
        """
        from sqlalchemy import text
        
        # This is a helper - actual implementation depends on your ORM
        return query.where(text(f"{tenant_column} = :business_id")).params(
            business_id=self.business_id
        )
    
    def _validate_business_access(self, resource_business_id: UUID) -> bool:
        """
        Validate that a resource belongs to the current business.
        
        Args:
            resource_business_id: Business ID of the resource
            
        Returns:
            True if accessible, False otherwise
        """
        return resource_business_id == self.business_id