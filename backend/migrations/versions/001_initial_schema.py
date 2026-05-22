"""initial schema + roles, permissions y auditoría

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

NOTA: Esta migración incluye el esquema completo con:
- Tablas principales (businesses, users, products, sales, invoices, etc.)
- Tablas de roles y permisos (user_permissions, role_permissions)
- Tablas de auditoría (business_audit_logs)
- Tablas de WhatsApp (whatsapp_messages, whatsapp_sessions, carts)
- Tablas de soporte (audit_logs, notifications, attachments, failed_jobs)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    # ── businesses ──────────────────────────────────────────────────────────
    op.create_table(
        'businesses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ruc', sa.String(13), nullable=False),
        sa.Column('business_name', sa.String(255), nullable=False),
        sa.Column('commercial_name', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        # SRI
        sa.Column('sri_environment', sa.String(1), server_default='1'),
        sa.Column('sri_emisor_type', sa.String(2), server_default='01'),
        sa.Column('sri_resolution_number', sa.String(50), nullable=True),
        sa.Column('sri_has_digital_certificate', sa.Boolean(), server_default='false'),
        sa.Column('digital_certificate', sa.Text(), nullable=True),
        sa.Column('digital_certificate_password_encrypted', sa.Text(), nullable=True),
        sa.Column('digital_certificate_expires_at', sa.DateTime(), nullable=True),
        # WhatsApp
        sa.Column('whatsapp_business_phone', sa.String(20), nullable=True),
        sa.Column('whatsapp_business_id', sa.String(100), nullable=True),
        sa.Column('whatsapp_access_token_encrypted', sa.Text(), nullable=True),
        sa.Column('whatsapp_webhook_verified', sa.Boolean(), server_default='false'),
        # Subscription
        sa.Column('subscription_plan', sa.String(50), server_default='free'),
        sa.Column('subscription_status', sa.String(20), server_default='active'),
        sa.Column('subscription_start_date', sa.DateTime(), nullable=True),
        sa.Column('subscription_end_date', sa.DateTime(), nullable=True),
        sa.Column('subscription_payment_method', sa.String(50), nullable=True),
        # Limits
        sa.Column('max_users', sa.Integer(), server_default='1'),
        sa.Column('max_products', sa.Integer(), server_default='50'),
        sa.Column('max_invoices_monthly', sa.Integer(), server_default='50'),
        sa.Column('max_storage_mb', sa.Integer(), server_default='100'),
        # Usage
        sa.Column('current_users', sa.Integer(), server_default='0'),
        sa.Column('current_products', sa.Integer(), server_default='0'),
        sa.Column('current_invoices_month', sa.Integer(), server_default='0'),
        sa.Column('current_storage_mb', sa.Integer(), server_default='0'),
        # Settings / onboarding
        sa.Column('settings', postgresql.JSONB(), server_default='{}'),
        sa.Column('onboarding_completed', sa.Boolean(), server_default='false'),
        sa.Column('onboarding_step', sa.Integer(), server_default='0'),
        # Status
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_verified', sa.Boolean(), server_default='false'),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        # NUEVAS COLUMNAS (desde codigo B)
        sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('suspended_reason', sa.Text(), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True),
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ruc'),
    )
    op.create_index('ix_businesses_ruc', 'businesses', ['ruc'])
    op.create_foreign_key('fk_businesses_owner_id', 'businesses', 'users', ['owner_id'], ['id'], ondelete='SET NULL')

    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=True),  # nullable para super_admin
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', sa.Enum('SUPERADMIN', 'owner', 'admin', 'manager', 'seller', 'viewer', 'accountant', name='userrole'), server_default='seller'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_verified', sa.Boolean(), server_default='false'),
        sa.Column('api_key_hash', sa.String(255), nullable=True),
        sa.Column('api_key_last_used', sa.DateTime(), nullable=True),
        sa.Column('reset_password_token', sa.String(255), nullable=True),
        sa.Column('reset_password_expires', sa.DateTime(), nullable=True),
        sa.Column('verification_token', sa.String(255), nullable=True),
        sa.Column('verification_code', sa.String(10), nullable=True),
        sa.Column('verification_expires', sa.DateTime(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_ip', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_business_id', 'users', ['business_id'])

    # ── token_blacklist ──────────────────────────────────────────────────────
    op.create_table(
        'token_blacklist',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('jti', sa.String(64), nullable=False),
        sa.Column('token_type', sa.String(10), server_default='access'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('jti'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_token_blacklist_jti', 'token_blacklist', ['jti'])
    op.create_index('ix_token_blacklist_expires_at', 'token_blacklist', ['expires_at'])
    op.create_index('ix_token_blacklist_user_id', 'token_blacklist', ['user_id'])

    # ── onboarding_progress ──────────────────────────────────────────────────
    op.create_table(
        'onboarding_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('current_step', sa.Integer(), server_default='0', nullable=False),
        sa.Column('completed_steps', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('selected_plan', sa.String(20), nullable=True),
        sa.Column('step_data', postgresql.JSONB(), server_default='{}', nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_onboarding_progress_user_id', 'onboarding_progress', ['user_id'], unique=True)

    # ── categories ───────────────────────────────────────────────────────────
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('level', sa.Integer(), server_default='0'),
        sa.Column('path', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_categories_business_name', 'categories', ['business_id', 'name'], unique=True)

    # ── products ─────────────────────────────────────────────────────────────
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sku', sa.String(50), nullable=True),
        sa.Column('barcode', sa.String(50), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('precio_venta', sa.Numeric(10, 2), nullable=False),
        sa.Column('precio_mayorista', sa.Numeric(10, 2), nullable=True),
        sa.Column('costo', sa.Numeric(10, 2), nullable=True),
        sa.Column('utilidad_porcentaje', sa.Numeric(5, 2), server_default='0'),
        sa.Column('impuesto_iva', sa.Numeric(5, 2), server_default='15.00'),
        sa.Column('codigo_iva_sri', sa.String(2), server_default='4'),
        sa.Column('tiene_ice', sa.Boolean(), server_default='false'),
        sa.Column('porcentaje_ice', sa.Numeric(5, 2), server_default='0'),
        sa.Column('codigo_ice_sri', sa.String(2), nullable=True),
        sa.Column('control_stock', sa.Boolean(), server_default='true'),
        sa.Column('stock_actual', sa.Integer(), server_default='0'),
        sa.Column('stock_minimo', sa.Integer(), server_default='0'),
        sa.Column('stock_maximo', sa.Integer(), nullable=True),
        sa.Column('stock_reservado', sa.Integer(), server_default='0'),
        sa.Column('ubicacion', sa.String(100), nullable=True),
        sa.Column('es_servicio', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('imagen_url', sa.String(500), nullable=True),
        sa.Column('imagenes', postgresql.JSONB(), server_default='[]'),
        sa.Column('atributos', postgresql.JSONB(), server_default='{}'),
        sa.Column('tags', postgresql.JSONB(), server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deleted_by'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint('precio_venta >= 0', name='ck_product_price_positive'),
        sa.CheckConstraint('stock_actual >= 0', name='ck_product_stock_non_negative'),
    )
    op.create_index('ix_products_business_id', 'products', ['business_id'])
    op.create_index('ix_products_business_sku', 'products', ['business_id', 'sku'], unique=True)
    op.create_index('ix_products_business_active', 'products', ['business_id', 'is_active'])

    # ── customers ────────────────────────────────────────────────────────────
    op.create_table(
        'customers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('identification', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('birth_date', sa.DateTime(), nullable=True),
        sa.Column('gender', sa.String(10), nullable=True),
        sa.Column('occupation', sa.String(100), nullable=True),
        sa.Column('whatsapp_opted_in', sa.Boolean(), server_default='true'),
        sa.Column('facebook_id', sa.String(100), nullable=True),
        sa.Column('instagram_username', sa.String(100), nullable=True),
        sa.Column('total_purchases', sa.Integer(), server_default='0'),
        sa.Column('total_spent', sa.Numeric(10, 2), server_default='0'),
        sa.Column('average_purchase', sa.Numeric(10, 2), server_default='0'),
        sa.Column('last_purchase_date', sa.DateTime(), nullable=True),
        sa.Column('preferences', postgresql.JSONB(), server_default='{}'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_blocked', sa.Boolean(), server_default='false'),
        sa.Column('blocked_reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_customers_business_id', 'customers', ['business_id'])
    op.create_index('ix_customers_phone', 'customers', ['business_id', 'phone_number'])

    # ── price_lists ──────────────────────────────────────────────────────────
    op.create_table(
        'price_lists',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('tipo', sa.String(20), server_default='general'),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('fecha_inicio', sa.DateTime(timezone=True), nullable=True),
        sa.Column('fecha_fin', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
    )

    # ── price_list_items ─────────────────────────────────────────────────────
    op.create_table(
        'price_list_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('price_list_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('precio', sa.Numeric(10, 2), nullable=False),
        sa.Column('cantidad_minima', sa.Integer(), server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['price_list_id'], ['price_lists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    )

    # ── sales ────────────────────────────────────────────────────────────────
    op.create_table(
        'sales',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('numero_venta', sa.String(50), nullable=False),
        sa.Column('fecha_venta', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('estado', sa.String(20), server_default='pending'),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('descuento', sa.Numeric(10, 2), server_default='0'),
        sa.Column('tipo_descuento', sa.String(10), nullable=True),
        sa.Column('iva', sa.Numeric(10, 2), server_default='0'),
        sa.Column('ice', sa.Numeric(10, 2), server_default='0'),
        sa.Column('total', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('metodo_pago', sa.String(20), server_default='cash'),
        sa.Column('estado_pago', sa.String(20), server_default='pending'),
        sa.Column('detalles_pago', postgresql.JSONB(), server_default='{}'),
        sa.Column('fecha_pago', sa.DateTime(timezone=True), nullable=True),
        sa.Column('factura_id', postgresql.UUID(as_uuid=True), nullable=True),
        
        # ✅ AGREGAR ESTAS DOS LÍNEAS
        sa.Column('tipo_comprobante', sa.String(50), nullable=True, server_default='CONSUMIDOR_FINAL'),
        sa.Column('customer_email', sa.String(255), nullable=True),
        
        sa.Column('sesion_whatsapp_id', sa.String(255), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('notas_internas', sa.Text(), nullable=True),
        sa.Column('motivo_cancelacion', sa.String(255), nullable=True),
        sa.Column('confirmado_en', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completado_en', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelado_en', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id', 'numero_venta', name='uq_sales_business_numero'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.CheckConstraint('total >= 0', name='ck_sale_total_non_negative'),
    )
    op.create_index('ix_sales_business_id', 'sales', ['business_id'])
    op.create_index('ix_sales_business_date', 'sales', ['business_id', 'fecha_venta'])
    op.create_index('ix_sales_customer', 'sales', ['customer_id'])
    op.create_index('ix_sales_estado', 'sales', ['business_id', 'estado'])

    # ── sale_items ───────────────────────────────────────────────────────────
    op.create_table(
        'sale_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('nombre_producto', sa.String(255), nullable=False),
        sa.Column('sku_producto', sa.String(50), nullable=True),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('precio_unitario', sa.Numeric(10, 2), nullable=False),
        sa.Column('descuento', sa.Numeric(10, 2), server_default='0'),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('iva_porcentaje', sa.Numeric(5, 2), server_default='15.00'),
        sa.Column('iva_monto', sa.Numeric(10, 2), server_default='0'),
        sa.Column('ice_porcentaje', sa.Numeric(5, 2), server_default='0'),
        sa.Column('ice_monto', sa.Numeric(10, 2), server_default='0'),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.CheckConstraint('cantidad > 0', name='ck_sale_item_quantity_positive'),
    )
    op.create_index('ix_sale_items_sale', 'sale_items', ['sale_id'])
    op.create_index('ix_sale_items_product', 'sale_items', ['product_id'])

    # ── invoices ─────────────────────────────────────────────────────────────
    op.create_table(
        'invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('sequential', sa.String(50), nullable=False),
        sa.Column('issue_date', sa.DateTime(), nullable=False),
        sa.Column('authorization_date', sa.DateTime(), nullable=True),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('subtotal_iva', sa.Numeric(10, 2), server_default='0'),
        sa.Column('subtotal_ice', sa.Numeric(10, 2), server_default='0'),
        sa.Column('discount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('iva', sa.Numeric(10, 2), server_default='0'),
        sa.Column('ice', sa.Numeric(10, 2), server_default='0'),
        sa.Column('total', sa.Numeric(10, 2), nullable=False),
        sa.Column('sri_status', sa.String(50), server_default='PENDING'),
        sa.Column('sri_response', postgresql.JSONB(), server_default='{}'),
        sa.Column('sri_error', sa.Text(), nullable=True),
        sa.Column('sri_attempts', sa.Integer(), server_default='0'),
        sa.Column('xml_signed', sa.Text(), nullable=True),
        sa.Column('xml_authorized', sa.Text(), nullable=True),
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('payment_method', sa.String(50), server_default='01'),
        sa.Column('payment_due_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_invoices_business_id', 'invoices', ['business_id'])
    op.create_index('ix_invoices_sri_status', 'invoices', ['business_id', 'sri_status'])
    op.create_index('ix_invoices_sale_id', 'invoices', ['sale_id'])

    # ── invoice_details ──────────────────────────────────────────────────────
    op.create_table(
        'invoice_details',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('product_sku', sa.String(50), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('discount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('total_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('iva_percentage', sa.Numeric(5, 2), server_default='15.00'),
        sa.Column('iva_code', sa.String(2), server_default='4'),
        sa.Column('iva_amount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('ice_percentage', sa.Numeric(5, 2), server_default='0'),
        sa.Column('ice_code', sa.String(2), nullable=True),
        sa.Column('ice_amount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
    )

    # ── inventory_movements ──────────────────────────────────────────────────
    op.create_table(
        'inventory_movements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('movement_type', sa.String(20), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('stock_anterior', sa.Integer(), nullable=False),
        sa.Column('stock_nuevo', sa.Integer(), nullable=False),
        sa.Column('costo_unitario', sa.Numeric(10, 2), nullable=True),
        sa.Column('costo_total', sa.Numeric(10, 2), nullable=True),
        sa.Column('reference_type', sa.String(20), nullable=True),
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reference_number', sa.String(50), nullable=True),
        sa.Column('from_location', sa.String(100), nullable=True),
        sa.Column('to_location', sa.String(100), nullable=True),
        sa.Column('motivo', sa.String(255), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint('cantidad != 0', name='ck_movement_quantity_non_zero'),
    )
    op.create_index('ix_inventory_movements_product', 'inventory_movements', ['product_id', 'created_at'])
    op.create_index('ix_inventory_movements_business', 'inventory_movements', ['business_id'])

    # ── whatsapp_messages ────────────────────────────────────────────────────
    op.create_table(
        'whatsapp_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('whatsapp_message_id', sa.String(255), nullable=True),
        sa.Column('whatsapp_conversation_id', sa.String(255), nullable=True),
        sa.Column('direction', sa.String(10), nullable=False),
        sa.Column('message_type', sa.String(20), server_default='text'),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('media_url', sa.String(500), nullable=True),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('status_updated_at', sa.DateTime(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('whatsapp_timestamp', sa.DateTime(), nullable=True),
        sa.Column('received_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('processed', sa.Boolean(), server_default='false'),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('processing_attempts', sa.Integer(), server_default='0'),
        sa.Column('in_reply_to', sa.String(255), nullable=True),
        sa.Column('session_id', sa.String(255), nullable=True),
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_whatsapp_messages_business_id', 'whatsapp_messages', ['business_id'])
    op.create_index('ix_whatsapp_messages_phone', 'whatsapp_messages', ['business_id', 'customer_id'])

    # ── whatsapp_templates ───────────────────────────────────────────────────
    op.create_table(
        'whatsapp_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('language', sa.String(10), server_default='es'),
        sa.Column('status', sa.String(20), server_default='PENDING'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
    )

    # ============================================
    # TABLAS ADICIONALES DE WHATSAPP Y AUDITORÍA
    # ============================================

    # ── carts ──────────────────────────────────────────────────────────────────
    op.create_table(
        'carts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), server_default='ACTIVE'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_carts_customer', 'carts', ['customer_id', 'status'])
    op.create_index('ix_carts_expires', 'carts', ['expires_at'])

    # ── cart_items ──────────────────────────────────────────────────────────────
    op.create_table(
        'cart_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cart_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('discount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('total_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
    )
    op.create_index('ix_cart_items_cart', 'cart_items', ['cart_id'])

    # ── whatsapp_sessions ────────────────────────────────────────────────────────
    op.create_table(
        'whatsapp_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('state', sa.String(20), server_default='IDLE'),
        sa.Column('cart_data', postgresql.JSONB(), server_default='{}'),
        sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id', 'customer_id', name='uq_whatsapp_session_customer'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_whatsapp_sessions_customer', 'whatsapp_sessions', ['customer_id'])
    op.create_index('ix_whatsapp_sessions_expires', 'whatsapp_sessions', ['expires_at'])

    # ── audit_logs ──────────────────────────────────────────────────────────────
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('resource', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(100), nullable=True),
        sa.Column('details', postgresql.JSONB(), server_default='{}'),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_audit_logs_business', 'audit_logs', ['business_id', 'created_at'])
    op.create_index('ix_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])

    # ── notifications ───────────────────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('metadata', postgresql.JSONB(), server_default='{}'),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_notifications_user', 'notifications', ['user_id', 'is_read'])
    op.create_index('ix_notifications_business', 'notifications', ['business_id'])

    # ── attachments ─────────────────────────────────────────────────────────────
    op.create_table(
        'attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('related_type', sa.String(50), nullable=False),
        sa.Column('related_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(100), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('is_public', sa.Boolean(), server_default='false'),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_attachments_related', 'attachments', ['related_type', 'related_id'])
    op.create_index('ix_attachments_business', 'attachments', ['business_id'])

    # ── failed_jobs ────────────────────────────────────────────────────────────
    op.create_table(
        'failed_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_id', sa.String(255), nullable=False),
        sa.Column('task_name', sa.String(255), nullable=False),
        sa.Column('args', postgresql.JSONB(), server_default='[]'),
        sa.Column('kwargs', postgresql.JSONB(), server_default='{}'),
        sa.Column('exception', sa.Text(), nullable=False),
        sa.Column('traceback', sa.Text(), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_failed_jobs_job_id', 'failed_jobs', ['job_id'])
    op.create_index('ix_failed_jobs_task', 'failed_jobs', ['task_name'])

    # ============================================
    # TABLAS DE ROLES Y PERMISOS (desde codigo B)
    # ============================================

    # ── user_permissions ─────────────────────────────────────────────────────
    op.create_table(
        'user_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('permission_key', sa.String(100), nullable=False),
        sa.Column('is_allowed', sa.Boolean(), nullable=False, server_default='t'),
        sa.Column('granted_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('user_id', 'permission_key', name='uq_user_permission')
    )
    op.create_index('ix_user_permissions_user_id', 'user_permissions', ['user_id'])
    op.create_index('ix_user_permissions_permission_key', 'user_permissions', ['permission_key'])

    # ── role_permissions ─────────────────────────────────────────────────────
    op.create_table(
        'role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('permission_key', sa.String(100), nullable=False),
        sa.Column('is_allowed', sa.Boolean(), nullable=False, server_default='t'),
        sa.UniqueConstraint('role', 'permission_key', name='uq_role_permission')
    )
    op.create_index('ix_role_permissions_role', 'role_permissions', ['role'])
    op.create_index('ix_role_permissions_permission_key', 'role_permissions', ['permission_key'])

    # ── business_audit_logs ──────────────────────────────────────────────────
    op.create_table(
        'business_audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(), nullable=True),
        sa.Column('new_values', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_business_audit_logs_business_id', 'business_audit_logs', ['business_id'])
    op.create_index('ix_business_audit_logs_user_id', 'business_audit_logs', ['user_id'])
    op.create_index('ix_business_audit_logs_action', 'business_audit_logs', ['action'])
    op.create_index('ix_business_audit_logs_entity', 'business_audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_business_audit_logs_created_at', 'business_audit_logs', ['created_at'])

    # ============================================
    # DATOS INICIALES DE PERMISOS (opcional)
    # ============================================
    
    # Insertar permisos por defecto para roles
    # (Descomentar si se desea agregar datos iniciales)
    """
    op.execute("""
        INSERT INTO role_permissions (role, permission_key, is_allowed) VALUES
        -- Owner (full access)
        ('owner', 'view_dashboard', true),
        ('owner', 'manage_products', true),
        ('owner', 'manage_inventory', true),
        ('owner', 'manage_sales', true),
        ('owner', 'view_invoices', true),
        ('owner', 'manage_customers', true),
        ('owner', 'manage_users', true),
        ('owner', 'manage_roles', true),
        ('owner', 'view_reports', true),
        ('owner', 'manage_settings', true),
        ('owner', 'manage_whatsapp', true),
        ('owner', 'view_audit_logs', true),
        ('owner', 'manage_subscription', true),
        ('owner', 'manage_integrations', true),
        -- Admin (almost full)
        ('admin', 'view_dashboard', true),
        ('admin', 'manage_products', true),
        ('admin', 'manage_inventory', true),
        ('admin', 'manage_sales', true),
        ('admin', 'view_invoices', true),
        ('admin', 'manage_customers', true),
        ('admin', 'manage_users', true),
        ('admin', 'view_reports', true),
        ('admin', 'manage_whatsapp', true),
        ('admin', 'view_audit_logs', true),
        ('admin', 'manage_settings', false),
        ('admin', 'manage_roles', false),
        ('admin', 'manage_subscription', false),
        -- Seller (sales only)
        ('seller', 'view_dashboard', true),
        ('seller', 'manage_sales', true),
        ('seller', 'view_invoices', true),
        ('seller', 'manage_customers', true),
        ('seller', 'view_reports', true),
        ('seller', 'manage_whatsapp', true),
        ('seller', 'manage_products', false),
        ('seller', 'manage_inventory', false),
        ('seller', 'manage_users', false),
        ('seller', 'manage_settings', false),
        ('seller', 'view_audit_logs', false)
    ON CONFLICT (role, permission_key) DO NOTHING
    """)
    """

    # ============================================
    # TABLAS DE GUÍAS DE REMISIÓN (NUEVAS)
    # ============================================

    # ── waybills ──────────────────────────────────────────────────────────────
    op.create_table(
        'waybills',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sequential', sa.String(20), nullable=False),
        sa.Column('waybill_number', sa.String(49), nullable=True),
        # Datos de traslado
        sa.Column('tipo_guia', sa.String(2), nullable=False, server_default='01'),
        sa.Column('motivo_traslado', sa.Text(), nullable=False),
        sa.Column('direccion_partida', sa.Text(), nullable=True),
        sa.Column('direccion_destino', sa.Text(), nullable=True),
        sa.Column('ruta', sa.Text(), nullable=True),
        sa.Column('fecha_inicio', sa.DateTime(), nullable=True),
        sa.Column('fecha_fin', sa.DateTime(), nullable=True),
        # Destinatario
        sa.Column('destinatario_name', sa.String(300), nullable=True),
        sa.Column('destinatario_identification', sa.String(13), nullable=True),
        sa.Column('destinatario_address', sa.Text(), nullable=True),
        sa.Column('destinatario_phone', sa.String(20), nullable=True),
        sa.Column('destinatario_email', sa.String(255), nullable=True),
        # Transporte
        sa.Column('tipo_transporte', sa.String(2), server_default='01'),
        sa.Column('transportista_nombre', sa.String(300), nullable=True),
        sa.Column('transportista_ruc', sa.String(13), nullable=True),
        sa.Column('placa', sa.String(10), nullable=True),
        sa.Column('marca_vehiculo', sa.String(100), nullable=True),
        sa.Column('color_vehiculo', sa.String(50), nullable=True),
        # ✅ NUEVOS CAMPOS DE TRACKING
        sa.Column('tracking_status', sa.String(20), server_default='PENDING'),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('signature_url', sa.String(500), nullable=True),
        sa.Column('delivery_notes', sa.Text(), nullable=True),
        # SRI Status
        sa.Column('sri_status', sa.String(20), server_default='draft'),
        sa.Column('sri_error', sa.Text(), nullable=True),
        sa.Column('authorization_date', sa.DateTime(), nullable=True),
        sa.Column('authorization_number', sa.String(50), nullable=True),
        # XML
        sa.Column('xml_content', sa.Text(), nullable=True),
        sa.Column('xml_signed', sa.Text(), nullable=True),
        # PDF
        sa.Column('pdf_url', sa.String(500), nullable=True),
        # WhatsApp
        sa.Column('whatsapp_sent', sa.Boolean(), server_default='false'),
        sa.Column('whatsapp_sent_at', sa.DateTime(), nullable=True),
        # Audit
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_waybills_business_id', 'waybills', ['business_id'])
    op.create_index('ix_waybills_sale_id', 'waybills', ['sale_id'])
    op.create_index('ix_waybills_tracking_status', 'waybills', ['tracking_status'])
    op.create_index('ix_waybills_sri_status', 'waybills', ['sri_status'])

    # ── waybill_details ───────────────────────────────────────────────────────
    op.create_table(
        'waybill_details',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('waybill_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_sku', sa.String(50), nullable=True),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.String(20), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['waybill_id'], ['waybills.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_waybill_details_waybill_id', 'waybill_details', ['waybill_id'])

    # ── waybill_tracking ──────────────────────────────────────────────────────
    op.create_table(
        'waybill_tracking',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('waybill_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('location_lat', sa.String(50), nullable=True),
        sa.Column('location_lng', sa.String(50), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), server_default='{}'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['waybill_id'], ['waybills.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_waybill_tracking_waybill_id', 'waybill_tracking', ['waybill_id'])
    op.create_index('ix_waybill_tracking_status', 'waybill_tracking', ['status'])

def downgrade() -> None:
    # Eliminar en orden inverso de creación
    op.drop_table('business_audit_logs')
    op.drop_table('role_permissions')
    op.drop_table('user_permissions')
    op.drop_table('failed_jobs')
    op.drop_table('attachments')
    op.drop_table('notifications')
    op.drop_table('audit_logs')
    op.drop_table('whatsapp_sessions')
    op.drop_table('cart_items')
    op.drop_table('carts')
    op.drop_table('whatsapp_templates')
    op.drop_table('whatsapp_messages')
    op.drop_table('inventory_movements')
    op.drop_table('invoice_details')
    op.drop_table('invoices')
    op.drop_table('sale_items')
    op.drop_table('sales')
    op.drop_table('price_list_items')
    op.drop_table('price_lists')
    op.drop_table('customers')
    op.drop_table('products')
    op.drop_table('categories')
    op.drop_table('onboarding_progress')
    op.drop_table('token_blacklist')
    op.drop_table('users')
    op.drop_table('businesses')
    op.drop_table('waybill_tracking')
    op.drop_table('waybill_details')
    op.drop_table('waybills')
    
    # Tablas existentes...
    op.drop_table('business_audit_logs')
    op.drop_table('role_permissions')