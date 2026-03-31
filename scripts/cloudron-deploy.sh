#!/bin/bash
set -e

# =============================================================================
# Cloudron Deploy - Build (remoto), Update e Env Set
# =============================================================================
# Uso:
#   ./scripts/cloudron-deploy.sh                  # Build + Update + Env Set
#   ./scripts/cloudron-deploy.sh --skip-build     # Update + Env Set
#   ./scripts/cloudron-deploy.sh --env-only       # Apenas Env Set
#   ./scripts/cloudron-deploy.sh --no-cache       # Build sem cache
#
# Variaveis NEXT_PUBLIC_* sao lidas do .env.production pelo Next.js no build.
# Variaveis de runtime sao lidas do .env.local e setadas via cloudron env set.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# -----------------------------------------------------------------------------
# Configuracao
# -----------------------------------------------------------------------------
DOCKERFILE="Dockerfile.cloudron"
ENV_FILE="${PROJECT_DIR}/.env.local"
ENV_PRODUCTION="${PROJECT_DIR}/.env.production"

# Variaveis providas automaticamente pelos addons do Cloudron (nao setar)
# Redis: mapeadas pelo start.sh de CLOUDRON_REDIS_* -> REDIS_*
# Mail:  mapeadas pelo start.sh de CLOUDRON_MAIL_*  -> SYSTEM_SMTP_* / SYSTEM_MAIL_*
ADDON_VARS="ENABLE_REDIS_CACHE REDIS_URL REDIS_PASSWORD SYSTEM_SMTP_HOST SYSTEM_SMTP_PORT SYSTEM_SMTP_USER SYSTEM_SMTP_PASS SYSTEM_SMTP_SECURE SYSTEM_MAIL_FROM SYSTEM_MAIL_DISPLAY_NAME SYSTEM_MAIL_DOMAIN"

# Variaveis que nao fazem sentido em runtime
SKIP_VARS="PUPPETEER_SKIP_DOWNLOAD PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD"

# Variaveis que sao apenas de build (ja estao no .env.production)
BUILD_ONLY_VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"

# -----------------------------------------------------------------------------
# Cores
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Parse de argumentos
# -----------------------------------------------------------------------------
SKIP_BUILD=false
SKIP_UPDATE=false
ENV_ONLY=false
NO_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)   SKIP_BUILD=true; shift ;;
        --skip-update)  SKIP_UPDATE=true; shift ;;
        --env-only)     ENV_ONLY=true; SKIP_BUILD=true; SKIP_UPDATE=true; shift ;;
        --no-cache)     NO_CACHE="--no-cache"; shift ;;
        --help|-h)
            echo "Uso: $0 [opcoes]"
            echo ""
            echo "Opcoes:"
            echo "  --skip-build     Pula o build (faz update + env set)"
            echo "  --skip-update    Pula o update (faz build + env set)"
            echo "  --env-only       Apenas seta as variaveis de ambiente"
            echo "  --no-cache       Build sem cache"
            echo "  --help           Mostra esta ajuda"
            exit 0
            ;;
        *)
            echo -e "${RED}Opcao desconhecida: $1${NC}"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Funcoes auxiliares
# -----------------------------------------------------------------------------
header() {
    echo ""
    echo -e "${CYAN}${BOLD}=> $1${NC}"
    echo -e "${CYAN}$(printf '%.0s-' {1..60})${NC}"
}

success() { echo -e "${GREEN}   $1${NC}"; }
warn()    { echo -e "${YELLOW}   $1${NC}"; }
error()   { echo -e "${RED}   $1${NC}"; }

is_skipped() {
    local var="$1"
    for skip in $ADDON_VARS $SKIP_VARS $BUILD_ONLY_VARS; do
        [ "$var" = "$skip" ] && return 0
    done
    return 1
}

parse_env_file() {
    local file="$1"
    while IFS= read -r line || [ -n "$line" ]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            value="${value#\"}" ; value="${value%\"}"
            value="${value#\'}" ; value="${value%\'}"
            [ -n "$value" ] && echo "${key}=${value}"
        fi
    done < "$file"
}

# =============================================================================
# INICIO
# =============================================================================
echo ""
echo -e "${BOLD}Zattar OS - Cloudron Deploy${NC}"
echo "============================================================"
echo -e "  Build:     $([ "$SKIP_BUILD" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}cloudron build${NC}")"
echo -e "  Update:    $([ "$SKIP_UPDATE" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}cloudron update${NC}")"
echo -e "  Env set:   ${GREEN}cloudron env set${NC}"
echo "============================================================"

# Verificar pre-requisitos
if [ ! -f "$ENV_FILE" ]; then
    error "Arquivo .env.local nao encontrado!"
    exit 1
fi

if ! command -v cloudron &> /dev/null; then
    error "Cloudron CLI nao encontrado! Instale com: npm install -g cloudron"
    exit 1
fi

# Verificar .env.production (necessario para build)
if [ "$SKIP_BUILD" = false ] && [ ! -f "$ENV_PRODUCTION" ]; then
    error ".env.production nao encontrado!"
    error "Este arquivo contem NEXT_PUBLIC_* e eh lido pelo Next.js no build."
    error "Crie com: grep '^NEXT_PUBLIC_' .env.local > .env.production"
    exit 1
fi

# Carregar variaveis de runtime do .env.local (excluindo addon, build-only e skip)
declare -a RUNTIME_ENVS
RUNTIME_COUNT=0

while IFS='=' read -r key value; do
    if is_skipped "$key"; then
        continue
    fi
    RUNTIME_ENVS+=("${key}=${value}")
    RUNTIME_COUNT=$((RUNTIME_COUNT + 1))
done < <(parse_env_file "$ENV_FILE")

success "${RUNTIME_COUNT} variaveis de runtime carregadas do .env.local"

# =============================================================================
# STEP 1: Cloudron Build
# =============================================================================
if [ "$SKIP_BUILD" = false ]; then
    header "STEP 1/3: Cloudron Build"
    echo ""

    cd "$PROJECT_DIR"
    cloudron build build -f "$DOCKERFILE" ${NO_CACHE}

    success "Build concluido!"
else
    header "STEP 1/3: Build (pulado)"
fi

# =============================================================================
# STEP 2: Cloudron Update
# =============================================================================
if [ "$SKIP_UPDATE" = false ]; then
    header "STEP 2/3: Cloudron Update"
    echo ""

    cloudron update

    success "Update concluido!"
else
    header "STEP 2/3: Update (pulado)"
fi

# =============================================================================
# STEP 3: Cloudron Env Set
# =============================================================================
header "STEP 3/3: Cloudron Env Set"
echo "   Setando ${RUNTIME_COUNT} variaveis de runtime..."
echo ""

cloudron env set "${RUNTIME_ENVS[@]}"

success "Variaveis de ambiente configuradas!"

# =============================================================================
# RESULTADO
# =============================================================================
echo ""
echo "============================================================"
echo -e "${GREEN}${BOLD}   Deploy concluido!${NC}"
echo "============================================================"
echo ""
echo "   Automatico (Cloudron addons -> mapeado pelo start.sh):"
echo "     - CLOUDRON_REDIS_* -> REDIS_URL, REDIS_PASSWORD, ENABLE_REDIS_CACHE"
echo "     - CLOUDRON_MAIL_*  -> SYSTEM_SMTP_*, SYSTEM_MAIL_*"
echo ""
echo "   Build time (via .env.production):"
echo "     - NEXT_PUBLIC_SUPABASE_URL"
echo "     - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
echo ""
echo "   cloudron logs -f"
echo ""
