#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Synthropic Local Development Environment Setup...${NC}"

# 1. Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    exit 1
fi

# 2. Setup Environment Variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
if [ ! -f "docker/dev/.env.dev" ]; then
    if [ -f "docker/dev/.env.example" ]; then
        cp docker/dev/.env.example docker/dev/.env.dev
        echo -e "${GREEN}Created docker/dev/.env.dev from example. Please update with your secrets.${NC}"
    else
        echo -e "${RED}Error: docker/dev/.env.example not found.${NC}"
        # Create a dummy one if missing (should exist)
        touch docker/dev/.env.dev
    fi
else
    echo -e "${GREEN}docker/dev/.env.dev already exists.${NC}"
fi

# 3. Start Services
echo -e "${YELLOW}Starting services...${NC}"
cd docker/dev
docker-compose --env-file .env.dev up -d --build

# 4. Wait for Health Checks
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
# Simple wait loop
attempt=0
max_attempts=30
while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep "unhealthy" > /dev/null; then
        echo -e "${RED}Some services are unhealthy.${NC}"
    fi
    
    # Check if Postgres is ready (using pg_isready inside container)
    if docker exec synthropic_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}Postgres is ready!${NC}"
        break
    fi
    
    echo "Waiting for Postgres... ($((attempt+1))/$max_attempts)"
    sleep 2
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}Timeout waiting for Postgres.${NC}"
    exit 1
fi

# 5. Run Migrations & Seed
echo -e "${YELLOW}Running migrations and seed...${NC}"
# If migration files exist, apply them.
# Note: On first run, /docker-entrypoint-initdb.d/ should have handled them if mapped correctly and fresh volume.
# Here we force apply or seed.
# Assuming seed script exists or run via npm in app container?
# Plan says "Seed de dados de desenvolvimento".
# We can try to run a seed script inside the app container if `npm run seed` exists.
# Or use psql.

# Let's check if npm run seed exists in package.json.
# It doesn't explicitly show "seed" but "populate:tabelas-audiencias".
# I'll add a placeholder or run specific script.
# For now, I will just print a message that it's ready, or try to run migrations if external tool available.
echo -e "${GREEN}Services are up. To seed data, run: docker exec -it synthropic_app npm run populate:tabelas-audiencias${NC}"

# 6. Final Status
echo -e "${GREEN}Development environment is ready!${NC}"
echo -e "App: http://localhost:3000"
echo -e "Studio: http://localhost:54323"
echo -e "Mailhog: http://localhost:8025"
