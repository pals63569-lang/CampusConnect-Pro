# CampusConnect Pro Backup & Disaster Recovery Guide

This document outlines the backup and recovery procedures for CampusConnect Pro database, user uploaded assets, and environment configurations.

---

## 1. Backup Strategy

Automated backup execution is performed using `scripts/backup.sh`:
- **Database Dump**: Uses `mongodump` to snapshot the MongoDB database.
- **Uploads Archive**: Creates a compressed tarball (`uploads.tar.gz`) of stored file uploads.
- **Logs Archive**: Archives all system logs.
- **Location**: Generated backups are saved under `./backups/<TIMESTAMP>/`.

### Execution:
```bash
bash scripts/backup.sh
```

---

## 2. Restoration Procedure

Restoration is performed using `scripts/restore.sh`:
```bash
bash scripts/restore.sh ./backups/20260803_120000
```
This script will:
1. Restore MongoDB data via `mongorestore` with `--drop` safety.
2. Uncompress and restore uploaded assets into `./uploads/`.
