# backend/app/api/v1/endpoints/customers.py
"""
Customer endpoints - Complete CRUD operations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Any, List, Optional, Dict
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.api.deps import get_current_business, get_db
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse
)
from app.services.customer_service import CustomerService
from app.core.exceptions import (
    DuplicateResourceError,
    ValidationError,
    NotFoundError,
    InvalidPhoneNumberError,
    InvalidIdentificationError
)
from app.models.business import Business

router = APIRouter()


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create customer"
)
async def create_customer(
    customer_in: CustomerCreate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new customer.
    
    - **phone_number**: Valid Ecuadorian phone number
    - **identification**: Valid cedula (10 digits) or RUC (13 digits)
    - **name**: Customer full name (optional)
    - **email**: Valid email address (optional)
    - **address**: Customer address (optional)
    """
    try:
        service = CustomerService(db)
        customer = service.create(
            business_id=current_business.id,
            customer_in=customer_in
        )
        return customer
        
    except DuplicateResourceError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": e.message,
                "type": "duplicate_resource",
                "details": e.details
            }
        )
    except (ValidationError, InvalidPhoneNumberError, InvalidIdentificationError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": e.message,
                "type": "validation_error",
                "details": e.details
            }
        )
    except Exception as e:
        print(f"Unexpected error creating customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error creating customer",
                "type": "internal_error"
            }
        )


@router.get(
    "/",
    response_model=List[CustomerListResponse],
    summary="List customers"
)
async def list_customers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    search: Optional[str] = Query(None, description="Search by name, phone, identification or email"),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    List customers with pagination and optional search.
    """
    service = CustomerService(db)
    
    if search:
        customers = service.search(
            business_id=current_business.id,
            query=search,
            limit=limit
        )
    else:
        customers = service.get_by_business(
            business_id=current_business.id,
            skip=skip,
            limit=limit
        )
    
    return customers


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get customer by ID"
)
async def get_customer(
    customer_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get detailed customer information by ID.
    """
    service = CustomerService(db)
    customer = service.get(customer_id)
    
    if not customer or customer.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Customer not found",
                "type": "not_found"
            }
        )
    
    return customer


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update customer"
)
async def update_customer(
    customer_id: UUID,
    customer_in: CustomerUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update customer information.
    """
    try:
        service = CustomerService(db)
        
        # Verify customer belongs to business
        customer = service.get(customer_id)
        if not customer or customer.business_id != current_business.id:
            raise NotFoundError("Customer", str(customer_id))
        
        updated = service.update(customer_id, customer_in)
        return updated
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "type": "not_found"}
        )
    except (ValidationError, InvalidPhoneNumberError, InvalidIdentificationError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": e.message, "type": "validation_error"}
        )
    except Exception as e:
        print(f"Error updating customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error updating customer", "type": "internal_error"}
        )


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete customer"
)
async def delete_customer(
    customer_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> None:
    """
    Soft delete a customer.
    """
    try:
        service = CustomerService(db)
        
        # Verify customer belongs to business
        customer = service.get(customer_id)
        if not customer or customer.business_id != current_business.id:
            raise NotFoundError("Customer", str(customer_id))
        
        service.delete(customer_id)
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "type": "not_found"}
        )
    except Exception as e:
        print(f"Error deleting customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error deleting customer", "type": "internal_error"}
        )


@router.get(
    "/phone/{phone}",
    response_model=CustomerResponse,
    summary="Get customer by phone"
)
async def get_customer_by_phone(
    phone: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get customer by phone number.
    """
    service = CustomerService(db)
    customer = service.get_by_phone(current_business.id, phone)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Customer not found", "type": "not_found"}
        )
    
    return customer


@router.get(
    "/identification/{identification}",
    response_model=CustomerResponse,
    summary="Get customer by identification"
)
async def get_customer_by_identification(
    identification: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get customer by identification (cedula or RUC).
    """
    service = CustomerService(db)
    customer = service.get_by_identification(current_business.id, identification)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Customer not found", "type": "not_found"}
        )
    
    return customer


@router.get(
    "/{customer_id}/purchases",
    response_model=List[Any],
    summary="Get customer purchase history"
)
async def get_customer_purchases(
    customer_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get purchase history for a specific customer.
    """
    service = CustomerService(db)
    
    # Verify customer belongs to business
    customer = service.get(customer_id)
    if not customer or customer.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Customer not found", "type": "not_found"}
        )
    
    purchases = service.get_purchase_history(customer_id, skip, limit)
    return purchases


@router.get(
    "/stats/top",
    response_model=List[CustomerListResponse],
    summary="Get top customers"
)
async def get_top_customers(
    limit: int = Query(10, ge=1, le=100),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get top customers by total spending.
    """
    service = CustomerService(db)
    customers = service.get_top_customers(current_business.id, limit)
    return customers


@router.get(
    "/{customer_id}/summary",
    response_model=Dict[str, Any],
    summary="Get customer summary"
)
async def get_customer_summary(
    customer_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get complete customer summary with statistics.
    """
    service = CustomerService(db)
    
    # Verify customer belongs to business
    customer = service.get(customer_id)
    if not customer or customer.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Customer not found", "type": "not_found"}
        )
    
    summary = service.get_customer_summary(customer_id)
    return summary


@router.post(
    "/{customer_id}/block",
    response_model=Dict[str, str],
    summary="Block customer"
)
async def block_customer(
    customer_id: UUID,
    reason: Optional[str] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Block a customer from making purchases.
    """
    try:
        service = CustomerService(db)
        
        customer = service.get(customer_id)
        if not customer or customer.business_id != current_business.id:
            raise NotFoundError("Customer", str(customer_id))
        
        customer.is_blocked = True
        customer.blocked_reason = reason
        customer.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Customer blocked successfully"}
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "type": "not_found"}
        )
    except Exception as e:
        db.rollback()
        print(f"Error blocking customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error blocking customer", "type": "internal_error"}
        )


@router.post(
    "/{customer_id}/unblock",
    response_model=Dict[str, str],
    summary="Unblock customer"
)
async def unblock_customer(
    customer_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
) -> Any:
    """
    Unblock a customer.
    """
    try:
        service = CustomerService(db)
        
        customer = service.get(customer_id)
        if not customer or customer.business_id != current_business.id:
            raise NotFoundError("Customer", str(customer_id))
        
        customer.is_blocked = False
        customer.blocked_reason = None
        customer.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Customer unblocked successfully"}
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "type": "not_found"}
        )
    except Exception as e:
        db.rollback()
        print(f"Error unblocking customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error unblocking customer", "type": "internal_error"}
        )