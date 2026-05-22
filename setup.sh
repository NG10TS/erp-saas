#!/usr/bin/env bash
# =============================================================
# setup.sh — Inicialización del ERP Conversacional
# Uso: ./setup.sh [dev|prod]
# =============================================================

set -e  # Detener si cualquier comando falla

MODE=${1:-dev}
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── 1. Verificar .env ────────────────────────────────────────
info "Verificando configuración..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        warn "Se copió .env.example → .env"
        warn "⚠️  IMPORTANTE: Edita backend/.env con tus credenciales reales antes de continuar"
        echo ""
        read -p "¿Ya editaste el .env? (y/N): " confirm
        [[ $confirm =~ ^[Yy]$ ]] || error "Edita el .env primero"
    else
        error "No existe backend/.env ni backend/.env.example"
    fi
fi

# ─── 2. Verificar SECRET_KEY ──────────────────────────────────
SECRET_KEY=$(grep "^SECRET_KEY=" "$BACKEND_DIR/.env" | cut -d'=' -f2)
if [ "$SECRET_KEY" = "GENERA_UNA_CLAVE_SEGURA_AQUI" ] || [ -z "$SECRET_KEY" ]; then
    info "Generando SECRET_KEY automáticamente..."
    NEW_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
    # Reemplazar en .env (compatible macOS y Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_KEY|" "$BACKEND_DIR/.env"
    else
        sed -i "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_KEY|" "$BACKEND_DIR/.env"
    fi
    info "SECRET_KEY generado y guardado en .env ✓"
fi

# ─── 3. Instalar dependencias Python ──────────────────────────
info "Instalando dependencias Python..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    info "Virtualenv creado ✓"
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
info "Dependencias instaladas ✓"

# ─── 4. Esperar PostgreSQL ────────────────────────────────────
info "Verificando conexión a PostgreSQL..."
DB_URL=$(grep "^DATABASE_URL=" "$BACKEND_DIR/.env" | cut -d'=' -f2-)

# Extraer host y puerto de la URL
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_PORT=${DB_PORT:-5432}

MAX_RETRIES=30
RETRY=0
until python3 -c "
import psycopg2, os
url = os.environ.get('DATABASE_URL', '$DB_URL')
try:
    conn = psycopg2.connect(url, connect_timeout=3)
    conn.close()
    print('ok')
except Exception as e:
    import sys; sys.exit(1)
" 2>/dev/null; do
    RETRY=$((RETRY+1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        error "No se pudo conectar a PostgreSQL después de ${MAX_RETRIES} intentos"
    fi
    warn "Esperando PostgreSQL... ($RETRY/$MAX_RETRIES)"
    sleep 2
done
info "PostgreSQL disponible ✓"

# ─── 5. Ejecutar migraciones ──────────────────────────────────
info "Ejecutando migraciones Alembic..."
cd "$BACKEND_DIR"

# Verificar si hay migraciones pendientes
CURRENT=$(alembic current 2>/dev/null || echo "none")
HEAD=$(alembic heads 2>/dev/null || echo "unknown")

if echo "$CURRENT" | grep -q "(head)"; then
    info "Base de datos ya actualizada ✓"
else
    alembic upgrade head
    info "Migraciones aplicadas ✓"
fi

# ─── 6. Datos iniciales (solo en dev) ─────────────────────────
if [ "$MODE" = "dev" ]; then
    read -p "¿Cargar datos de prueba? (y/N): " seed
    if [[ $seed =~ ^[Yy]$ ]]; then
        python3 scripts/seed_data.py && info "Datos de prueba cargados ✓"
    fi
fi

# ─── 7. Instalar dependencias frontend ────────────────────────
FRONTEND_DIR="$ROOT_DIR/frontend"
if [ -f "$FRONTEND_DIR/package.json" ]; then
    info "Instalando dependencias del frontend..."
    cd "$FRONTEND_DIR"
    npm install --prefer-offline --silent
    info "Dependencias frontend instaladas ✓"
fi

# ─── RESUMEN ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Setup completado exitosamente${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "  Para iniciar el proyecto:"
echo ""
echo "  Backend:"
echo "    cd backend && source venv/bin/activate"
echo "    uvicorn app.main:app --reload --port 8000"
echo ""
echo "  Frontend:"
echo "    cd frontend && npm run dev"
echo ""
echo "  Con Docker (todo en uno):"
echo "    docker-compose up -d"
echo ""
echo "  API Docs: http://localhost:8000/api/docs"
echo ""