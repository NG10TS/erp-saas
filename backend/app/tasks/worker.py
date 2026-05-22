"""
Celery worker configuration
"""
from celery import Celery
from celery.signals import task_failure, task_success, task_prerun
from kombu import Queue, Exchange
import logging
from datetime import timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "erp_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.invoice_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.cleanup_tasks"
    ]
)

# Configure queues
celery_app.conf.task_queues = (
    Queue(
        'default',
        Exchange('default'),
        routing_key='default',
        queue_arguments={'x-max-priority': 5}
    ),
    Queue(
        'high_priority',
        Exchange('high_priority'),
        routing_key='high_priority',
        queue_arguments={'x-max-priority': 10}
    ),
    Queue(
        'invoices',
        Exchange('invoices'),
        routing_key='invoices',
        queue_arguments={'x-max-priority': 9}
    ),
    Queue(
        'notifications',
        Exchange('notifications'),
        routing_key='notifications',
        queue_arguments={'x-max-priority': 8}
    ),
)

# Task routing
celery_app.conf.task_routes = {
    'app.tasks.invoice_tasks.process_invoice': {'queue': 'invoices'},
    'app.tasks.invoice_tasks.check_pending_invoices': {'queue': 'invoices'},
    'app.tasks.notification_tasks.*': {'queue': 'notifications'},
    'app.tasks.cleanup_tasks.*': {'queue': 'default'},
}

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Guayaquil',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_max_tasks_per_child=200,
    worker_prefetch_multiplier=1,
    result_expires=60 * 60 * 24,  # 1 day
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_queue='default',
    task_default_priority=5,
    task_queue_max_priority=10,
)

# Beat schedule
celery_app.conf.beat_schedule = {
    'check-pending-invoices': {
        'task': 'app.tasks.invoice_tasks.check_pending_invoices',
        'schedule': timedelta(minutes=5),
        'options': {'queue': 'invoices'}
    },
    'check-low-stock': {
        'task': 'app.tasks.notification_tasks.check_low_stock',
        'schedule': timedelta(hours=1),
        'options': {'queue': 'default'}
    },
    'cleanup-old-sessions': {
        'task': 'app.tasks.cleanup_tasks.cleanup_old_sessions',
        'schedule': timedelta(hours=24),
        'options': {'queue': 'default'}
    },
    'cleanup-old-logs': {
        'task': 'app.tasks.cleanup_tasks.cleanup_old_logs',
        'schedule': timedelta(days=7),
        'options': {'queue': 'default'}
    },
}


@task_prerun.connect
def task_prerun_handler(task_id=None, task=None, *args, **kwargs):
    """Log task start"""
    logger.info(f"Task {task.name}[{task_id}] started")


@task_success.connect
def task_success_handler(sender=None, result=None, **kwargs):
    """Log task success"""
    logger.info(f"Task {sender.name} completed successfully")


@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None, **kwargs):
    """Log task failure"""
    logger.error(f"Task {sender.name}[{task_id}] failed: {exception}")