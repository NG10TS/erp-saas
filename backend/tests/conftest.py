"""
conftest.py — Test fixtures for all test modules.

Uses PostgreSQL (not SQLite) so UUID types, JSONB, and Computed columns all work.

To run:
  # Set env var first, or put in .env.test:
  export TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/erp_test
  pytest tests/
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Generator, Dict

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

# ── App imports ──────────────────────────────────────────────────────────────
from app.main import app
from app.core.database import Base, get_db
from app.core.security import security_service
from app.models.user import User
from app.models.business import Business
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem, SaleStatus, PaymentMethod, PaymentStatus
from app.constants.roles import UserRole

# ── Database setup ────────────────────────────────────────────────────────────

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://erp:erp123@localhost:5432/erp_test",
)

engine = create_engine(
    TEST_DATABASE_URL,
    # Disable pooling for tests — each test gets a clean connection
    pool_pre_ping=True,
    echo=False,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ── Session-scoped fixtures ───────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def create_test_db():
    """Create all tables before the session and drop them after."""
    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
        conn.commit()

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def db() -> Generator[Session, None, None]:
    """Session-wide DB session (reused across tests for speed)."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """FastAPI TestClient shared within each test module."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


# ── Business + User fixtures ──────────────────────────────────────────────────

@pytest.fixture(scope="module")
def test_business(db: Session) -> Business:
    business = Business(
        id=uuid.uuid4(),
        ruc="1234567890001",
        business_name="Test Business SA",
        commercial_name="Test Shop",
        email="business@test.ec",
        phone="0999999999",
        address="Av. Test 123, Quito",
        sri_environment="1",
        sri_emisor_type="01",
        is_active=True,
        is_verified=True,
        subscription_plan="pro",
        max_users=3,
        max_products=500,
        max_invoices_monthly=200,
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


@pytest.fixture(scope="module")
def test_user(db: Session, test_business: Business) -> User:
    user = User(
        id=uuid.uuid4(),
        business_id=test_business.id,
        email="owner@test.ec",
        username="testowner",
        password_hash=security_service.get_password_hash("TestPass123!"),
        first_name="Test",
        last_name="Owner",
        phone="0999999998",
        role=UserRole.OWNER,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="module")
def auth_headers(test_user: User) -> Dict[str, str]:
    """JWT Bearer headers for the test user."""
    import secrets
    token = security_service.create_access_token(
        data={
            "sub": str(test_user.id),
            "business_id": str(test_user.business_id),
            "jti": secrets.token_urlsafe(16),
        }
    )
    return {"Authorization": f"Bearer {token}"}


# ── Domain fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def test_product(db: Session, test_business: Business) -> Product:
    from app.models.product import Product as Prod
    p = Prod(
        id=uuid.uuid4(),
        business_id=test_business.id,
        name="Camiseta Test",
        sku="TST001",
        precio_venta=25.00,
        stock_actual=100,
        stock_minimo=10,
        is_active=True,
        control_stock=True,
        has_iva=True,
        iva_percentage=15,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture(scope="module")
def test_customer(db: Session, test_business: Business) -> Customer:
    c = Customer(
        id=uuid.uuid4(),
        business_id=test_business.id,
        name="Juan Pérez",
        identification="1712345678",
        identification_type="05",
        email="juan@test.ec",
        phone_number="+593991234567",
        is_active=True,
        whatsapp_opted_in=True,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@pytest.fixture(scope="module")
def test_sale(db: Session, test_business: Business, test_user: User,
              test_customer: Customer, test_product: Product) -> Sale:
    sale = Sale(
        id=uuid.uuid4(),
        business_id=test_business.id,
        customer_id=test_customer.id,
        created_by=test_user.id,
        numero_venta="V-001",
        subtotal=25.00,
        descuento=0,
        iva=3.75,
        ice=0,
        total=28.75,
        metodo_pago=PaymentMethod.CASH,
        estado=SaleStatus.COMPLETED,
        estado_pago=PaymentStatus.PAID,
    )
    db.add(sale)
    db.flush()

    item = SaleItem(
        id=uuid.uuid4(),
        sale_id=sale.id,
        product_id=test_product.id,
        product_name=test_product.name,
        product_sku=test_product.sku,
        cantidad=1,
        precio_unitario=25.00,
        descuento=0,
        iva_porcentaje=15,
        iva_monto=3.75,
        subtotal=25.00,
        total=28.75,
    )
    db.add(item)
    db.commit()
    db.refresh(sale)
    return sale