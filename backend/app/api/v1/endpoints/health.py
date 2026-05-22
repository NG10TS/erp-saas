from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
from datetime import datetime
import psutil
import os

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Endpoint de health check para monitoreo.
    Verifica base de datos, redis y estado general.
    """
    status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {}
    }
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        status["checks"]["database"] = {"status": "healthy"}
    except Exception as e:
        status["status"] = "degraded"
        status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        status["checks"]["redis"] = {"status": "healthy"}
    except Exception as e:
        status["status"] = "degraded"
        status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check disk space
    disk = psutil.disk_usage('/')
    if disk.percent > 90:
        status["status"] = "degraded"
        status["checks"]["disk"] = {
            "status": "warning",
            "used_percent": disk.percent
        }
    else:
        status["checks"]["disk"] = {
            "status": "healthy",
            "used_percent": disk.percent
        }
    
    # Check memory
    memory = psutil.virtual_memory()
    if memory.percent > 90:
        status["status"] = "degraded"
        status["checks"]["memory"] = {
            "status": "warning",
            "used_percent": memory.percent
        }
    else:
        status["checks"]["memory"] = {
            "status": "healthy",
            "used_percent": memory.percent
        }
    
    # HTTP status code
    http_status = 200 if status["status"] == "healthy" else 503
    return status, http_status

@router.get("/metrics")
async def metrics():
    """
    Endpoint de métricas para Prometheus.
    """
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from prometheus_client import Counter, Histogram, Gauge
    
    # Métricas personalizadas
    metrics_data = generate_latest()
    
    from fastapi.responses import Response
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )

# Definición de métricas
import prometheus_client

# Contadores
invoices_created = prometheus_client.Counter(
    'invoices_created_total',
    'Total de facturas creadas',
    ['business_id']
)

invoices_authorized = prometheus_client.Counter(
    'invoices_authorized_total',
    'Total de facturas autorizadas por SRI',
    ['business_id']
)

invoices_failed = prometheus_client.Counter(
    'invoices_failed_total',
    'Total de facturas rechazadas/error',
    ['business_id', 'error_type']
)

# Histogramas
whatsapp_response_time = prometheus_client.Histogram(
    'whatsapp_response_seconds',
    'Tiempo de respuesta de WhatsApp API',
    buckets=[0.1, 0.5, 1, 2, 5, 10]
)

sri_response_time = prometheus_client.Histogram(
    'sri_response_seconds',
    'Tiempo de respuesta del SRI',
    buckets=[1, 2, 5, 10, 30, 60]
)

# Gauges
active_whatsapp_sessions = prometheus_client.Gauge(
    'active_whatsapp_sessions',
    'Sesiones activas de WhatsApp'
)

pending_invoices = prometheus_client.Gauge(
    'pending_invoices',
    'Facturas pendientes de procesar'
)

# Registrar métricas
def track_invoice_created(business_id: str):
    invoices_created.labels(business_id=business_id).inc()

def track_invoice_authorized(business_id: str):
    invoices_authorized.labels(business_id=business_id).inc()

def track_invoice_failed(business_id: str, error_type: str):
    invoices_failed.labels(business_id=business_id, error_type=error_type).inc()