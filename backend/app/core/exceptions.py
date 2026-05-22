# backend/app/core/exceptions.py
"""
Custom exceptions for the application
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


# ============================================
# EXCEPTION CLASSES
# ============================================

class BaseAppException(Exception):
    """Base exception for all application exceptions"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTP exception"""
        return HTTPException(
            status_code=self.status_code,
            detail={
                "message": self.message,
                "details": self.details,
                "type": self.__class__.__name__
            }
        )


class DuplicateResourceError(BaseAppException):
    """Raised when a resource already exists"""
    
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource} already exists"
        if identifier:
            message = f"{resource} with identifier '{identifier}' already exists"
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details={"resource": resource, "identifier": identifier}
        )


class ValidationError(BaseAppException):
    """Raised when validation fails"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field": field} if field else {}
        )


class NotFoundError(BaseAppException):
    """Raised when a resource is not found"""
    
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": identifier}
        )


class PermissionDeniedError(BaseAppException):
    """Raised when user doesn't have permission"""
    
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class AuthenticationError(BaseAppException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class InvalidPhoneNumberError(ValidationError):
    """Raised when phone number is invalid"""
    
    def __init__(self, phone: str):
        super().__init__(
            message=f"Invalid phone number format: {phone}",
            field="phone_number"
        )


class InvalidIdentificationError(ValidationError):
    """Raised when identification (cedula/RUC) is invalid"""
    
    def __init__(self, identification: str):
        super().__init__(
            message=f"Invalid identification number: {identification}",
            field="identification"
        )


class BusinessNotFoundError(NotFoundError):
    """Raised when business is not found"""
    
    def __init__(self, business_id: Optional[str] = None):
        super().__init__("Business", business_id)


class CustomerNotFoundError(NotFoundError):
    """Raised when customer is not found"""
    
    def __init__(self, customer_id: Optional[str] = None):
        super().__init__("Customer", customer_id)


class ProductNotFoundError(NotFoundError):
    """Raised when product is not found"""
    
    def __init__(self, product_id: Optional[str] = None):
        super().__init__("Product", product_id)


class SaleNotFoundError(NotFoundError):
    """Raised when sale is not found"""
    
    def __init__(self, sale_id: Optional[str] = None):
        super().__init__("Sale", sale_id)


class InsufficientStockError(BaseAppException):
    """Raised when there's not enough stock"""
    
    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            message=f"Insufficient stock for {product_name}. Available: {available}, Requested: {requested}",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={
                "product": product_name,
                "available_stock": available,
                "requested_quantity": requested
            }
        )


# ============================================
# EXCEPTION HANDLERS
# ============================================

def setup_exception_handlers(app: FastAPI):
    """
    Setup global exception handlers for the FastAPI application
    """
    
    @app.exception_handler(BaseAppException)
    async def base_app_exception_handler(request: Request, exc: BaseAppException):
        """Handle custom application exceptions"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": exc.__class__.__name__
                }
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors"""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "message": "Validation error",
                    "details": errors,
                    "type": "validation_error"
                }
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.detail,
                    "type": "http_error",
                    "status_code": exc.status_code
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Handle unhandled exceptions"""
        # Log the error here
        print(f"Unhandled exception: {str(exc)}")
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "message": "Internal server error",
                    "type": "internal_error"
                }
            }
        )
    
    @app.exception_handler(DuplicateResourceError)
    async def duplicate_resource_handler(request: Request, exc: DuplicateResourceError):
        """Handle duplicate resource errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "duplicate_resource"
                }
            }
        )
    
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        """Handle validation errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "validation_error"
                }
            }
        )
    
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        """Handle not found errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "not_found"
                }
            }
        )
    
    @app.exception_handler(PermissionDeniedError)
    async def permission_denied_handler(request: Request, exc: PermissionDeniedError):
        """Handle permission denied errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "permission_denied"
                }
            }
        )
    
    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(request: Request, exc: AuthenticationError):
        """Handle authentication errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "authentication_error"
                }
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    @app.exception_handler(InvalidPhoneNumberError)
    async def invalid_phone_handler(request: Request, exc: InvalidPhoneNumberError):
        """Handle invalid phone number errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "invalid_phone_number"
                }
            }
        )
    
    @app.exception_handler(InvalidIdentificationError)
    async def invalid_identification_handler(request: Request, exc: InvalidIdentificationError):
        """Handle invalid identification errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "details": exc.details,
                    "type": "invalid_identification"
                }
            }
        )