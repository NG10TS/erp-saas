from typing import Dict, List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.sale import Sale, SaleItem, SaleStatus
from app.models.product import Product
from app.models.cart import Cart, CartItem  # Si no existe, créalo similar a SaleItem

class OrderBuilder:
    """
    Construye un carrito de compras temporal para WhatsApp.
    """
    
    def __init__(self, db: Session, customer_id: int, business_id: int):
        self.db = db
        self.customer_id = customer_id
        self.business_id = business_id
        self.cart = self._get_or_create_cart()
    
    def _get_or_create_cart(self) -> Cart:
        # Buscar carrito activo
        cart = self.db.query(Cart).filter(
            Cart.customer_id == self.customer_id,
            Cart.status == "ACTIVE"
        ).first()
        if not cart:
            cart = Cart(
                business_id=self.business_id,
                customer_id=self.customer_id,
                status="ACTIVE"
            )
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
        return cart
    
    def add_item(self, product_id: int, quantity: int) -> Optional[CartItem]:
        product = self.db.query(Product).filter(
            Product.id == product_id,
            Product.business_id == self.business_id,
            Product.is_active == True
        ).first()
        if not product:
            return None
            
        # Verificar stock disponible
        if product.stock_current < quantity:
            return None  # Podríamos lanzar excepción o manejar
            
        # Buscar si ya existe el item
        existing = self.db.query(CartItem).filter(
            CartItem.cart_id == self.cart.id,
            CartItem.product_id == product_id
        ).first()
        
        if existing:
            existing.quantity += quantity
            existing.total_price = existing.quantity * product.sale_price
        else:
            existing = CartItem(
                cart_id=self.cart.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=product.sale_price,
                tax_rate=Decimal("0.12"),  # IVA 12%
                total_price=quantity * product.sale_price
            )
            self.db.add(existing)
            
        self.db.commit()
        self.db.refresh(existing)
        return existing
    
    def get_cart_summary(self) -> str:
        items = self.db.query(CartItem).filter(CartItem.cart_id == self.cart.id).all()
        if not items:
            return "Carrito vacío"
        lines = []
        total = Decimal("0.00")
        for item in items:
            lines.append(f"• {item.product.name} x{item.quantity} = ${item.total_price:.2f}")
            total += item.total_price
        lines.append(f"---\nTotal: ${total:.2f}")
        return "\n".join(lines)
    
    def get_cart_total(self) -> Decimal:
        items = self.db.query(CartItem).filter(CartItem.cart_id == self.cart.id).all()
        return sum((item.total_price for item in items), Decimal("0.00"))
    
    def create_sale(self) -> Optional[Sale]:
        """
        Convierte el carrito en una venta real, descuenta inventario y limpia el carrito.
        """
        cart_items = self.db.query(CartItem).filter(CartItem.cart_id == self.cart.id).all()
        if not cart_items:
            return None
            
        # Crear venta
        subtotal = sum((item.total_price for item in cart_items), Decimal("0.00"))
        tax_total = subtotal * Decimal("0.12")
        total = subtotal + tax_total
        
        sale = Sale(
            business_id=self.business_id,
            customer_id=self.customer_id,
            status=SaleStatus.COMPLETED,
            subtotal=subtotal,
            tax_amount=tax_total,
            discount_amount=Decimal("0.00"),
            total_amount=total,
            payment_method="WHATSAPP",  # O un enum
            created_at=datetime.utcnow()
        )
        self.db.add(sale)
        self.db.flush()
        
        # Crear SaleItems y descontar inventario
        for cart_item in cart_items:
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price,
                tax_rate=cart_item.tax_rate,
                discount_amount=Decimal("0.00"),
                total_price=cart_item.total_price,
                tax_amount=cart_item.total_price * cart_item.tax_rate
            )
            self.db.add(sale_item)
            
            # Descontar stock
            product = cart_item.product
            product.stock_current -= cart_item.quantity
            self.db.add(product)
            
        # Marcar carrito como completado
        self.cart.status = "CONVERTED"
        self.db.add(self.cart)
        
        self.db.commit()
        self.db.refresh(sale)
        
        # Disparar facturación electrónica (en tarea asíncrona)
        # Aquí se podría llamar a Celery
        
        return sale
    
    def clear_cart(self):
        self.cart.status = "CANCELLED"
        self.db.commit()
        # Opcional: eliminar items
        self.db.query(CartItem).filter(CartItem.cart_id == self.cart.id).delete()
        self.db.commit()