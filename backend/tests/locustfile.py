from locust import HttpUser, task, between
import random
import json

class ERPUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login al iniciar."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@empresa.com",
            "password": "test123"
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.client.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
    
    @task(3)
    def list_products(self):
        """Listar productos."""
        self.client.get("/api/v1/products")
    
    @task(2)
    def create_invoice(self):
        """Crear factura."""
        self.client.post("/api/v1/invoices", json={
            "customer_phone": f"099{random.randint(1000000, 9999999)}",
            "items": [
                {
                    "product_id": "123e4567-e89b-12d3-a456-426614174000",
                    "quantity": random.randint(1, 5)
                }
            ]
        })
    
    @task(1)
    def check_invoice_status(self):
        """Verificar estado de factura."""
        invoice_id = "123e4567-e89b-12d3-a456-426614174001"
        self.client.get(f"/api/v1/invoices/{invoice_id}")
# backend/app/core/scaling.py

SCALING_THRESHOLDS = {
    "cpu": {
        "warning": 70,  # %
        "critical": 85,
        "action": "scale_up"
    },
    "memory": {
        "warning": 80,
        "critical": 90,
        "action": "scale_up"
    },
    "database_connections": {
        "warning": 100,
        "critical": 150,
        "action": "increase_pool"
    },
    "celery_queue_size": {
        "warning": 1000,
        "critical": 5000,
        "action": "add_workers"
    },
    "invoices_per_minute": {
        "warning": 50,
        "critical": 100,
        "action": "scale_api"
    }
}

def check_scaling_needs(metrics):
    """Verifica si necesita escalar."""
    actions = []
    
    if metrics["cpu_percent"] > SCALING_THRESHOLDS["cpu"]["critical"]:
        actions.append({
            "action": "scale_up",
            "resource": "api",
            "reason": "CPU critical"
        })
    
    if metrics["celery_queue_size"] > SCALING_THRESHOLDS["celery_queue_size"]["critical"]:
        actions.append({
            "action": "add_workers",
            "resource": "worker",
            "count": 2,
            "reason": "Queue backlog"
        })
    
    return actions
# Ejecutar con: locust -f tests/load/locustfile.py --host=https://api.erp.com