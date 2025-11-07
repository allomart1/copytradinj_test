#!/bin/bash

# CopyTradinj Backup Script
# This script backs up the database and environment files

BACKUP_DIR="/var/backups/copytradinj"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup database (if using PostgreSQL)
if command -v pg_dump &> /dev/null; then
    echo "Backing up PostgreSQL database..."
    pg_dump -U copytradinj_user copytradinj > $BACKUP_DIR/db_$DATE.sql
    gzip $BACKUP_DIR/db_$DATE.sql
    echo "Database backup completed"
fi

# Backup environment files
echo "Backing up environment files..."
cp /var/www/copytradinj/.env $BACKUP_DIR/env_$DATE
cp /var/www/copytradinj/backend/.env $BACKUP_DIR/backend_env_$DATE

# Backup code (optional)
echo "Backing up code..."
cd /var/www
tar -czf $BACKUP_DIR/code_$DATE.tar.gz copytradinj/

# Remove old backups
echo "Removing backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
echo "Backup files stored in: $BACKUP_DIR"

# List backup files
echo "Current backups:"
ls -lh $BACKUP_DIR
