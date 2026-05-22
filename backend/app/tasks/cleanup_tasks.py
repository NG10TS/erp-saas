"""
Cleanup tasks
"""
from celery import shared_task
import logging
from datetime import datetime, timedelta

from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


@shared_task
def cleanup_old_sessions():
    """
    Clean up old WhatsApp sessions
    """
    logger.info("Cleaning up old sessions")
    
    db = SessionLocal()
    try:
        from app.models.whatsapp_session import WhatsAppSession
        
        # Delete sessions older than 7 days
        cutoff = datetime.utcnow() - timedelta(days=7)
        deleted = db.query(WhatsAppSession).filter(
            WhatsAppSession.created_at < cutoff,
            WhatsAppSession.status == "abandoned"
        ).delete(synchronize_session=False)
        
        db.commit()
        logger.info(f"Deleted {deleted} old sessions")
        
    except Exception as e:
        logger.error(f"Error cleaning up sessions: {e}")
        
    finally:
        db.close()


@shared_task
def cleanup_old_logs():
    """
    Clean up old log entries
    """
    logger.info("Cleaning up old logs")
    
    db = SessionLocal()
    try:
        from app.models.audit_log import AuditLog
        
        # Delete logs older than 90 days
        cutoff = datetime.utcnow() - timedelta(days=90)
        deleted = db.query(AuditLog).filter(
            AuditLog.created_at < cutoff
        ).delete(synchronize_session=False)
        
        db.commit()
        logger.info(f"Deleted {deleted} old log entries")
        
    except Exception as e:
        logger.error(f"Error cleaning up logs: {e}")
        
    finally:
        db.close()


@shared_task
def cleanup_temp_files():
    """
    Clean up temporary files
    """
    logger.info("Cleaning up temp files")
    
    import os
    import shutil
    from app.core.config import settings
    
    try:
        temp_dir = "/tmp/erp"
        if os.path.exists(temp_dir):
            # Delete files older than 24 hours
            now = datetime.now().timestamp()
            for filename in os.listdir(temp_dir):
                filepath = os.path.join(temp_dir, filename)
                if os.path.isfile(filepath):
                    file_time = os.path.getmtime(filepath)
                    if now - file_time > 24 * 3600:  # 24 hours
                        os.remove(filepath)
                        logger.info(f"Deleted temp file: {filename}")
        
    except Exception as e:
        logger.error(f"Error cleaning up temp files: {e}")