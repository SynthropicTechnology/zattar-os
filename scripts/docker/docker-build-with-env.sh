#!/bin/bash
set -e

# =============================================================================
# Script para Build Docker com Variáveis de Ambiente
# =============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="${SCRIPT_DIR}/.env.build"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🐳 Docker Build com Variáveis de Ambiente"
echo "=========================================="
echo ""

# Verificar se arquivo .env.build existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo .env.build não encontrado!${NC}"
    echo ""
    echo "Crie o arquivo .env.build com as variáveis NEXT_PUBLIC_*:"
    echo ""
    cat <<EOF
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
EOF
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Arquivo .env.build encontrado${NC}"
echo ""

# Carregar variáveis
set -a
source "$ENV_FILE"
set +a

# Verificar variáveis obrigatórias
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variáveis obrigatórias faltando:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Todas as variáveis obrigatórias configuradas${NC}"
echo ""

# Construir argumentos de build
BUILD_ARGS=""
for var in "${REQUIRED_VARS[@]}"; do
    BUILD_ARGS="$BUILD_ARGS --build-arg $var=${!var}"
done

echo ""
echo "🔨 Iniciando build..."
echo ""

# Executar build
docker build --platform linux/amd64 \
    --no-cache \
    $BUILD_ARGS \
    -t synthropictec/synthropic:latest \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
    echo ""
    
    # Perguntar se deseja fazer push
    read -p "Deseja fazer push para Docker Hub? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📤 Fazendo push para Docker Hub..."
        docker push synthropictec/synthropic:latest
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Push concluído com sucesso!${NC}"
            echo ""
            echo "Próximos passos:"
            echo "1. Acesse o CapRover"
            echo "2. Configure as variáveis runtime (SUPABASE_SECRET_KEY, etc.)"
            echo "3. Faça deploy da imagem synthropictec/synthropic:latest"
        else
            echo -e "${RED}❌ Erro ao fazer push${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi
