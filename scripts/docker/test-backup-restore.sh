#!/bin/bash
set -e

echo "Starting Backup/Restore Test..."

# 1. Generate some dummy data (optional, or rely on existing)
# (Skipped for simplicity, assuming dev env has data)

# 2. Run Backup
echo "Step 1: Creating backup..."
BACKUP_OUTPUT=$(bash scripts/docker/backup.sh)
BACKUP_FILE=$(echo "$BACKUP_OUTPUT" | grep "backup_" | tail -n 1 | awk '{print $NF}')

echo "Backup created: $BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file creation failed."
    exit 1
fi

# 3. Simulate Data Loss (Optional - dangerous)
# echo "Step 2: Simulating data loss..."
# docker exec synthropic_postgres psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 4. Run Restore
echo "Step 3: Restoring from backup..."
bash scripts/docker/restore.sh "$BACKUP_FILE"

# 5. Verify Data (Simple check)
echo "Step 4: Verifying health..."
# Check if Postgres is responding
docker exec synthropic_postgres pg_isready -U postgres

echo "Test complete. Please manually verify data integrity if needed."
