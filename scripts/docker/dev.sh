#!/bin/bash

COMMAND=$1
SERVICE=$2

case $COMMAND in
  start)
    bash scripts/docker/init-dev.sh
    ;;
  stop)
    cd docker/dev && docker-compose down
    ;;
  restart)
    cd docker/dev && docker-compose restart $SERVICE
    ;;
  logs)
    cd docker/dev && docker-compose logs -f $SERVICE
    ;;
  shell)
    if [ -z "$SERVICE" ]; then
      echo "Usage: ./dev.sh shell [service]"
      exit 1
    fi
    docker exec -it "synthropic_$SERVICE" sh
    ;;
  migrate)
    cd docker/dev
    # Try supabase CLI if available, else warn
    echo "Running migrations..."
    # Placeholder for migration command
    docker exec -it synthropic_app npm run migrate || echo "Migration command failed or not found."
    ;;
  seed)
    docker exec -it synthropic_app npm run populate:tabelas-audiencias
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|shell|migrate|seed}"
    exit 1
    ;;
esac
