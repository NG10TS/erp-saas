"""
Customer service - Comprehensive customer management
"""
import re
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.core.exceptions import (
    DuplicateResourceError,
    ValidationError,
    NotFoundError,
    InvalidPhoneNumberError,
    InvalidIdentificationError
)


class CustomerService:
    """Complete customer service with validation and business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # CRUD OPERATIONS
    # ============================================
    
    def get(self, customer_id: UUID) -> Optional[Customer]:
        """Get customer by ID"""
        return self.db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.is_active == True
        ).first()
    
    def get_by_business(
        self,
        business_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Customer]:
        """Get customers by business with pagination"""
        return self.db.query(Customer).filter(
            Customer.business_id == business_id,
            Customer.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_by_phone(self, business_id: UUID, phone: str) -> Optional[Customer]:
        """Get customer by phone number"""
        normalized = self._normalize_phone(phone)
        return self.db.query(Customer).filter(
            Customer.business_id == business_id,
            Customer.phone_number == normalized,
            Customer.is_active == True
        ).first()
    
    def get_by_identification(self, business_id: UUID, identification: str) -> Optional[Customer]:
        """Get customer by identification"""
        return self.db.query(Customer).filter(
            Customer.business_id == business_id,
            Customer.identification == identification,
            Customer.is_active == True
        ).first()
    
    def search(
        self,
        business_id: UUID,
        query: str,
        limit: int = 20
    ) -> List[Customer]:
        """Search customers by name, phone, identification or email"""
        search_term = f"%{query}%"
        return self.db.query(Customer).filter(
            and_(
                Customer.business_id == business_id,
                Customer.is_active == True,
                or_(
                    Customer.name.ilike(search_term),
                    Customer.phone_number.ilike(search_term),
                    Customer.identification.ilike(search_term),
                    Customer.email.ilike(search_term)
                )
            )
        ).limit(limit).all()
    
    # ============================================
    # CREATE OPERATION
    # ============================================
    
    def create(self, business_id: UUID, customer_in: CustomerCreate) -> Customer:
        """Create new customer with complete validation"""
        try:
            # Validate all data
            self._validate_customer_data(business_id, customer_in)
            
            # Normalize phone number
            normalized_phone = self._normalize_phone(customer_in.phone_number)
            
            # Create customer entity
            customer = Customer(
                business_id=business_id,
                phone_number=normalized_phone,
                name=customer_in.name,
                identification=customer_in.identification,
                email=customer_in.email,
                address=customer_in.address,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                total_purchases=0,
                total_spent=0.0,
                average_purchase=0.0,
                is_active=True,
                is_blocked=False
            )
            
            self.db.add(customer)
            self.db.commit()
            self.db.refresh(customer)
            
            return customer
            
        except Exception as e:
            self.db.rollback()
            raise
    
    # ============================================
    # UPDATE OPERATION
    # ============================================
    
    def update(self, customer_id: UUID, customer_in: CustomerUpdate) -> Customer:
        """Update customer information"""
        try:
            customer = self.get(customer_id)
            if not customer:
                raise NotFoundError("Customer", str(customer_id))
            
            update_data = customer_in.model_dump(exclude_unset=True)
            
            # Validate phone if updating
            if "phone_number" in update_data:
                valid, msg = self._validate_phone_only(update_data["phone_number"])
                if not valid:
                    raise InvalidPhoneNumberError(update_data["phone_number"])
                update_data["phone_number"] = self._normalize_phone(update_data["phone_number"])
            
            # Validate identification if updating
            if "identification" in update_data and update_data["identification"]:
                valid, msg = self._validate_identification_only(update_data["identification"])
                if not valid:
                    raise InvalidIdentificationError(update_data["identification"])
            
            # Validate email if updating
            if "email" in update_data and update_data["email"]:
                if not self._validate_email(update_data["email"]):
                    raise ValidationError("Invalid email format", field="email")
            
            # Update fields
            for key, value in update_data.items():
                setattr(customer, key, value)
            
            customer.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(customer)
            
            return customer
            
        except Exception as e:
            self.db.rollback()
            raise
    
    # ============================================
    # DELETE OPERATION (Soft Delete)
    # ============================================
    
    def delete(self, customer_id: UUID) -> bool:
        """Soft delete customer"""
        try:
            customer = self.get(customer_id)
            if customer:
                customer.is_active = False
                customer.updated_at = datetime.utcnow()
                self.db.commit()
                return True
            return False
        except Exception:
            self.db.rollback()
            raise
    
    # ============================================
    # BUSINESS LOGIC
    # ============================================
    
    def get_or_create_by_phone(
        self,
        business_id: UUID,
        phone: str,
        name: Optional[str] = None
    ) -> Customer:
        """Get existing customer or create new one by phone"""
        normalized_phone = self._normalize_phone(phone)
        customer = self.get_by_phone(business_id, normalized_phone)
        
        if not customer:
            customer_in = CustomerCreate(
                phone_number=normalized_phone,
                name=name
            )
            customer = self.create(business_id, customer_in)
        
        return customer
    
    def update_stats(self, customer_id: UUID, sale_amount: float):
        """Update customer statistics after purchase"""
        try:
            customer = self.get(customer_id)
            if customer:
                customer.total_purchases += 1
                customer.total_spent = float(customer.total_spent or 0) + sale_amount
                customer.average_purchase = customer.total_spent / customer.total_purchases
                customer.last_purchase_date = datetime.utcnow()
                customer.updated_at = datetime.utcnow()
                self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise
    
    # backend/app/services/customer_service.py

    def get_purchase_history(
        self,
        customer_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Sale]:
        """Get customer purchase history"""
        return self.db.query(Sale).filter(
            Sale.customer_id == customer_id
        ).order_by(
            Sale.created_at.desc()  # ✅ CORREGIDO
        ).offset(skip).limit(limit).all()
    
    def get_top_customers(
        self,
        business_id: UUID,
        limit: int = 10
    ) -> List[Customer]:
        """Get top customers by total spent"""
        return self.db.query(Customer).filter(
            Customer.business_id == business_id,
            Customer.is_active == True
        ).order_by(
            Customer.total_spent.desc()
        ).limit(limit).all()
    
    def get_customer_summary(self, customer_id: UUID) -> Dict[str, Any]:
        """Get complete customer summary with statistics"""
        customer = self.get(customer_id)
        if not customer:
            raise NotFoundError("Customer", str(customer_id))
        
        recent_purchases = self.get_purchase_history(customer_id, limit=5)
        
        return {
            "customer": customer,
            "summary": {
                "total_purchases": customer.total_purchases,
                "total_spent": float(customer.total_spent or 0),
                "average_purchase": float(customer.average_purchase or 0),
                "last_purchase": customer.last_purchase_date,
                "recent_purchases": [
                    {
                        "id": s.id,
                        "sale_number": s.sale_number,
                        "date": s.created_at,  # ✅ CORREGIDO: usar created_at
                        "total": float(s.total),
                        "status": s.status
                    }
                    for s in recent_purchases
                ]
            }
        }
    # ============================================
    # VALIDATION METHODS
    # ============================================
    
    def _validate_customer_data(self, business_id: UUID, customer_in: CustomerCreate):
        """Centralized validation for customer data"""
        
        # Validate phone format
        valid_phone, phone_msg = self._validate_phone_only(customer_in.phone_number)
        if not valid_phone:
            raise InvalidPhoneNumberError(customer_in.phone_number)
        
        # Validate identification if provided
        if customer_in.identification:
            valid_id, id_msg = self._validate_identification_only(customer_in.identification)
            if not valid_id:
                raise InvalidIdentificationError(customer_in.identification)
        
        # Check duplicate phone
        normalized_phone = self._normalize_phone(customer_in.phone_number)
        existing = self.db.query(Customer).filter(
            Customer.business_id == business_id,
            Customer.phone_number == normalized_phone,
            Customer.is_active == True
        ).first()
        
        if existing:
            raise DuplicateResourceError(
                "Customer",
                f"phone {customer_in.phone_number}"
            )
        
        # Check duplicate identification
        if customer_in.identification:
            existing_id = self.db.query(Customer).filter(
                Customer.business_id == business_id,
                Customer.identification == customer_in.identification,
                Customer.is_active == True
            ).first()
            
            if existing_id:
                raise DuplicateResourceError(
                    "Customer",
                    f"identification {customer_in.identification}"
                )
        
        # Validate email format
        if customer_in.email and not self._validate_email(customer_in.email):
            raise ValidationError("Invalid email format", field="email")
    
    @staticmethod
    def _normalize_phone(phone: str) -> str:
        """Normalize phone number to international format"""
        # Remove spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Remove leading '+' if present
        if cleaned.startswith('+'):
            cleaned = cleaned[1:]
        
        # Ecuador country code is 593
        if cleaned.startswith('593') and len(cleaned) == 12:
            return f"+{cleaned}"
        
        # Local format starting with 0
        if cleaned.startswith('0') and len(cleaned) == 10:
            return f"+593{cleaned[1:]}"
        
        # 9-digit cellphone
        if len(cleaned) == 9 and cleaned.startswith('9'):
            return f"+593{cleaned}"
        
        # 10-digit including 0
        if len(cleaned) == 10:
            return f"+593{cleaned[1:]}"
        
        return f"+{cleaned}" if cleaned else cleaned
    
    @staticmethod
    def _validate_phone_only(phone: str) -> tuple[bool, str]:
        """Validate phone number format"""
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Patterns for Ecuadorian phone numbers
        patterns = [
            r'^\+593[0-9]{9}$',      # International: +593991234567
            r'^0[0-9]{9}$',           # National with 0: 0991234567
            r'^[0-9]{9}$',            # Local 9 digits: 991234567
            r'^[0-9]{10}$',           # Local 10 digits: 0991234567
        ]
        
        for pattern in patterns:
            if re.match(pattern, cleaned):
                return True, "Valid phone number"
        
        return False, "Invalid phone number format"
    
    @staticmethod
    def _validate_identification_only(identification: str) -> tuple[bool, str]:
        """Validate Ecuadorian identification (cedula or RUC)"""
        cleaned = re.sub(r'[^0-9]', '', identification)
        
        # Cedula: 10 digits
        if len(cleaned) == 10:
            return CustomerService._validate_cedula(cleaned)
        
        # RUC: 13 digits
        elif len(cleaned) == 13:
            return CustomerService._validate_ruc(cleaned)
        
        else:
            return False, "Identification must be 10 (cedula) or 13 (RUC) digits"
    
    @staticmethod
    def _validate_cedula(cedula: str) -> tuple[bool, str]:
        """Validate Ecuadorian cedula with modulo 10 algorithm"""
        # Check province (first 2 digits 01-24)
        province = int(cedula[:2])
        if province < 1 or province > 24:
            return False, "Invalid province code"
        
        # Third digit must be < 6
        if int(cedula[2]) > 5:
            return False, "Invalid third digit"
        
        # Modulo 10 algorithm
        coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
        total = 0
        
        for i in range(9):
            value = int(cedula[i]) * coefficients[i]
            if value > 9:
                value -= 9
            total += value
        
        check_digit = int(cedula[9])
        remainder = total % 10
        expected = 0 if remainder == 0 else 10 - remainder
        
        if expected == check_digit:
            return True, "Valid cedula"
        else:
            return False, "Invalid verification digit"
    
    @staticmethod
    def _validate_ruc(ruc: str) -> tuple[bool, str]:
        """Validate Ecuadorian RUC"""
        # Check last 3 digits
        if ruc[-3:] not in ["001", "002", "003"]:
            return False, "RUC must end with 001, 002, or 003"
        
        # Validate first 10 digits as cedula
        cedula_valid, msg = CustomerService._validate_cedula(ruc[:10])
        if not cedula_valid:
            return False, f"Invalid cedula in RUC: {msg}"
        
        return True, "Valid RUC"
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))