#!/bin/bash

COMMAND=$1
SERVICE=$2
ARGS=$3

STACK_NAME="synthropic"

case $COMMAND in
  deploy)
    bash scripts/docker/deploy-swarm.sh
    ;;
  scale)
    if [ -z "$SERVICE" ] || [ -z "$ARGS" ]; then
      echo "Usage: ./prod.sh scale [service] [replicas]"
      exit 1
    fi
    docker service scale "${STACK_NAME}_${SERVICE}=$ARGS"
    ;;
  rollback)
    docker stack deploy --compose-file docker/prod/docker-compose.yml "$STACK_NAME" --rollback
    ;;
  status)
    docker stack ps "$STACK_NAME" --no-trunc
    ;;
  logs)
    if [ -z "$SERVICE" ]; then
      echo "Usage: ./prod.sh logs [service]"
      exit 1
    fi
    docker service logs -f "${STACK_NAME}_${SERVICE}"
    ;;
  backup)
    bash scripts/docker/backup.sh
    ;;
  *)
    echo "Usage: $0 {deploy|scale|rollback|status|logs|backup}"
    exit 1
    ;;
esac
