# ERP Conversacional Ecuador 🇪🇨

**SaaS para PYMES ecuatorianas** que centraliza ventas, inventario y facturación electrónica SRI, con pedidos por WhatsApp Business.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)

---

## Características

| Módulo | Estado |
|--------|--------|
| Registro y login con JWT + refresh rotation | ✅ |
| Gestión de productos e inventario | ✅ |
| Ventas POS + carrito | ✅ |
| Facturación electrónica SRI (IVA 15%) | ✅ |
| Webhook WhatsApp Business API | ✅ |
| Dashboard con estadísticas en tiempo real | ✅ |
| Exportación a Excel / CSV | ✅ |
| Onboarding wizard con selección de plan | ✅ |
| Multi-tenencia por negocio (RUC) | ✅ |

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Python      | 3.11           |
| Node.js     | 18             |
| PostgreSQL   | 15             |
| Redis        | 7 (para Celery)|
| Docker       | 24 (opcional)  |

---

## Instalación rápida (local)

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/tu-usuario/erp-saas.git
cd erp-saas
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos (DATABASE_URL, SECRET_KEY, etc.)

# Generar SECRET_KEY segura
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Crear base de datos y aplicar migraciones
createdb erp_db                   # O desde psql
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env              # Ajustar VITE_API_URL si es necesario
npm run dev
```

Abrir: http://localhost:5173 · API Docs: http://localhost:8000/api/docs

---

## Con Docker (recomendado)

```bash
# Desarrollo
docker-compose up -d

# Producción
cp backend/.env.example backend/.env.production
# Editar .env.production
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f api
```

---

## Variables de entorno principales

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://user:pass@localhost:5432/erp_db` |
| `SECRET_KEY` | Clave para JWT (generar arriba) | `abc123...` |
| `SMTP_HOST` | Servidor de email | `smtp.gmail.com` |
| `SMTP_PASSWORD` | App password de Gmail | `xxxx xxxx xxxx xxxx` |
| `WHATSAPP_TOKEN` | Token de WhatsApp Business API | `EAABs...` |
| `WHATSAPP_PHONE_ID` | ID del número de teléfono | `12345...` |
| `SRI_TEST_ENDPOINT` | URL WSDL SRI pruebas | Ver `.env.example` |

Ver `.env.example` para la lista completa.

---

## Estructura del proyecto

```
erp-saas/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # Rutas FastAPI
│   │   ├── models/              # Modelos SQLAlchemy
│   │   ├── schemas/             # Schemas Pydantic
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── sri/             # Facturación SRI (XML, firma, cliente SOAP)
│   │   │   └── whatsapp/        # WhatsApp webhook y cliente
│   │   ├── middlewares/         # Auth, rate limit, security headers
│   │   └── core/                # Config, seguridad, logging
│   ├── migrations/              # Alembic migrations
│   └── tests/                   # pytest
├── frontend/
│   └── src/
│       ├── pages/               # Vistas principales
│       ├── components/          # UI reutilizable
│       ├── services/api/        # Llamadas al backend
│       ├── store/slices/        # Zustand stores
│       └── hooks/               # Custom hooks
└── infra/
    └── nginx/nginx.conf         # Proxy reverso
```

---

## Comandos útiles

```bash
# Backend
alembic revision --autogenerate -m "descripcion"  # Nueva migración
alembic upgrade head                               # Aplicar migraciones
alembic downgrade -1                               # Revertir última migración
pytest tests/ -v --cov=app                        # Correr tests
celery -A app.tasks.worker worker --loglevel=info  # Worker Celery

# Frontend
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run lint       # Linter
```

---

## Despliegue

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para guías detalladas de Railway, Docker y DigitalOcean.

---

## API

La documentación interactiva está disponible en `/api/docs` (Swagger) y `/api/redoc`.

Ver también [docs/API.md](docs/API.md) para ejemplos de request/response.

---

## Licencia

MIT — ver [LICENSE](LICENSE).