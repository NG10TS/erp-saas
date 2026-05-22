#!/usr/bin/env python3
"""
Generate test data for development
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.constants.sales import SaleStatus, PaymentMethod
from app.services.sale_service import SaleService


def random_date(start: datetime, end: datetime) -> datetime:
    """Generate random datetime between start and end"""
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def generate_test_data():
    """Generate test sales data"""
    db = SessionLocal()
    
    try:
        print("📊 Generating test data...")
        
        # Get first business
        business = db.query(Business).first()
        if not business:
            print("❌ No business found. Run seed_data.py first.")
            return
        
        # Get products
        products = db.query(Product).filter(
            Product.business_id == business.id
        ).all()
        
        if not products:
            print("❌ No products found. Run seed_data.py first.")
            return
        
        # Create customers
        customers = []
        for i in range(20):
            customer = Customer(
                business_id=business.id,
                phone_number=f"+59399{random.randint(1000000, 9999999)}",
                name=f"Cliente {i+1}",
                email=f"cliente{i+1}@test.com",
                is_active=True,
                whatsapp_opted_in=random.choice([True, False])
            )
            db.add(customer)
            customers.append(customer)
        
        db.flush()
        print(f"✅ Created {len(customers)} customers")
        
        # Create sales for last 30 days
        sale_service = SaleService(db)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        sales_created = 0
        
        for _ in range(100):  # Create 100 sales
            # Random date
            sale_date = random_date(start_date, end_date)
            
            # Random customer
            customer = random.choice(customers)
            
            # Random items (1-5 items)
            num_items = random.randint(1, 5)
            selected_products = random.sample(products, min(num_items, len(products)))
            
            items = []
            for product in selected_products:
                quantity = random.randint(1, 5)
                items.append({
                    "product_id": product.id,
                    "quantity": quantity,
                    "unit_price": product.price
                })
            
            # Calculate total
            total = sum(item["quantity"] * item["unit_price"] for item in items)
            
            # Create sale
            sale = Sale(
                business_id=business.id,
                customer_id=customer.id,
                sale_number=sale_service.generate_sale_number(business.id),
                sale_date=sale_date,
                status=random.choice([
                    SaleStatus.COMPLETED,
                    SaleStatus.COMPLETED,
                    SaleStatus.COMPLETED,
                    SaleStatus.CANCELLED
                ]),
                payment_method=random.choice(list(PaymentMethod)),
                subtotal=total,
                iva=total * 0.15,
                total=total * 1.15,
                created_at=sale_date
            )
            
            db.add(sale)
            db.flush()
            
            # Add items
            for item_data in items:
                product = db.query(Product).get(item_data["product_id"])
                item = SaleItem(
                    sale_id=sale.id,
                    product_id=item_data["product_id"],
                    product_name=product.name,
                    product_sku=product.sku,
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    subtotal=item_data["quantity"] * item_data["unit_price"],
                    iva_percentage=15.0,
                    iva_amount=item_data["quantity"] * item_data["unit_price"] * 0.15
                )
                db.add(item)
            
            sales_created += 1
        
        db.commit()
        print(f"✅ Created {sales_created} sales")
        print("\n🎉 Test data generated successfully!")
        
    except Exception as e:
        print(f"❌ Error generating test data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    generate_test_data()