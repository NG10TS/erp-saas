#!/usr/bin/env python3
"""
Database backup script
"""
import subprocess
import datetime
import os
import sys
import gzip
import shutil

# Configuration
DB_NAME = "erp_db"
DB_USER = "postgres"
BACKUP_DIR = "/backups"
RETENTION_DAYS = 30


def create_backup():
    """Create database backup"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{BACKUP_DIR}/{DB_NAME}_{timestamp}.sql"
    
    try:
        # Create backup directory if not exists
        os.makedirs(BACKUP_DIR, exist_ok=True)
        
        # Run pg_dump
        print(f"📦 Creating backup: {backup_file}")
        subprocess.run(
            f"pg_dump -U {DB_USER} {DB_NAME} > {backup_file}",
            shell=True,
            check=True,
            executable='/bin/bash'
        )
        
        # Compress
        print(f"🗜️  Compressing...")
        with open(backup_file, 'rb') as f_in:
            with gzip.open(f"{backup_file}.gz", 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Remove uncompressed
        os.remove(backup_file)
        
        print(f"✅ Backup created: {backup_file}.gz")
        
        # Clean old backups
        clean_old_backups()
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Backup failed: {e}")
        sys.exit(1)


def clean_old_backups():
    """Remove backups older than RETENTION_DAYS"""
    import time
    
    now = time.time()
    cutoff = now - (RETENTION_DAYS * 86400)
    
    for filename in os.listdir(BACKUP_DIR):
        filepath = os.path.join(BACKUP_DIR, filename)
        if os.path.isfile(filepath):
            file_time = os.path.getmtime(filepath)
            if file_time < cutoff:
                os.remove(filepath)
                print(f"🧹 Removed old backup: {filename}")


def list_backups():
    """List available backups"""
    print("📋 Available backups:")
    for filename in sorted(os.listdir(BACKUP_DIR)):
        filepath = os.path.join(BACKUP_DIR, filename)
        size = os.path.getsize(filepath)
        modified = datetime.datetime.fromtimestamp(
            os.path.getmtime(filepath)
        ).strftime("%Y-%m-%d %H:%M:%S")
        
        print(f"  {modified} - {filename} ({size:,} bytes)")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_backups()
    else:
        create_backup()