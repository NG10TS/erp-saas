"""
Cart service aligned with the current Cart and CartItem models.
"""
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartService:
    """Service for shopping cart operations."""

    ACTIVE_STATUS = "ACTIVE"
    CONVERTED_STATUS = "CONVERTED"
    CANCELLED_STATUS = "CANCELLED"

    def __init__(self, db: Session):
        self.db = db

    def get_active_cart(self, customer_id: UUID, business_id: UUID) -> Optional[Cart]:
        """Get the active cart for a customer in a business."""
        return (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(
                Cart.customer_id == customer_id,
                Cart.business_id == business_id,
                Cart.status == self.ACTIVE_STATUS,
            )
            .first()
        )

    def get_or_create_active_cart(self, customer_id: UUID, business_id: UUID) -> Cart:
        """Get an existing cart or create a new active cart."""
        cart = self.get_active_cart(customer_id=customer_id, business_id=business_id)

        if cart:
            return cart

        cart = Cart(
            customer_id=customer_id,
            business_id=business_id,
            status=self.ACTIVE_STATUS,
        )
        self.db.add(cart)
        self.db.commit()
        self.db.refresh(cart)
        return self.get_active_cart(customer_id=customer_id, business_id=business_id) or cart

    def add_item(self, cart_id: UUID, product_id: UUID, quantity: int = 1) -> Optional[CartItem]:
        """Add or increase an item in the cart."""
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None

        existing_item = (
            self.db.query(CartItem)
            .filter(
                CartItem.cart_id == cart_id,
                CartItem.product_id == product_id,
            )
            .first()
        )

        unit_price = Decimal(str(product.precio_venta))

        if existing_item:
            existing_item.quantity += quantity
            existing_item.total_price = unit_price * existing_item.quantity
            self.db.commit()
            self.db.refresh(existing_item)
            return existing_item

        cart_item = CartItem(
            cart_id=cart_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=unit_price * quantity,
        )
        self.db.add(cart_item)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item

    def clear_cart(self, cart_id: UUID) -> bool:
        """Remove all items from a cart."""
        self.db.query(CartItem).filter(CartItem.cart_id == cart_id).delete()
        self.db.commit()
        return True

    def cancel_active_cart(self, customer_id: UUID, business_id: UUID) -> Optional[Cart]:
        """Cancel the current active cart for a customer."""
        cart = self.get_active_cart(customer_id=customer_id, business_id=business_id)
        if not cart:
            return None

        self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.status = self.CANCELLED_STATUS
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def convert_cart_to_sale(self, cart_id: UUID) -> Optional[Cart]:
        """Mark a cart as converted once a sale is created."""
        cart = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            return None

        cart.status = self.CONVERTED_STATUS
        self.db.commit()
        self.db.refresh(cart)
        return cart
