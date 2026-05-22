#!/bin/bash

# Script de despliegue para Railway

echo "🚀 Iniciando despliegue..."

# Construir backend
echo "📦 Construyendo backend..."
cd backend
docker build -t erp-backend .

# Ejecutar migraciones
echo "🗄️  Ejecutando migraciones..."
alembic upgrade head

# Construir frontend
echo "🎨 Construyendo frontend..."
cd ../frontend
npm run build

# Desplegar en Railway
echo "☁️  Desplegando en Railway..."
railway up

echo "✅ Despliegue completado!"