#!/bin/bash

# Script de restauración
# Uso: ./restore.sh <fecha YYYYMMDD_HHMMSS>

if [ -z "$1" ]; then
    echo "❌ Uso: ./restore.sh <fecha YYYYMMDD_HHMMSS>"
    exit 1
fi

DATE=$1
BACKUP_DIR="/backups/restore"
S3_BUCKET="erp-backups"

echo "🔄 Iniciando restauración para fecha: $DATE"

# Crear directorio temporal
mkdir -p $BACKUP_DIR

# Descargar backups de S3
echo "📥 Descargando backups de S3..."
aws s3 cp s3://$S3_BUCKET/database/db_$DATE.sql.gz.gpg $BACKUP_DIR/
aws s3 cp s3://$S3_BUCKET/files/files_$DATE.tar.gz.gpg $BACKUP_DIR/

# Desencriptar
echo "🔓 Desencriptando..."
gpg --decrypt $BACKUP_DIR/db_$DATE.sql.gz.gpg > $BACKUP_DIR/db_$DATE.sql.gz
gpg --decrypt $BACKUP_DIR/files_$DATE.tar.gz.gpg > $BACKUP_DIR/files_$DATE.tar.gz

# Restaurar base de datos
echo "🗄️  Restaurando base de datos..."
gunzip -c $BACKUP_DIR/db_$DATE.sql.gz | psql -U $DB_USER $DB_NAME

# Restaurar archivos
echo "📁 Restaurando archivos..."
tar -xzf $BACKUP_DIR/files_$DATE.tar.gz -C /

# Limpiar
rm -rf $BACKUP_DIR

echo "✅ Restauración completada"