#!/usr/bin/env bash
# ==========================================
# CampusConnect Pro Automated Restore Script
# ==========================================
set -e

BACKUP_DIR=$1
DB_NAME=${DB_NAME:-"campusconnect_pro"}
MONGO_URI=${MONGODB_URI:-"mongodb://localhost:27017/${DB_NAME}"}

if [ -z "${BACKUP_DIR}" ]; then
    echo "Usage: ./scripts/restore.sh <path_to_backup_directory>"
    exit 1
fi

if [ ! -d "${BACKUP_DIR}" ]; then
    echo "Error: Backup directory ${BACKUP_DIR} does not exist."
    exit 1
fi

echo "Restoring CampusConnect Pro Backup from ${BACKUP_DIR}..."

# 1. Restore MongoDB Database
if [ -d "${BACKUP_DIR}/mongodb" ] && command -v mongorestore &> /dev/null; then
    echo "Restoring MongoDB Database..."
    mongorestore --uri="${MONGO_URI}" --drop "${BACKUP_DIR}/mongodb"
fi

# 2. Restore Uploads Directory
if [ -f "${BACKUP_DIR}/uploads.tar.gz" ]; then
    echo "Restoring uploads folder..."
    tar -xzf "${BACKUP_DIR}/uploads.tar.gz" -C .
fi

echo "✅ Restoration completed successfully."
