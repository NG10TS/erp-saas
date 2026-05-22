#!/usr/bin/env python3
"""
Seed database with initial data for development
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import security_service
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.constants.roles import UserRole
import uuid
from datetime import datetime


def seed_database():
    """Seed database with initial data"""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding database...")
        
        # Create test business
        business = Business(
            id=uuid.uuid4(),
            ruc="1234567890001",
            business_name="Test Business",
            commercial_name="Test Shop",
            email="test@business.com",
            phone="0999999999",
            address="Av. Test 123",
            sri_environment="1",
            sri_emisor_type="01",
            is_active=True,
            is_verified=True,
            subscription_plan="pro",
            max_products=1000,
            max_invoices_monthly=1000,
            settings={
                "language": "es",
                "timezone": "America/Guayaquil",
                "currency": "USD",
                "notify_low_stock": True
            }
        )
        db.add(business)
        db.flush()
        print(f"✅ Created business: {business.business_name}")
        
        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            business_id=business.id,
            email="admin@example.com",
            username="admin",
            password_hash=security_service.get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            phone="0999999998",
            role=UserRole.OWNER,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        print(f"✅ Created admin user: {admin.email}")
        
        # Create test products
        categories = ["Comida", "Bebidas", "Electrónica", "Ropa"]
        products_data = [
            {"name": "Hamburguesa", "price": 5.99, "category": "Comida", "stock": 50},
            {"name": "Pizza Familiar", "price": 12.99, "category": "Comida", "stock": 30},
            {"name": "Coca Cola 1L", "price": 1.50, "category": "Bebidas", "stock": 100},
            {"name": "Agua Sin Gas", "price": 0.80, "category": "Bebidas", "stock": 200},
            {"name": "Cargador USB", "price": 8.99, "category": "Electrónica", "stock": 25},
            {"name": "Audífonos", "price": 15.99, "category": "Electrónica", "stock": 15},
            {"name": "Camiseta", "price": 12.99, "category": "Ropa", "stock": 40},
            {"name": "Pantalón", "price": 25.99, "category": "Ropa", "stock": 20},
        ]
        
        for i, p_data in enumerate(products_data, 1):
            product = Product(
                id=uuid.uuid4(),
                business_id=business.id,
                name=p_data["name"],
                sku=f"SKU{i:03d}",
                price=p_data["price"],
                stock_quantity=p_data["stock"],
                category=p_data["category"],
                iva_percentage=15.0,
                is_active=True
            )
            db.add(product)
        
        print(f"✅ Created {len(products_data)} products")
        
        db.commit()
        print("\n🎉 Database seeded successfully!")
        print("\nTest credentials:")
        print(f"  Email: admin@example.com")
        print(f"  Password: admin123")
        print(f"  Business RUC: {business.ruc}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()