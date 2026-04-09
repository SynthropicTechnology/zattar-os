#!/bin/bash
set -e

# =============================================================================
# Cloudron Deploy - Build (remoto via Build Service), Update e Env Set
# =============================================================================
# Uso:
#   ./scripts/cloudron-deploy.sh                  # Build + Update + Env Set
#   ./scripts/cloudron-deploy.sh --skip-build     # Update + Env Set
#   ./scripts/cloudron-deploy.sh --env-only       # Apenas Env Set
#   ./scripts/cloudron-deploy.sh --dry-run        # Simula sem executar
#
# O script configura automaticamente o Build Service e o repository em
# ~/.cloudron.json antes de buildar, garantindo que opere no servidor
# correto mesmo que o CLI esteja configurado para outra instancia.
#
# Variaveis NEXT_PUBLIC_* sao lidas do .env.production pelo Next.js no build.
# Variaveis de runtime sao lidas do .env.local e setadas via cloudron env set.
#
# Ref: https://docs.cloudron.io/packaging/cli
#      https://docs.cloudron.io/packages/docker-builder
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# -----------------------------------------------------------------------------
# Configuracao
# -----------------------------------------------------------------------------
ENV_FILE="${PROJECT_DIR}/.env.local"
ENV_PRODUCTION="${PROJECT_DIR}/.env.production"
CLOUDRON_APP="zattaradvogados.com"
REGISTRY="registry.sinesys.online"
IMAGE_NAME="zattar-os"
DOCKER_REPOSITORY="${REGISTRY}/${IMAGE_NAME}"

# Build Service remoto (configurado automaticamente em ~/.cloudron.json)
BUILD_SERVICE_URL="https://builder.sinesys.online"
BUILD_SERVICE_TOKEN="bde253a143ffa41cbe512632df128fc87f59029953c26333"

# Autenticacao CI/CD (via env vars ou flags)
# --server recebe dominio sem protocolo (ref: docs.cloudron.io/packaging/cli)
CLOUDRON_SERVER="${CLOUDRON_SERVER:-my.sinesys.online}"
CLOUDRON_TOKEN="${CLOUDRON_TOKEN:-}"

# Variaveis providas automaticamente pelos addons do Cloudron (nao setar)
ADDON_VARS="ENABLE_REDIS_CACHE REDIS_URL REDIS_PASSWORD SYSTEM_SMTP_HOST SYSTEM_SMTP_PORT SYSTEM_SMTP_USER SYSTEM_SMTP_PASS SYSTEM_SMTP_SECURE SYSTEM_MAIL_FROM SYSTEM_MAIL_DISPLAY_NAME SYSTEM_MAIL_DOMAIN"

# Variaveis que nao fazem sentido em runtime
SKIP_VARS="PUPPETEER_SKIP_DOWNLOAD PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD"

# Variaveis que sao apenas de build (ja estao no .env.production)
BUILD_ONLY_VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"

# Caminho do config do Cloudron CLI
CLOUDRON_CONFIG="$HOME/.cloudron.json"

# -----------------------------------------------------------------------------
# Cores
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Parse de argumentos
# -----------------------------------------------------------------------------
SKIP_BUILD=false
SKIP_UPDATE=false
ENV_ONLY=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)     SKIP_BUILD=true; shift ;;
        --skip-update)    SKIP_UPDATE=true; shift ;;
        --env-only)       ENV_ONLY=true; SKIP_BUILD=true; SKIP_UPDATE=true; shift ;;
        --dry-run)        DRY_RUN=true; shift ;;
        --server)         CLOUDRON_SERVER="$2"; shift 2 ;;
        --token)          CLOUDRON_TOKEN="$2"; shift 2 ;;
        --help|-h)
            echo "Uso: $0 [opcoes]"
            echo ""
            echo "Opcoes:"
            echo "  --skip-build       Pula o build (faz update + env set)"
            echo "  --skip-update      Pula o update (faz build + env set)"
            echo "  --env-only         Apenas seta as variaveis de ambiente"
            echo "  --dry-run          Simula sem executar"
            echo "  --server <domain>  Cloudron server domain (ou env CLOUDRON_SERVER)"
            echo "  --token <token>    Cloudron token (ou env CLOUDRON_TOKEN)"
            echo "  --help             Mostra esta ajuda"
            echo ""
            echo "CI/CD (nao-interativo):"
            echo "  CLOUDRON_SERVER=my.sinesys.online CLOUDRON_TOKEN=xxx $0"
            echo ""
            echo "NOTA: Se o build remoto falhar por memoria, use:"
            echo "  ./scripts/cloudron-deploy-local.sh"
            exit 0
            ;;
        *)
            echo -e "${RED}Opcao desconhecida: $1${NC}"
            exit 1
            ;;
    esac
done

# Montar flags globais do Cloudron CLI para autenticacao
# --server e sempre passado para garantir que operamos no Cloudron correto
CLOUDRON_AUTH_FLAGS="--server ${CLOUDRON_SERVER}"
if [ -n "$CLOUDRON_TOKEN" ]; then
    CLOUDRON_AUTH_FLAGS="${CLOUDRON_AUTH_FLAGS} --token ${CLOUDRON_TOKEN}"
fi

# -----------------------------------------------------------------------------
# Funcoes auxiliares
# -----------------------------------------------------------------------------
header() {
    echo ""
    echo -e "${CYAN}${BOLD}=> $1${NC}"
    echo -e "${CYAN}$(printf '%.0s-' {1..60})${NC}"
}

success() { echo -e "${GREEN}   ✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}   ⚠ $1${NC}"; }
error()   { echo -e "${RED}   ✗ $1${NC}"; }
info()    { echo -e "${DIM}   $1${NC}"; }

run() {
    if [ "$DRY_RUN" = true ]; then
        local cmd_display="$*"
        if [[ "$cmd_display" == *"env set"* ]]; then
            local keys
            keys=$(echo "$cmd_display" | grep -oE '[A-Z_]+=' | tr '\n' ' ')
            echo -e "${YELLOW}   [dry-run] cloudron env set --app ${CLOUDRON_APP} ${keys}(${RUNTIME_COUNT} vars)${NC}"
        else
            echo -e "${YELLOW}   [dry-run] ${cmd_display}${NC}"
        fi
        return 0
    fi
    "$@"
}

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

wait_for_health() {
    local app="$1"
    local max_attempts=12
    local attempt=0

    echo ""
    info "Aguardando health check (ate ${max_attempts}x10s)..."

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        local state
        # shellcheck disable=SC2086
        state=$(cloudron status --app "$app" $CLOUDRON_AUTH_FLAGS 2>/dev/null | grep "Run state:" | awk '{print $NF}')

        if [ "$state" = "running" ]; then
            success "App running e healthy! (tentativa ${attempt}/${max_attempts})"
            return 0
        fi

        info "  [${attempt}/${max_attempts}] Estado: ${state:-desconhecido}..."
        sleep 10
    done

    error "Health check nao passou em $((max_attempts * 10))s!"
    warn "Verifique: cloudron logs -f --app ${app}"
    return 1
}

# Configura o Build Service e o repository no ~/.cloudron.json automaticamente.
# Isso garante que o build remoto use o builder correto (builder.sinesys.online),
# mesmo que o CLI tenha sido usado com outro servidor (ex: allhands) recentemente.
configure_build_service() {
    if ! command -v jq &> /dev/null; then
        error "jq nao encontrado! Instale com: brew install jq"
        return 1
    fi

    if [ ! -f "$CLOUDRON_CONFIG" ]; then
        error "~/.cloudron.json nao existe. Execute: cloudron login ${CLOUDRON_SERVER}"
        return 1
    fi

    local current_builder
    current_builder=$(jq -r '.buildService.url // ""' "$CLOUDRON_CONFIG" 2>/dev/null)
    local current_repo
    current_repo=$(jq -r --arg dir "$PROJECT_DIR" '.apps[$dir].repository // ""' "$CLOUDRON_CONFIG" 2>/dev/null)

    local changed=false

    # Corrigir Build Service URL se necessario
    if [ "$current_builder" != "$BUILD_SERVICE_URL" ]; then
        jq --arg url "$BUILD_SERVICE_URL" --arg token "$BUILD_SERVICE_TOKEN" \
            '.buildService = {"type": "remote", "url": $url, "token": $token}' \
            "$CLOUDRON_CONFIG" > "${CLOUDRON_CONFIG}.tmp" && mv "${CLOUDRON_CONFIG}.tmp" "$CLOUDRON_CONFIG"
        changed=true
        warn "Build Service atualizado: ${current_builder:-nenhum} -> ${BUILD_SERVICE_URL}"
    else
        success "Build Service: ${BUILD_SERVICE_URL}"
    fi

    # Corrigir repository do app se necessario
    if [ "$current_repo" != "$DOCKER_REPOSITORY" ]; then
        jq --arg dir "$PROJECT_DIR" --arg repo "$DOCKER_REPOSITORY" \
            '.apps[$dir].repository = $repo' \
            "$CLOUDRON_CONFIG" > "${CLOUDRON_CONFIG}.tmp" && mv "${CLOUDRON_CONFIG}.tmp" "$CLOUDRON_CONFIG"
        changed=true
        warn "Repository atualizado: ${current_repo:-nenhum} -> ${DOCKER_REPOSITORY}"
    else
        success "Repository: ${DOCKER_REPOSITORY}"
    fi

    if [ "$changed" = true ]; then
        info "~/.cloudron.json atualizado automaticamente"
    fi

    return 0
}

# =============================================================================
# INICIO
# =============================================================================
GIT_SHA="$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

echo ""
echo -e "${BOLD}Zattar OS - Cloudron Deploy (Build Remoto)${NC}"
echo "============================================================"
echo -e "  Git:       ${DIM}${GIT_SHA}${NC}"
echo -e "  Server:    ${CYAN}${CLOUDRON_SERVER}${NC}"
echo -e "  Registry:  ${CYAN}${DOCKER_REPOSITORY}${NC}"
echo -e "  Builder:   ${CYAN}${BUILD_SERVICE_URL}${NC}"
echo -e "  Build:     $([ "$SKIP_BUILD" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}cloudron build (remoto)${NC}")"
echo -e "  Update:    $([ "$SKIP_UPDATE" = true ] && echo -e "${YELLOW}skip${NC}" || echo -e "${GREEN}cloudron update${NC}")"
echo -e "  Env set:   ${GREEN}cloudron env set${NC}"
echo -e "  Auth:      $([ -n "$CLOUDRON_TOKEN" ] && echo -e "${GREEN}token (CI/CD)${NC}" || echo -e "${DIM}login local${NC}")"
[ "$DRY_RUN" = true ] && echo -e "  Modo:      ${YELLOW}DRY RUN (sem execucao real)${NC}"
echo "============================================================"

# =============================================================================
# PRE-REQUISITOS
# =============================================================================
header "Verificando pre-requisitos"

PREREQ_OK=true

if [ ! -f "$ENV_FILE" ]; then
    error "Arquivo .env.local nao encontrado!"
    PREREQ_OK=false
else
    success ".env.local encontrado"
fi

if ! command -v cloudron &> /dev/null; then
    error "Cloudron CLI nao encontrado! Instale com: npm install -g cloudron"
    PREREQ_OK=false
else
    success "Cloudron CLI $(cloudron --version 2>/dev/null)"
fi

if [ "$SKIP_BUILD" = false ] && [ ! -f "$ENV_PRODUCTION" ]; then
    error ".env.production nao encontrado!"
    error "Crie com: grep '^NEXT_PUBLIC_' .env.local > .env.production"
    PREREQ_OK=false
else
    [ "$SKIP_BUILD" = false ] && success ".env.production encontrado"
fi

# Configurar Build Service automaticamente (corrige builder e repository)
if [ "$SKIP_BUILD" = false ]; then
    if ! configure_build_service; then
        PREREQ_OK=false
    fi
fi

if [ "$PREREQ_OK" = false ]; then
    echo ""
    error "Pre-requisitos nao atendidos. Abortando."
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

success "${RUNTIME_COUNT} variaveis de runtime carregadas"

# =============================================================================
# STEP 1: Cloudron Build (remoto via Build Service)
# =============================================================================
if [ "$SKIP_BUILD" = false ]; then
    header "STEP 1/3: Cloudron Build (remoto)"
    BUILD_START=$(date +%s)

    cd "$PROJECT_DIR"

    # cloudron build le "Dockerfile" do diretorio atual (nao aceita -f).
    # Como o projeto usa Dockerfile.cloudron, criamos um symlink temporario.
    CREATED_SYMLINK=false
    if [ ! -f "Dockerfile" ] && [ -f "Dockerfile.cloudron" ]; then
        ln -s Dockerfile.cloudron Dockerfile
        CREATED_SYMLINK=true
        info "Symlink temporario: Dockerfile -> Dockerfile.cloudron"
    fi

    # Cleanup do symlink em caso de erro (trap)
    cleanup_symlink() {
        if [ "$CREATED_SYMLINK" = true ] && [ -L "Dockerfile" ]; then
            rm -f Dockerfile
        fi
    }
    trap cleanup_symlink EXIT

    # cloudron build: usa o Build Service configurado em ~/.cloudron.json
    # --repository: define o registry/imagem (salvo para builds futuros)
    # Ref: https://docs.cloudron.io/packages/docker-builder
    run cloudron build --repository "$DOCKER_REPOSITORY"

    # Limpar symlink temporario
    cleanup_symlink
    trap - EXIT

    BUILD_END=$(date +%s)
    BUILD_DURATION=$(( BUILD_END - BUILD_START ))

    if [ "$DRY_RUN" = false ]; then
        success "Build remoto concluido em ${BUILD_DURATION}s"
    fi
else
    header "STEP 1/3: Build (pulado)"
fi

# =============================================================================
# STEP 2: Cloudron Update
# =============================================================================
if [ "$SKIP_UPDATE" = false ]; then
    header "STEP 2/3: Cloudron Update"

    # cloudron update: usa a ultima imagem buildada (salva pelo cloudron build)
    # --server: garante operacao no Cloudron correto
    # Ref: https://docs.cloudron.io/packaging/cli
    # shellcheck disable=SC2086
    run cloudron update --app "$CLOUDRON_APP" $CLOUDRON_AUTH_FLAGS

    success "Update concluido!"

    # Esperar health check
    if [ "$DRY_RUN" = false ]; then
        wait_for_health "$CLOUDRON_APP"
    fi
else
    header "STEP 2/3: Update (pulado)"
fi

# =============================================================================
# STEP 3: Cloudron Env Set
# =============================================================================
header "STEP 3/3: Cloudron Env Set"
info "Setando ${RUNTIME_COUNT} variaveis de runtime..."

# shellcheck disable=SC2086
run cloudron env set --app "$CLOUDRON_APP" $CLOUDRON_AUTH_FLAGS "${RUNTIME_ENVS[@]}"

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
echo "   Comandos uteis:"
echo "     cloudron logs -f --app ${CLOUDRON_APP}"
echo "     cloudron status --app ${CLOUDRON_APP}"
echo ""
