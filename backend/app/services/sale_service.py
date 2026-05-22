"""
Sale service — campo en español + actualización de estadísticas del cliente
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.constants.roles import UserRole
from app.models.customer import Customer
from app.models.user import User
from app.models.sale import Sale, SaleItem, SaleStatus, PaymentStatus, PaymentMethod
from app.models.product import Product
from app.models.business import Business
from app.schemas.sale import SaleCreate, SaleUpdate, SaleStatusUpdate
from app.repositories.sale_repository import SaleRepository
from app.repositories.product_repository import ProductRepository
from app.services.customer_service import CustomerService
from app.core.logging import logger
from app.core.logging import audit_logger


# ============================================
# FUNCIÓN HELPER PARA CONVERSIÓN SEGURA A DECIMAL
# ============================================

def to_decimal(value: Any, default: Decimal = Decimal('0')) -> Decimal:
    """
    Convierte cualquier valor a Decimal de forma segura.
    
    Args:
        value: Valor a convertir (puede ser int, float, str, Decimal, None)
        default: Valor por defecto si la conversión falla
    
    Returns:
        Decimal: Valor convertido o default
    """
    if value is None:
        return default
    if isinstance(value, Decimal):
        return value
    if isinstance(value, float):
        # Convertir float a string primero para evitar problemas de precisión
        return Decimal(str(value))
    if isinstance(value, int):
        return Decimal(value)
    if isinstance(value, str):
        try:
            return Decimal(value)
        except:
            return default
    return default


class SaleService:
    """Service for sale operations with inventory + customer stats integration"""

    def __init__(self, db: Session):
        self.db = db
        self.repo = SaleRepository(db)
        self.product_repo = ProductRepository(db)
        self.customer_service = CustomerService(db)

    # ============================================
    # QUERIES
    # ============================================

    def get(self, sale_id: UUID) -> Optional[Sale]:
        """Get sale by ID with items"""
        return self.repo.get_with_items(sale_id)

    def get_by_business(
        self,
        business_id: UUID,
        current_user: Optional[User] = None,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SaleStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        customer_id: Optional[UUID] = None,
        search: Optional[str] = None,
    ) -> List[Sale]:
        """Get sales by business with filters"""
        created_by = None
        if current_user and current_user.role == UserRole.SELLER:
            created_by = current_user.id

        return self.repo.get_by_business(
            business_id=business_id,
            created_by=created_by,
            skip=skip,
            limit=limit,
            status=status,
            from_date=from_date,
            to_date=to_date,
            customer_id=customer_id,
            search=search,
        )

    def get_recent_activity(self, business_id: UUID, limit: int = 10) -> List[Sale]:
        """Get recent sales activity for dashboard"""
        return (
            self.db.query(Sale)
            .filter(Sale.business_id == business_id)
            .order_by(Sale.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_recent_activity_for_user(
        self,
        business_id: UUID,
        current_user: Optional[User] = None,
        limit: int = 10,
    ) -> List[Sale]:
        """Get recent sales activity respecting seller visibility."""
        query = self.db.query(Sale).filter(Sale.business_id == business_id)
        if current_user and current_user.role == UserRole.SELLER:
            query = query.filter(Sale.created_by == current_user.id)

        return query.order_by(Sale.created_at.desc()).limit(limit).all()

    def get_daily_summary(
        self,
        business_id: UUID,
        date: Optional[datetime] = None,
        current_user: Optional[User] = None,
    ) -> Dict[str, Any]:
        """Get daily sales summary"""
        return self.repo.get_daily_summary(
            business_id=business_id,
            date=date,
            created_by=current_user.id if current_user and current_user.role == UserRole.SELLER else None,
        )

    def get_monthly_summary(
        self,
        business_id: UUID,
        year: int,
        month: int,
        current_user: Optional[User] = None,
    ) -> Dict[str, Any]:
        """Get monthly sales summary"""
        from sqlalchemy import func, extract
        
        query = self.db.query(
            func.count(Sale.id).label("total_sales"),
            func.sum(Sale.total).label("total_revenue"),
        ).filter(
            Sale.business_id == business_id,
            Sale.estado == SaleStatus.COMPLETED,
            extract("year", Sale.fecha_venta) == year,
            extract("month", Sale.fecha_venta) == month,
        )

        if current_user and current_user.role == UserRole.SELLER:
            query = query.filter(Sale.created_by == current_user.id)

        result = query.first()
        
        return {
            "total_sales": result.total_sales or 0,
            "total_revenue": float(result.total_revenue or 0),
            "year": year,
            "month": month,
        }

    def get_pending_invoices(self, business_id: UUID) -> List[Sale]:
        """Get sales pending invoice generation"""
        return self.repo.get_pending_invoices(business_id)

    # ============================================
    # CREATE SALE - ✅ CORREGIDO (solo reserva stock)
    # ============================================
    
    def create(self, business_id: UUID, user_id: UUID, sale_in: SaleCreate) -> Sale:
        """
        Create a new sale.
        
        ✅ CORREGIDO: SOLO reserva stock, NO descuenta.
        El descuento real ocurre cuando la venta se COMPLETA.
        """
        try:
            # ── Validate customer ─────────────────────────────────────────────
            customer = None
            if sale_in.customer_id:
                customer = self.db.query(Customer).filter(
                    Customer.id == sale_in.customer_id,
                    Customer.business_id == business_id,
                ).first()
                if not customer:
                    raise ValueError(f"Cliente {sale_in.customer_id} no encontrado")

            # ── Generate sale number ─────────────────────────────────────────
            numero_venta = self.generate_sale_number(business_id)

            # ── Create sale header ───────────────────────────────────────────
            sale = Sale(
                business_id=business_id,
                customer_id=sale_in.customer_id,
                created_by=user_id,
                numero_venta=numero_venta,
                metodo_pago=sale_in.metodo_pago,
                notas=sale_in.notas,
                notas_internas=getattr(sale_in, "notas_internas", None),
                descuento=to_decimal(sale_in.descuento),
                tipo_descuento=getattr(sale_in, "tipo_descuento", None),
                tipo_comprobante=getattr(sale_in, "tipo_comprobante", "CONSUMIDOR_FINAL"),
                customer_email=getattr(sale_in, "customer_email", None),
                estado=SaleStatus.PENDING,
                estado_pago=PaymentStatus.PENDING,
                subtotal=Decimal('0'),
                iva=Decimal('0'),
                ice=Decimal('0'),
                total=Decimal('0'),
            )
            self.db.add(sale)
            self.db.flush()

            # ── Process items and calculate totals ───────────────────────────
            subtotal_acc = Decimal('0')
            iva_acc = Decimal('0')
            ice_acc = Decimal('0')

            for item_in in sale_in.items:
                # ✅ CON LOCK para evitar concurrencia
                product = self.db.query(Product).filter(
                    Product.id == item_in.product_id,
                    Product.business_id == business_id,
                    Product.is_active == True,
                ).with_for_update().first()

                if not product:
                    raise ValueError(f"Producto {item_in.product_id} no encontrado")

                # Validate stock
                cantidad = item_in.cantidad
                if product.control_stock and not product.es_servicio:
                    if product.stock_actual < cantidad:
                        raise ValueError(
                            f"Stock insuficiente para {product.name}. "
                            f"Disponible: {product.stock_actual}, Solicitado: {cantidad}"
                        )

                # RESERVAR stock (NO descontar)
                if hasattr(product, 'stock_reservado'):
                    product.stock_reservado += cantidad

                # Calculate item totals
                precio_unitario = to_decimal(item_in.precio_unitario or product.precio_venta)
                descuento_item = to_decimal(item_in.descuento)
                
                item_subtotal = (precio_unitario * Decimal(str(cantidad))) - descuento_item
                
                iva_porcentaje = to_decimal(product.impuesto_iva)
                iva_monto = item_subtotal * (iva_porcentaje / Decimal('100'))
                
                ice_monto = Decimal('0')
                if product.tiene_ice and product.porcentaje_ice:
                    ice_porcentaje = to_decimal(product.porcentaje_ice)
                    ice_monto = item_subtotal * (ice_porcentaje / Decimal('100'))

                # Create sale item
                sale_item = SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    nombre_producto=product.name,
                    sku_producto=product.sku,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    descuento=descuento_item,
                    subtotal=item_subtotal,
                    iva_porcentaje=iva_porcentaje,
                    iva_monto=iva_monto,
                    ice_porcentaje=to_decimal(product.porcentaje_ice or 0),
                    ice_monto=ice_monto,
                )
                self.db.add(sale_item)

                # Accumulate totals
                subtotal_acc += item_subtotal
                iva_acc += iva_monto
                ice_acc += ice_monto

            # ── Update sale totals ───────────────────────────────────────────
            descuento_venta = to_decimal(sale_in.descuento)
            
            sale.subtotal = subtotal_acc
            sale.descuento = descuento_venta
            sale.iva = iva_acc
            sale.ice = ice_acc
            # Calcular total y asegurar que no sea negativo
            total_calculado = subtotal_acc + iva_acc + ice_acc - descuento_venta
            sale.total = max(Decimal('0'), total_calculado)

            self.db.commit()
            self.db.refresh(sale)

            # ── Update customer statistics ────────────────────────────────────
            if customer:
                try:
                    self.customer_service.update_stats(
                        customer_id=customer.id,
                        sale_amount=float(sale.total),
                    )
                except Exception as stats_err:
                    logger.warning(f"No se pudo actualizar estadísticas del cliente {customer.id}: {stats_err}")

            # ✅ Auditoría de creación
            audit_logger.log(
                user_id=str(user_id),
                action="SALE_CREATED",
                resource="sale",
                resource_id=str(sale.id),
                details={
                    "sale_number": sale.numero_venta,
                    "total": float(sale.total),
                    "items_count": len(sale_in.items)
                }
            )

            logger.info(f"Venta creada (stock reservado): {sale.numero_venta} - Total: ${sale.total}")
            return sale

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al crear venta: {e}", exc_info=True)
            raise

    # ============================================
    # UPDATE STATUS - ✅ CORREGIDO (consumir stock al completar)
    # ============================================
    
    def update_status(self, sale_id: UUID, status_update: SaleStatusUpdate) -> Sale:
        """
        Transition sale status.
        
        ✅ CORREGIDO:
        - COMPLETED → Consume reserved stock (descuenta UNA VEZ)
        - CANCELLED → Releases reserved stock
        """
        sale = self.repo.get_with_items(sale_id)
        if not sale:
            raise ValueError("Venta no encontrada")

        if not sale.can_transition_to(status_update.estado):
            raise ValueError(
                f"No se puede pasar de {sale.estado} a {status_update.estado}"
            )

        old_status = sale.estado
        new_status = status_update.estado

        # Handle CONFIRMED status
        if new_status == SaleStatus.CONFIRMED:
            sale.confirmado_en = datetime.utcnow()

        # COMPLETED: Consumir stock reservado (UNICA VEZ)
        elif new_status == SaleStatus.COMPLETED:
            for item in sale.items:
                if item.product and item.product.control_stock and not item.product.es_servicio:
                    # CON LOCK para evitar concurrencia
                    product = self.db.query(Product).filter(
                        Product.id == item.product_id
                    ).with_for_update().first()
                    
                    if not product:
                        raise ValueError(f"Producto {item.nombre_producto} no encontrado")
                    
                    # Verificar que hay suficiente stock disponible
                    if product.stock_actual < item.cantidad:
                        raise ValueError(
                            f"Stock insuficiente para {item.nombre_producto}. "
                            f"Disponible: {product.stock_actual}, Necesario: {item.cantidad}"
                        )
                    
                    # DESCONTAR stock (SOLO AQUÍ)
                    product.stock_actual -= item.cantidad
                    
                    # Limpiar stock reservado
                    if hasattr(product, 'stock_reservado'):
                        product.stock_reservado -= item.cantidad

            sale.completado_en = datetime.utcnow()
            sale.estado_pago = PaymentStatus.PAID
            sale.fecha_pago = datetime.utcnow()

        # CANCELLED: Liberar stock reservado
        elif new_status == SaleStatus.CANCELLED:
            for item in sale.items:
                if item.product and item.product.control_stock and not item.product.es_servicio:
                    product = self.db.query(Product).filter(
                        Product.id == item.product_id
                    ).with_for_update().first()
                    
                    if product and hasattr(product, 'stock_reservado'):
                        product.stock_reservado -= item.cantidad
                        if product.stock_reservado < 0:
                            product.stock_reservado = 0
                            
            sale.cancelado_en = datetime.utcnow()
            sale.motivo_cancelacion = status_update.motivo_cancelacion

        sale.estado = new_status
        self.db.commit()
        self.db.refresh(sale)

        # ✅ Auditoría de cambio de estado
        audit_logger.log(
            user_id=str(sale.created_by),
            action=f"SALE_{new_status.value.upper()}",
            resource="sale",
            resource_id=str(sale.id),
            details={
                "old_status": old_status.value,
                "new_status": new_status.value,
                "sale_number": sale.numero_venta,
                "total": float(sale.total)
            }
        )

        # Update customer stats when sale completes
        if new_status == SaleStatus.COMPLETED and sale.customer_id:
            try:
                self.customer_service.update_stats(
                    customer_id=sale.customer_id,
                    sale_amount=float(sale.total),
                )
            except Exception as stats_err:
                logger.warning(f"No se pudo actualizar estadísticas del cliente: {stats_err}")

        logger.info(f"Venta {sale.numero_venta}: {old_status} → {new_status}")
        return sale


    def cancel(self, sale_id: UUID, motivo: str) -> Sale:
        """Cancel a sale"""
        return self.update_status(
            sale_id,
            SaleStatusUpdate(estado=SaleStatus.CANCELLED, motivo_cancelacion=motivo),
        )

    # ============================================
    # SALE NUMBER GENERATION
    # ============================================

    def generate_sale_number(self, business_id: UUID) -> str:
        """
        Generate unique sale number.
        Format: PREFIX-YYYYMMDD-NNNN
        Example: ERP-20260420-0001
        """
        business = self.db.query(Business).filter(Business.id == business_id).first()

        # Generate prefix from business name
        if business and business.business_name:
            words = business.business_name.split()
            prefix = "".join(w[0] for w in words[:2]).upper()
            prefix = prefix[:3].ljust(3, "X")
        else:
            prefix = "ERP"

        # Date part
        today_str = datetime.now().strftime("%Y%m%d")
        
        # Sequential number
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        count = (
            self.db.query(Sale)
            .filter(
                Sale.business_id == business_id,
                Sale.created_at >= start_of_day
            )
            .count()
        )
        
        sequential = str(count + 1).zfill(4)
        
        return f"{prefix}-{today_str}-{sequential}"