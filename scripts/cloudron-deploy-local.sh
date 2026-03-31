#!/bin/bash
set -e

# =============================================================================
# Cloudron Deploy (Build Local) - Build local + Push Registry + Update + Env Set
# =============================================================================
# Uso:
#   ./scripts/cloudron-deploy-local.sh                  # Build + Push + Update + Env Set
#   ./scripts/cloudron-deploy-local.sh --skip-build     # Update + Env Set
#   ./scripts/cloudron-deploy-local.sh --env-only       # Apenas Env Set
#   ./scripts/cloudron-deploy-local.sh --no-cache       # Build sem cache Docker
#
# Alternativa ao cloudron-deploy.sh quando o Build Service remoto nao tem
# memoria suficiente. Faz o build Docker localmente e envia a imagem para
# o registry do Cloudron.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# -----------------------------------------------------------------------------
# Configuracao
# -----------------------------------------------------------------------------
DOCKERFILE="Dockerfile.cloudron"
ENV_FILE="${PROJECT_DIR}/.env.local"
ENV_PRODUCTION="${PROJECT_DIR}/.env.production"
REGISTRY="registry.sinesys.online"
IMAGE_NAME="zattar-os"

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
            echo "  --no-cache       Build sem cache Docker"
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

# Gerar tag com timestamp + git short hash (mesmo padrao do cloudron build)
GIT_SHA="$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
TAG="$(date +%Y%m%d-%H%M%S)-${GIT_SHA}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo ""
echo -e "${BOLD}Zattar OS - Cloudron Deploy (Build Local)${NC}"
echo "============================================================"
echo -e "  Build:     $([ "$SKIP_BUILD" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}docker build (local)${NC}")"
echo -e "  Push:      $([ "$SKIP_BUILD" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}docker push -> ${REGISTRY}${NC}")"
echo -e "  Update:    $([ "$SKIP_UPDATE" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}cloudron update${NC}")"
echo -e "  Env set:   ${GREEN}cloudron env set${NC}"
echo -e "  Image:     ${CYAN}${FULL_IMAGE}${NC}"
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

if [ "$SKIP_BUILD" = false ] && ! command -v docker &> /dev/null; then
    error "Docker nao encontrado! Instale Docker Desktop."
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
# STEP 1: Docker Build (local)
# =============================================================================
if [ "$SKIP_BUILD" = false ]; then
    header "STEP 1/4: Docker Build (local)"
    echo ""

    cd "$PROJECT_DIR"

    # Verificar memoria do Docker (minimo 10 GB recomendado para este build)
    DOCKER_MEM_MB=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{printf "%d", $1/1048576}')
    if [ -n "$DOCKER_MEM_MB" ] && [ "$DOCKER_MEM_MB" -lt 10000 ] 2>/dev/null; then
        warn "Docker com ${DOCKER_MEM_MB} MB de RAM. Recomendado: 12 GB+"
        warn "Ajuste em: Docker Desktop > Settings > Resources > Memory"
        echo ""
    fi

    # --platform linux/amd64: Cloudron roda em amd64
    docker build --platform linux/amd64 ${NO_CACHE} -f "$DOCKERFILE" -t "$FULL_IMAGE" .

    success "Build local concluido!"

    # =========================================================================
    # STEP 2: Docker Push (para registry do Cloudron)
    # =========================================================================
    header "STEP 2/4: Docker Push -> ${REGISTRY}"
    echo ""

    docker push "$FULL_IMAGE"

    success "Push concluido!"
else
    header "STEP 1/4: Build (pulado)"
    header "STEP 2/4: Push (pulado)"
fi

# =============================================================================
# STEP 3: Cloudron Update
# =============================================================================
if [ "$SKIP_UPDATE" = false ]; then
    header "STEP 3/4: Cloudron Update"
    echo ""

    if [ "$SKIP_BUILD" = false ]; then
        cloudron update --image "$FULL_IMAGE"
    else
        cloudron update
    fi

    success "Update concluido!"
else
    header "STEP 3/4: Update (pulado)"
fi

# =============================================================================
# STEP 4: Cloudron Env Set
# =============================================================================
header "STEP 4/4: Cloudron Env Set"
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
echo -e "   Imagem: ${CYAN}${FULL_IMAGE}${NC}"
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
