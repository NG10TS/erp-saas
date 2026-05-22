# app/services/whatsapp/conversation_flow.py
"""
Motor conversacional de pedidos por WhatsApp con carrito persistido.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.constants.roles import UserRole
from app.models.business import Business
from app.models.cart import Cart
from app.models.customer import Customer
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.services.cart_service import CartService
from app.services.sale_service import SaleService
from app.services.whatsapp.message_parser import WhatsAppMessageParser
from app.services.whatsapp.whatsapp_client import WhatsAppClient
from app.core.logging import logger

SESSION_TIMEOUT_MINUTES = 30


class ConversationSession:
    """Estado ligero de una conversación activa."""

    def __init__(self) -> None:
        self.state = "IDLE"
        self.last_activity = datetime.utcnow()

    def is_expired(self) -> bool:
        return datetime.utcnow() - self.last_activity > timedelta(minutes=SESSION_TIMEOUT_MINUTES)

    def touch(self) -> None:
        self.last_activity = datetime.utcnow()


_sessions: Dict[str, ConversationSession] = {}


def _get_session(business_id: str, phone: str) -> ConversationSession:
    key = f"{business_id}:{phone}"
    session = _sessions.get(key)
    if session is None or session.is_expired():
        session = ConversationSession()
        _sessions[key] = session
    session.touch()
    return session


def _clear_session(business_id: str, phone: str) -> None:
    _sessions.pop(f"{business_id}:{phone}", None)


class ConversationFlow:
    """Maneja el flujo de pedidos conversacionales por WhatsApp."""

    def __init__(self, db: Session, business: Business, client: WhatsAppClient):
        self.db = db
        self.business = business
        self.client = client
        self.product_repo = ProductRepository(db)
        self.sale_service = SaleService(db)
        self.cart_service = CartService(db)
        self.parser = WhatsAppMessageParser()

    async def handle_message(
        self,
        phone: str,
        text: str,
        customer: Optional[Customer],
    ) -> None:
        """Procesa un mensaje entrante y responde según el flujo actual."""
        session = _get_session(str(self.business.id), phone)
        intent, data = self.parser.extract_intent(text)
        active_cart = self._get_active_cart(customer)

        if intent == "show_menu":
            session.state = "IDLE"
            await self._send_welcome(phone)
            return

        if intent == "cancel_order":
            if customer:
                self.cart_service.cancel_active_cart(customer.id, self.business.id)
            _clear_session(str(self.business.id), phone)
            await self._send(phone, "❌ Pedido cancelado. Escribe *hola* para comenzar de nuevo.")
            return

        if intent == "view_cart":
            await self._send_cart_summary(phone, active_cart)
            return

        if intent == "add_items" and data:
            if not customer:
                await self._send(
                    phone,
                    "No pude asociar tu número a un cliente. Intenta nuevamente en unos segundos.",
                )
                return

            active_cart = self.cart_service.get_or_create_active_cart(
                customer_id=customer.id,
                business_id=self.business.id,
            )

            items = data.get("items", [])
            matched = self._match_products(items)
            added, not_found, out_of_stock = [], [], []

            for item in matched:
                if not item.get("found", True) or not item.get("product_id"):
                    not_found.append(item["requested_name"])
                    continue

                if not item.get("available", True):
                    out_of_stock.append(item["product_name"])
                    continue

                self.cart_service.add_item(
                    cart_id=active_cart.id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                )
                added.append(f"{item['quantity']}x {item['product_name']}")

            refreshed_cart = self._get_active_cart(customer)
            session.state = "ORDERING"

            response_lines = []
            if added:
                response_lines.append("✅ Agregado:\n" + "\n".join(f"• {value}" for value in added))
            if not_found:
                response_lines.append("❓ No encontré:\n" + "\n".join(f"• {value}" for value in not_found))
            if out_of_stock:
                response_lines.append("😔 Sin stock:\n" + "\n".join(f"• {value}" for value in out_of_stock))

            if response_lines:
                await self._send(phone, "\n\n".join(response_lines))

            await self._send_cart_summary(
                phone,
                refreshed_cart,
                footer="Puedes agregar más productos o escribir *confirmar* para revisar tu pedido.",
            )
            return

        if intent == "confirm_order":
            if session.state == "CONFIRMING":
                await self._complete_checkout(phone=phone, customer=customer, cart=active_cart)
                return

            if not active_cart or not active_cart.items:
                await self._send(phone, "Tu carrito está vacío. Dime qué productos deseas.")
                return

            session.state = "CONFIRMING"
            await self._send_cart_summary(
                phone,
                active_cart,
                footer="¿Confirmas este pedido? Responde *sí* para crearlo o *no* para cancelarlo.",
            )
            return

        if intent == "checkout":
            if not active_cart or not active_cart.items:
                await self._send(phone, "Tu carrito está vacío. Agrega productos antes de pagar o facturar.")
                return

            session.state = "CONFIRMING"
            await self._send_cart_summary(
                phone,
                active_cart,
                footer="Estoy listo para generar tu pedido. Responde *sí* para continuar.",
            )
            return

        await self._send_welcome(phone)

    def _get_active_cart(self, customer: Optional[Customer]) -> Optional[Cart]:
        """Get active cart for the current customer."""
        if not customer:
            return None

        return self.cart_service.get_active_cart(
            customer_id=customer.id,
            business_id=self.business.id,
        )

    async def _complete_checkout(
        self,
        phone: str,
        customer: Optional[Customer],
        cart: Optional[Cart],
    ) -> None:
        """Create the sale from the current cart and clear the active session."""
        if not customer or not cart or not cart.items:
            await self._send(phone, "No encontré un carrito activo para confirmar.")
            return

        try:
            sale = self._create_sale(customer=customer, cart=cart)
            self.cart_service.convert_cart_to_sale(cart.id)
            _clear_session(str(self.business.id), phone)
            await self._send(
                phone,
                (
                    f"🎉 ¡Pedido #{sale.numero_venta} registrado!\n\n"
                    f"{self._cart_summary(cart)}\n\n"
                    "Te contactaremos pronto para continuar con tu compra."
                ),
            )
        except Exception as exc:
            logger.error(f"Error creating WhatsApp sale: {exc}", exc_info=True)
            await self._send(
                phone,
                "❌ No pude crear tu pedido en este momento. Intenta nuevamente en unos minutos.",
            )

    def _match_products(self, items: list) -> list:
        """Busca productos del negocio y los compara con el mensaje del cliente."""
        catalog = self.product_repo.get_by_business(
            business_id=self.business.id,
            is_active=True,
            limit=500,
        )

        catalog_dicts = [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.precio_venta),
                "stock": p.stock_actual or 0,
            }
            for p in catalog
        ]

        return self.parser.match_products_with_catalog(items, catalog_dicts)

    def _create_sale(self, customer: Customer, cart: Cart):
        """Crea la venta desde el carrito persistido."""
        items_schema = [
            SaleItemCreate(
                product_id=item.product_id,
                cantidad=item.quantity,
                precio_unitario=item.unit_price,
            )
            for item in cart.items
        ]

        owner = (
            self.db.query(User)
            .filter(
                User.business_id == self.business.id,
                User.is_active.is_(True),
                User.role.in_([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]),
            )
            .order_by(User.created_at.asc())
            .first()
        )

        if not owner:
            raise ValueError("No hay un usuario activo disponible para registrar la venta")

        sale_data = SaleCreate(
            customer_id=customer.id,
            items=items_schema,
            notas="Pedido por WhatsApp",
            send_whatsapp=False,
        )

        return self.sale_service.create(
            business_id=self.business.id,
            user_id=owner.id,
            sale_in=sale_data,
        )

    def _cart_summary(self, cart: Optional[Cart]) -> str:
        """Formatea el carrito activo para WhatsApp."""
        if not cart or not cart.items:
            return "Tu carrito está vacío 🛒"

        lines = ["🛒 *Tu pedido:*"]
        total = Decimal("0")

        for item in cart.items:
            product_name = item.product.name if item.product else "Producto"
            item_total = Decimal(str(item.total_price))
            total += item_total
            lines.append(
                f"• {item.quantity}x {product_name} — ${item_total:.2f}"
            )

        lines.append(f"\n💰 *Total: ${total:.2f}*")
        return "\n".join(lines)

    async def _send_cart_summary(
        self,
        phone: str,
        cart: Optional[Cart],
        footer: Optional[str] = None,
    ) -> None:
        """Envía el resumen del carrito con un mensaje opcional adicional."""
        message = self._cart_summary(cart)
        if footer:
            message = f"{message}\n\n{footer}"
        await self._send(phone, message)

    async def _send(self, to: str, text: str) -> None:
        """Envía un mensaje de texto."""
        try:
            await self.client.send_text_message(to=to, text=text)
        except Exception as exc:
            logger.error(f"Error sending WhatsApp message to {to}: {exc}", exc_info=True)

    async def _send_welcome(self, to: str) -> None:
        """Envía el mensaje inicial del flujo de compra."""
        name = self.business.commercial_name or self.business.business_name
        msg = (
            f"👋 ¡Hola! Bienvenido a *{name}*\n\n"
            "Puedes escribirme productos como:\n"
            "• 2 camisas rojas y 1 pantalon azul\n"
            "• quiero 3 camisetas negras\n\n"
            "*Comandos:*\n"
            "• *ver carrito* para revisar tu pedido\n"
            "• *confirmar* para validarlo\n"
            "• *cancelar* para empezar de nuevo\n"
        )
        await self._send(to, msg)
