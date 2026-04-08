#!/usr/bin/env bash
set -euo pipefail

# Build + push da imagem para o Docker Hub (usa buildx).
# Requisitos:
# - Docker Desktop/Engine rodando (docker server acessível)
# - `docker login` já realizado
# - Arquivo .env na raiz do projeto OU variáveis de ambiente configuradas
#
# Uso:
#   ./scripts/docker/dockerhub-build-push.sh
#   DOCKER_IMAGE=minha-org/minha-app ./scripts/docker/dockerhub-build-push.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Carrega .env automaticamente se existir (método seguro para valores com caracteres especiais)
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  echo "📦 Carregando variáveis do .env..."
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Ignora linhas vazias e comentários
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Extrai nome e valor (suporta valores com = dentro)
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      name="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Remove aspas se existirem
      value="${value#\"}"
      value="${value%\"}"
      value="${value#\'}"
      value="${value%\'}"
      export "$name=$value"
    fi
  done < "$PROJECT_ROOT/.env"
  echo "✅ Variáveis carregadas com sucesso"
fi

DOCKER_IMAGE="${DOCKER_IMAGE:-synthropictec/zattar-os}"
# Nota: usuário Docker Hub = synthropictec, repositório = zattar-os
PLATFORM="${PLATFORM:-linux/amd64}"
TAG_SHA="${TAG_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "❌ Error: env var $name is not set" >&2
    exit 1
  fi
}

# Verifica daemon
if ! docker version >/dev/null 2>&1; then
  echo "❌ Error: Docker daemon não está acessível. Abra o Docker Desktop e tente novamente." >&2
  echo "💡 Dica: rode 'docker version' e confirme que aparece a seção 'Server'." >&2
  exit 1
fi

# Variáveis obrigatórias para o build
require_env NEXT_PUBLIC_SUPABASE_URL
require_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Garante que buildx está pronto
if ! docker buildx inspect >/dev/null 2>&1; then
  echo "🔧 Configurando docker buildx..."
  docker buildx create --use >/dev/null
fi

echo ""
echo "🐳 Build Configuration:"
echo "   Image: ${DOCKER_IMAGE}:latest"
echo "   Tag:   ${DOCKER_IMAGE}:${TAG_SHA}"
echo "   Platform: ${PLATFORM}"
echo ""
echo "🔑 Build Args (NEXT_PUBLIC_*):"
echo "   SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:40}..."
echo ""
echo "🚀 Starting build and push..."
echo ""

docker buildx build \
  --platform "${PLATFORM}" \
  --push \
  -t "${DOCKER_IMAGE}:latest" \
  -t "${DOCKER_IMAGE}:${TAG_SHA}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}" \
  .

echo ""
echo "✅ Push concluído com sucesso!"
echo "   docker pull ${DOCKER_IMAGE}:latest"
echo "   docker pull ${DOCKER_IMAGE}:${TAG_SHA}"
