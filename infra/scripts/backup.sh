#!/bin/bash

# Configuración
BACKUP_DIR="/backups"
DB_NAME="erp_db"
DB_USER="erp_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
S3_BUCKET="erp-backups"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "📦 Respaldando base de datos..."
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos (certificados, configuraciones)
echo "📁 Respaldando archivos..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/certificates /app/config

# Encriptar backups sensibles
echo "🔐 Encriptando backups..."
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/db_$DATE.sql.gz
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/files_$DATE.tar.gz

# Subir a S3
echo "☁️  Subiendo a S3..."
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz.gpg s3://$S3_BUCKET/database/
aws s3 cp $BACKUP_DIR/files_$DATE.tar.gz.gpg s3://$S3_BUCKET/files/

# Limpiar backups antiguos
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Limpiar S3 antiguo
aws s3 ls s3://$S3_BUCKET/database/ | while read -r line;
do
    createDate=`echo $line|awk {'print $1" "$2'}`
    createDate=`date -d"$createDate" +%s`
    olderThan=`date -d"-$RETENTION_DAYS days" +%s`
    if [[ $createDate -lt $olderThan ]]
    then
        fileName=`echo $line|awk {'print $4'}`
        if [[ $fileName != "" ]]
        then
            aws s3 rm s3://$S3_BUCKET/database/$fileName
        fi
    fi
done

echo "✅ Backup completado: $DATE"