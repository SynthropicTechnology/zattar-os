#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

echo "Starting backup to $BACKUP_PATH..."

# 1. Backup Postgres
if docker ps | grep "synthropic_postgres" > /dev/null; then
    echo "Backing up Postgres..."
    docker exec synthropic_postgres pg_dumpall -U postgres > "$BACKUP_PATH/postgres_dump.sql"
    gzip "$BACKUP_PATH/postgres_dump.sql"
else
    echo "Postgres container not running. Skipping DB backup."
fi

# 2. Backup Redis (if standalone, otherwise need specific handling for Swarm)
if docker ps | grep "synthropic_redis" > /dev/null; then
    echo "Backing up Redis dump..."
    # Redis typically saves to /data/dump.rdb. We can copy it out.
    # Force a save first
    docker exec synthropic_redis redis-cli save
    docker cp synthropic_redis:/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"
else
    echo "Redis container not running. Skipping Redis backup."
fi

# 3. Backup .env files (Sensitive!)
echo "Backing up config..."
cp docker/dev/.env.dev "$BACKUP_PATH/env.dev" 2>/dev/null || true
# In prod, we'd export secrets or have them stored securely elsewhere.

# 4. Archive
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_PATH"

echo "Backup complete: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
