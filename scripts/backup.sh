#!/usr/bin/env bash
# ==========================================
# CampusConnect Pro Automated Backup Script
# ==========================================
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}"
DB_NAME=${DB_NAME:-"campusconnect_pro"}
MONGO_URI=${MONGODB_URI:-"mongodb://localhost:27017/${DB_NAME}"}

echo "Starting CampusConnect Pro Backup..."
mkdir -p "${BACKUP_DIR}"

# 1. MongoDB Database Dump
if command -v mongodump &> /dev/null; then
    echo "Dumping MongoDB Database..."
    mongodump --uri="${MONGO_URI}" --out="${BACKUP_DIR}/mongodb"
else
    echo "Warning: mongodump not installed. Skipping database dump."
fi

# 2. Uploads Directory Archive
if [ -d "./uploads" ]; then
    echo "Archiving uploads folder..."
    tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C . uploads
fi

# 3. Logs Archive
if [ -d "./logs" ]; then
    echo "Archiving logs folder..."
    tar -czf "${BACKUP_DIR}/logs.tar.gz" -C . logs
fi

# 4. Environment Template Backup
if [ -f ".env" ]; then
    cp .env.example "${BACKUP_DIR}/env.template.bak"
fi

echo "✅ Backup successfully created at ${BACKUP_DIR}"
