#!/bin/bash
set -u

echo "=> Zattar OS - Cloudron Startup"
echo "=> $(date)"

# ============================================================================
# MAPEAMENTO DE VARIÁVEIS: Cloudron Addons -> App Environment
# ============================================================================

# --------------------------------------------------------------------------
# REDIS (Cloudron Addon -> App Config)
# --------------------------------------------------------------------------
if [ -n "${CLOUDRON_REDIS_URL:-}" ]; then
    export ENABLE_REDIS_CACHE="true"
    export REDIS_URL="${CLOUDRON_REDIS_URL}"
    export REDIS_PASSWORD="${CLOUDRON_REDIS_PASSWORD:-}"
    export REDIS_CACHE_TTL="${REDIS_CACHE_TTL:-600}"
    export REDIS_CACHE_MAX_MEMORY="${REDIS_CACHE_MAX_MEMORY:-256mb}"
    echo "=> Redis: habilitado via Cloudron addon"
else
    echo "=> Redis: nao disponivel (addon nao configurado)"
fi

# --------------------------------------------------------------------------
# EMAIL / SENDMAIL (Cloudron Addon -> App Config)
# --------------------------------------------------------------------------
if [ -n "${CLOUDRON_MAIL_SMTP_SERVER:-}" ]; then
    export SYSTEM_SMTP_HOST="${CLOUDRON_MAIL_SMTP_SERVER}"
    export SYSTEM_SMTP_PORT="${CLOUDRON_MAIL_SMTP_PORT}"
    export SYSTEM_SMTP_USER="${CLOUDRON_MAIL_SMTP_USERNAME:-}"
    export SYSTEM_SMTP_PASS="${CLOUDRON_MAIL_SMTP_PASSWORD:-}"
    export SYSTEM_MAIL_FROM="${CLOUDRON_MAIL_FROM:-noreply@${CLOUDRON_MAIL_DOMAIN:-localhost}}"
    export SYSTEM_MAIL_DISPLAY_NAME="${CLOUDRON_MAIL_FROM_DISPLAY_NAME:-Zattar OS}"
    echo "=> Email: configurado via Cloudron sendmail addon"
else
    echo "=> Email: sem addon sendmail (usando config do banco de dados)"
fi

# --------------------------------------------------------------------------
# APLICAÇÃO - Configurações de Runtime
# --------------------------------------------------------------------------
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED=1
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

# --------------------------------------------------------------------------
# STORAGE PERSISTENTE (/app/data)
# --------------------------------------------------------------------------
# O Cloudron garante que /app/data persiste entre updates e é incluído
# nos backups automáticos.
# NOTA: /app/code é read-only no Cloudron, entao nao podemos criar symlinks.
# --------------------------------------------------------------------------
mkdir -p /app/data/cache
mkdir -p /app/data/uploads
mkdir -p /app/data/logs

# --------------------------------------------------------------------------
# INFORMAÇÕES DO AMBIENTE
# --------------------------------------------------------------------------
echo "=> App URL: ${CLOUDRON_APP_ORIGIN:-http://localhost:3000}"
echo "=> Node.js: $(node --version)"
echo "=> Memory limit: ${CLOUDRON_MEMORY_LIMIT:-unknown}MB"
echo "=> Iniciando supervisor..."

# Iniciar via supervisor (gerencia restart automático e logs)
exec /usr/bin/supervisord --configuration /etc/supervisor/supervisord.conf --nodaemon
