#!/bin/bash
set -e

STACK_NAME="synthropic"
COMPOSE_FILE="docker/prod/docker-compose.yml"

echo "Deploying Synthropic to Docker Swarm..."

# 1. Initialize Swarm if needed
if ! docker info | grep -q "Swarm: active"; then
    echo "Initializing Docker Swarm..."
    docker swarm init
fi

# 2. Setup Secrets (External)
create_secret_if_missing() {
    local secret_name=$1
    if ! docker secret ls | grep -q "$secret_name"; then
        echo "Creating secret: $secret_name"
        # Generate random password if not provided
        openssl rand -base64 12 | docker secret create "$secret_name" -
    else
        echo "Secret $secret_name already exists."
    fi
}

create_secret_if_missing "db_password"
create_secret_if_missing "redis_password"

# 3. Deploy Stack
if [ -f "$COMPOSE_FILE" ]; then
    echo "Deploying stack '$STACK_NAME' from $COMPOSE_FILE..."
    docker stack deploy -c "$COMPOSE_FILE" "$STACK_NAME"
else
    echo "Error: Compose file $COMPOSE_FILE not found."
    exit 1
fi

# 4. Check Status
echo "Waiting for services to converge..."
sleep 10
docker stack ps "$STACK_NAME" --no-trunc

echo "Deploy command sent. Monitor status with: docker stack ps $STACK_NAME"
