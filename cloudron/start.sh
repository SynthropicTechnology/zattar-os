#!/bin/bash
set -eu

# =============================================================================
# Cloudron Start Script - Entrypoint do container
# =============================================================================
# Este script faz a ponte entre as variaveis de ambiente do Cloudron e as que
# o app Next.js espera. Tambem prepara diretorios de dados persistentes.
#
# Referencia: https://docs.cloudron.io/packaging/addons
#
# Addons usados:
#   - localstorage: /app/data (persistente, incluido em backups)
#   - redis:        CLOUDRON_REDIS_* -> REDIS_*
#   - sendmail:     CLOUDRON_MAIL_*  -> SYSTEM_SMTP_* / SYSTEM_MAIL_*
# =============================================================================

echo "=> Zattar OS - Cloudron Start"
echo "   Node $(node --version) | $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# =============================================================================
# 1. Preparar diretorios persistentes em /app/data
# =============================================================================
# /app/code e READ-ONLY em runtime. /app/data persiste entre updates.
echo "=> Preparando diretorios em /app/data..."

mkdir -p /app/data/cache/next
mkdir -p /app/data/logs
mkdir -p /app/data/tmp

# Garantir permissoes (cloudron/base roda como cloudron:cloudron)
chown -R cloudron:cloudron /app/data

# =============================================================================
# 2. Mapear variaveis de ambiente do Cloudron -> App
# =============================================================================
echo "=> Mapeando variaveis de ambiente Cloudron..."

# --- Redis (addon: redis) ---
# Docs: CLOUDRON_REDIS_URL, CLOUDRON_REDIS_HOST, CLOUDRON_REDIS_PORT, CLOUDRON_REDIS_PASSWORD
if [ -n "${CLOUDRON_REDIS_URL:-}" ]; then
    export REDIS_URL="${CLOUDRON_REDIS_URL}"
    export ENABLE_REDIS_CACHE="true"
    echo "   [Redis] URL mapeada de CLOUDRON_REDIS_URL"
fi

if [ -n "${CLOUDRON_REDIS_PASSWORD:-}" ]; then
    export REDIS_PASSWORD="${CLOUDRON_REDIS_PASSWORD}"
    echo "   [Redis] Password mapeada de CLOUDRON_REDIS_PASSWORD"
fi

if [ -n "${CLOUDRON_REDIS_HOST:-}" ] && [ -z "${REDIS_URL:-}" ]; then
    # Fallback: construir URL a partir de host/port se CLOUDRON_REDIS_URL nao estiver setada
    REDIS_PORT="${CLOUDRON_REDIS_PORT:-6379}"
    export REDIS_URL="redis://${CLOUDRON_REDIS_HOST}:${REDIS_PORT}"
    export ENABLE_REDIS_CACHE="true"
    echo "   [Redis] URL construida de CLOUDRON_REDIS_HOST:${REDIS_PORT}"
fi

# --- Email / Sendmail (addon: sendmail) ---
# Docs: CLOUDRON_MAIL_SMTP_SERVER, CLOUDRON_MAIL_SMTP_PORT, CLOUDRON_MAIL_SMTPS_PORT,
#       CLOUDRON_MAIL_SMTP_USERNAME, CLOUDRON_MAIL_SMTP_PASSWORD,
#       CLOUDRON_MAIL_FROM, CLOUDRON_MAIL_FROM_DISPLAY_NAME, CLOUDRON_MAIL_DOMAIN
if [ -n "${CLOUDRON_MAIL_SMTP_SERVER:-}" ]; then
    export SYSTEM_SMTP_HOST="${CLOUDRON_MAIL_SMTP_SERVER}"
    export SYSTEM_SMTP_PORT="${CLOUDRON_MAIL_SMTPS_PORT:-${CLOUDRON_MAIL_SMTP_PORT:-587}}"
    export SYSTEM_SMTP_SECURE="true"
    echo "   [Mail] SMTP mapeado: ${CLOUDRON_MAIL_SMTP_SERVER}:${SYSTEM_SMTP_PORT}"
fi

if [ -n "${CLOUDRON_MAIL_SMTP_USERNAME:-}" ]; then
    export SYSTEM_SMTP_USER="${CLOUDRON_MAIL_SMTP_USERNAME}"
fi

if [ -n "${CLOUDRON_MAIL_SMTP_PASSWORD:-}" ]; then
    export SYSTEM_SMTP_PASS="${CLOUDRON_MAIL_SMTP_PASSWORD}"
fi

if [ -n "${CLOUDRON_MAIL_FROM:-}" ]; then
    export SYSTEM_MAIL_FROM="${CLOUDRON_MAIL_FROM}"
    echo "   [Mail] From: ${CLOUDRON_MAIL_FROM}"
fi

if [ -n "${CLOUDRON_MAIL_FROM_DISPLAY_NAME:-}" ]; then
    export SYSTEM_MAIL_DISPLAY_NAME="${CLOUDRON_MAIL_FROM_DISPLAY_NAME}"
fi

if [ -n "${CLOUDRON_MAIL_DOMAIN:-}" ]; then
    export SYSTEM_MAIL_DOMAIN="${CLOUDRON_MAIL_DOMAIN}"
fi

# --- App Info (sempre disponivel no Cloudron) ---
# Docs: CLOUDRON_APP_ORIGIN, CLOUDRON_APP_DOMAIN
if [ -n "${CLOUDRON_APP_ORIGIN:-}" ]; then
    # Setar URL do app para Server Actions e CORS
    export NEXT_PUBLIC_APP_URL="${CLOUDRON_APP_ORIGIN}"
    export APP_URL="${CLOUDRON_APP_ORIGIN}"
    export NEXT_PUBLIC_WEBSITE_URL="${CLOUDRON_APP_ORIGIN}"
    echo "   [App] Origin: ${CLOUDRON_APP_ORIGIN}"
fi

# --- Memoria ---
if [ -n "${CLOUDRON_MEMORY_LIMIT:-}" ]; then
    # Usar 75% do limite para o Node.js, deixando margem para o OS
    NODE_MEM=$(( CLOUDRON_MEMORY_LIMIT * 75 / 100 ))
    export NODE_OPTIONS="--max-old-space-size=${NODE_MEM}"
    echo "   [Memory] Node.js max: ${NODE_MEM}MB (de ${CLOUDRON_MEMORY_LIMIT}MB)"
fi

# =============================================================================
# 3. Configuracoes de runtime
# =============================================================================
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_ENV="production"
export NEXT_TELEMETRY_DISABLED=1

# Diretorio temporario writable
export TMPDIR="/app/data/tmp"

# =============================================================================
# 4. Iniciar Next.js (standalone server)
# =============================================================================
echo "=> Iniciando Next.js standalone na porta ${PORT}..."
echo "============================================================"

exec node server.js
