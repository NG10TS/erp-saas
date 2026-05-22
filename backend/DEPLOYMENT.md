# Guía de Despliegue

## Opción 1: Railway (Recomendado para empezar)

Railway detecta el `railway.json` automáticamente y configura el pipeline.

### Pasos

1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → "Deploy from GitHub repo"
3. Agregar servicio PostgreSQL (botón "Add Service" → Database → PostgreSQL)
4. Agregar servicio Redis
5. Configurar variables de entorno (ver tabla abajo)
6. El deploy ocurre automáticamente en cada push a `main`

### Variables en Railway

```
DATABASE_URL         → Railway la inyecta automáticamente
REDIS_URL            → Railway la inyecta automáticamente
SECRET_KEY           → generar con: python -c "import secrets; print(secrets.token_urlsafe(64))"
ENVIRONMENT          → production
SMTP_HOST            → smtp.gmail.com
SMTP_PORT            → 587
SMTP_USER            → tu@gmail.com
SMTP_PASSWORD        → app-password-de-16-digitos
WHATSAPP_TOKEN       → desde Meta Developer Portal
WHATSAPP_PHONE_ID    → desde Meta Developer Portal
FRONTEND_URL         → https://tu-frontend.up.railway.app
```

---

## Opción 2: Docker Compose (VPS propio)

### Requisitos del servidor

- Ubuntu 22.04 LTS
- 2 vCPU, 2 GB RAM mínimo (4 GB recomendado)
- Docker 24+ y Docker Compose 2+

### Pasos

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clonar repositorio
git clone https://github.com/tu-usuario/erp-saas.git /opt/erp
cd /opt/erp

# 3. Configurar entorno de producción
cp backend/.env.example backend/.env.production
nano backend/.env.production   # Editar con tus credenciales reales

# 4. Generar clave SSL (si usas certbot)
# Ver sección SSL abajo

# 5. Levantar servicios
docker-compose -f docker-compose.prod.yml up -d

# 6. Verificar
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
```

### Actualizar a nueva versión

```bash
cd /opt/erp
git pull
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps api frontend
```

---

## Opción 3: DigitalOcean Droplet

### 1. Crear Droplet

- Imagen: Ubuntu 22.04 (LTS) x64
- Plan: Basic, 2 GB RAM / 1 vCPU ($12/mes)
- Región: más cercana a Ecuador (NYC o SFO)
- Agregar SSH key

### 2. Conectar y configurar

```bash
ssh root@TU_IP

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y python3.11 python3.11-venv python3-pip \
               postgresql-15 redis-server nginx certbot \
               python3-certbot-nginx git

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3. Configurar PostgreSQL

```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE erp_db;
CREATE USER erp_user WITH PASSWORD 'contraseña_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;
ALTER DATABASE erp_db OWNER TO erp_user;
EOF
```

### 4. Desplegar backend

```bash
cd /opt
git clone https://github.com/tu-usuario/erp-saas.git
cd erp-saas/backend

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env   # Configurar variables

alembic upgrade head

# Crear servicio systemd
cat > /etc/systemd/system/erp-backend.service << 'EOF'
[Unit]
Description=ERP Conversacional Backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/erp-saas/backend
Environment="PATH=/opt/erp-saas/backend/venv/bin"
EnvironmentFile=/opt/erp-saas/backend/.env
ExecStart=/opt/erp-saas/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable erp-backend
systemctl start erp-backend
```

### 5. Desplegar frontend

```bash
cd /opt/erp-saas/frontend
npm install
VITE_API_URL=https://api.tudominio.com npm run build

# Copiar build a Nginx
cp -r dist /var/www/erp-frontend
```

### 6. Configurar Nginx

```nginx
# /etc/nginx/sites-available/erp
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name app.tudominio.com;

    root /var/www/erp-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7. SSL con Let's Encrypt

```bash
certbot --nginx -d api.tudominio.com -d app.tudominio.com
# Certbot modifica nginx.conf automáticamente y configura renovación
```

---

## Backup automático

El script `infra/scripts/backup.sh` genera un dump de PostgreSQL y lo sube a S3/Spaces.

```bash
# Agregar a crontab del servidor
crontab -e
# Añadir:
0 2 * * * /opt/erp-saas/infra/scripts/backup.sh >> /var/log/erp-backup.log 2>&1
```

---

## Monitoreo

```bash
# Ver logs del backend en tiempo real
journalctl -u erp-backend -f

# Verificar que el API responde
curl https://api.tudominio.com/health

# Celery workers
journalctl -u erp-worker -f
```

Para errores en producción, configurar `SENTRY_DSN` en `.env`.

---

## Webhooks de WhatsApp en producción

Meta requiere HTTPS para los webhooks. Una vez que tengas SSL:

1. Ir a [Meta Developer Portal](https://developers.facebook.com) → Tu app → WhatsApp → Configuration
2. Webhook URL: `https://api.tudominio.com/api/v1/whatsapp/webhook`
3. Verify Token: el valor de `WHATSAPP_VERIFY_TOKEN` en tu `.env`
4. Suscribirse a: `messages`, `message_deliveries`, `message_reads`