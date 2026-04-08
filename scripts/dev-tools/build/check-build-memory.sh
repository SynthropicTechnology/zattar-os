#!/bin/bash
# Script de verificação de memória para build do Synthropic
# Uso: bash scripts/check-build-memory.sh [--skip-check] [--min-memory=4] [--log-file=path]

# Cores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Valores padrão
MIN_MEMORY_GB=4
SKIP_CHECK=false
LOG_FILE=""

# Detectar disponibilidade do utilitário 'bc'
HAS_BC=true
if ! command -v bc >/dev/null 2>&1; then
    HAS_BC=false
fi

# Função para converter KB para GB
kb_to_gb() {
    local kb="$1"
    if [[ "$HAS_BC" == true ]]; then
        echo "scale=2; $kb / 1024 / 1024" | bc 2>/dev/null || printf "0.00"
    else
        awk -v v="$kb" 'BEGIN { printf "%.2f", (v/1024/1024) }'
    fi
}

# Função para converter bytes para GB
bytes_to_gb() {
    local bytes="$1"
    if [[ "$HAS_BC" == true ]]; then
        echo "scale=2; $bytes / 1024 / 1024 / 1024" | bc 2>/dev/null || printf "0.00"
    else
        awk -v v="$bytes" 'BEGIN { printf "%.2f", (v/1024/1024/1024) }'
    fi
}

# Função para logar
log() {
    local message="$1"
    echo "$message"
    if [[ -n "$LOG_FILE" ]]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$LOG_FILE"
    fi
}

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-check)
            SKIP_CHECK=true
            shift
            ;;
        --min-memory=*)
            MIN_MEMORY_GB="${1#*=}"
            shift
            ;;
        --log-file=*)
            LOG_FILE="${1#*=}"
            shift
            ;;
        *)
            echo "${RED}Opção desconhecida: $1${NC}"
            echo "Uso: $0 [--skip-check] [--min-memory=4] [--log-file=path]"
            exit 1
            ;;
    esac
done

if [[ "$SKIP_CHECK" == true ]]; then
    log "${GREEN}Verificação de memória pulada (--skip-check)${NC}"
    exit 0
fi

log "==========================================="
log "Verificação de Memória para Build Synthropic"
log "==========================================="

if [[ "$HAS_BC" == false ]]; then
    log "${YELLOW}Aviso: utilitário 'bc' não encontrado. Usando cálculos via awk/shell com precisão limitada.${NC}"
fi

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    log "${RED}Sistema operacional não suportado: $OSTYPE${NC}"
    exit 1
fi

# Verificar memória RAM disponível
if [[ "$OS" == "linux" ]]; then
    # Linux: ler /proc/meminfo
    MEM_TOTAL_KB=$(grep '^MemTotal:' /proc/meminfo | awk '{print $2}')
    MEM_FREE_KB=$(grep '^MemFree:' /proc/meminfo | awk '{print $2}')
    BUFFERS_KB=$(grep '^Buffers:' /proc/meminfo | awk '{print $2}')
    CACHED_KB=$(grep '^Cached:' /proc/meminfo | awk '{print $2}')
    MEM_AVAILABLE_KB=$((MEM_FREE_KB + BUFFERS_KB + CACHED_KB))
    MEM_AVAILABLE_GB=$(kb_to_gb "$MEM_AVAILABLE_KB")
    
    # Swap
    SWAP_TOTAL_KB=$(grep '^SwapTotal:' /proc/meminfo | awk '{print $2}')
    SWAP_FREE_KB=$(grep '^SwapFree:' /proc/meminfo | awk '{print $2}')
    SWAP_USED_KB=$((SWAP_TOTAL_KB - SWAP_FREE_KB))
    SWAP_TOTAL_GB=$(kb_to_gb "$SWAP_TOTAL_KB")
    SWAP_FREE_GB=$(kb_to_gb "$SWAP_FREE_KB")
    if [[ $SWAP_TOTAL_KB -gt 0 ]]; then
        SWAP_USAGE_PERCENT=$((SWAP_USED_KB * 100 / SWAP_TOTAL_KB))
    else
        SWAP_USAGE_PERCENT=0
    fi
elif [[ "$OS" == "macos" ]]; then
    # macOS: usar vm_stat
    VM_STAT=$(vm_stat)
    PAGES_FREE=$(echo "$VM_STAT" | grep 'Pages free:' | awk '{print $3}' | tr -d '.')
    PAGES_SPECULATIVE=$(echo "$VM_STAT" | grep 'Pages speculative:' | awk '{print $3}' | tr -d '.')
    PAGES_INACTIVE=$(echo "$VM_STAT" | grep 'Pages inactive:' | awk '{print $3}' | tr -d '.')
    PAGE_SIZE=$(echo "$VM_STAT" | grep 'page size of' | awk '{print $8}')
    
    MEM_AVAILABLE_BYTES=$(( (PAGES_FREE + PAGES_SPECULATIVE + PAGES_INACTIVE) * PAGE_SIZE ))
    MEM_AVAILABLE_GB=$(bytes_to_gb "$MEM_AVAILABLE_BYTES")
    
    # Swap no macOS (usar sysctl)
    SWAP_TOTAL_BYTES=$(sysctl -n vm.swapusage | awk '{print $4}' | sed 's/M//')
    SWAP_USED_BYTES=$(sysctl -n vm.swapusage | awk '{print $7}' | sed 's/M//')
    if [[ -n "$SWAP_TOTAL_BYTES" && "$SWAP_TOTAL_BYTES" != "0.00M" ]]; then
        if [[ "$HAS_BC" == true ]]; then
            SWAP_TOTAL_GB=$(echo "scale=2; $SWAP_TOTAL_BYTES / 1024" | bc 2>/dev/null || printf "0.00")
            SWAP_USED_GB=$(echo "scale=2; $SWAP_USED_BYTES / 1024" | bc 2>/dev/null || printf "0.00")
            SWAP_FREE_GB=$(echo "scale=2; $SWAP_TOTAL_GB - $SWAP_USED_GB" | bc 2>/dev/null || printf "0.00")
            SWAP_USAGE_PERCENT=$(echo "scale=0; $SWAP_USED_GB * 100 / $SWAP_TOTAL_GB" | bc 2>/dev/null || printf "0")
        else
            SWAP_TOTAL_GB=$(awk -v v="$SWAP_TOTAL_BYTES" 'BEGIN { printf "%.2f", (v/1024) }')
            SWAP_USED_GB=$(awk -v v="$SWAP_USED_BYTES" 'BEGIN { printf "%.2f", (v/1024) }')
            SWAP_FREE_GB=$(awk -v a="$SWAP_TOTAL_GB" -v b="$SWAP_USED_GB" 'BEGIN { printf "%.2f", (a-b) }')
            SWAP_USAGE_PERCENT=$(awk -v a="$SWAP_USED_GB" -v b="$SWAP_TOTAL_GB" 'BEGIN { if (b>0) printf "%d", (a*100/b); else print 0 }')
        fi
    else
        SWAP_TOTAL_GB="0.00"
        SWAP_FREE_GB="0.00"
        SWAP_USAGE_PERCENT=0
    fi
fi

log "✓ Memória RAM disponível: $MEM_AVAILABLE_GB GB"
HAS_SWAP=0
if [[ "$OS" == "linux" ]]; then
    if [[ "$SWAP_TOTAL_KB" -gt 0 ]]; then HAS_SWAP=1; fi
elif [[ "$OS" == "macos" ]]; then
    if [[ "$SWAP_TOTAL_GB" != "0.00" ]]; then HAS_SWAP=1; fi
fi
if [[ $HAS_SWAP -eq 1 ]]; then
    log "✓ Swap disponível: $SWAP_FREE_GB GB ($SWAP_USAGE_PERCENT% usado)"
else
    log "✓ Swap: Não configurado"
fi

# Verificar se há builds em andamento
BUILD_PROCESSES=$(ps aux | grep -E "(node.*build|npm.*build|next build)" | grep -v grep | wc -l)
if [[ $BUILD_PROCESSES -gt 0 ]]; then
    log "${YELLOW}⚠ Builds em andamento detectados: $BUILD_PROCESSES processo(s)${NC}"
else
    log "✓ Nenhum build em andamento"
fi

# Listar processos que mais consomem memória
log ""
log "Processos que mais consomem memória:"
if [[ "$OS" == "linux" ]]; then
    ps aux --sort=-%mem | head -n 6 | tail -n 5 | awk '{printf "  %d. %s (%.1f%%)\n", NR, $11, $4}'
elif [[ "$OS" == "macos" ]]; then
    ps aux -m | head -n 6 | tail -n 5 | awk '{printf "  %d. %s (%.1f%%)\n", NR, $11, $3}'
fi

# Fornecer recomendações
log ""
EXIT_CODE=0
if [[ "$HAS_BC" == true ]]; then
    if (( $(echo "$MEM_AVAILABLE_GB < $MIN_MEMORY_GB" | bc -l 2>/dev/null) )); then
        log "${RED}[ERRO] Memória insuficiente para build (mínimo ${MIN_MEMORY_GB}GB)${NC}"
        log "Recomendação: Adicione swap ou aumente a RAM física."
        log "Comandos para adicionar swap:"
        log "  sudo fallocate -l 4G /swapfile"
        log "  sudo chmod 600 /swapfile"
        log "  sudo mkswap /swapfile"
        log "  sudo swapon /swapfile"
        EXIT_CODE=2
    elif (( $(echo "$MEM_AVAILABLE_GB >= $MIN_MEMORY_GB && $MEM_AVAILABLE_GB < 6" | bc -l 2>/dev/null) )); then
        log "${YELLOW}[AVISO] Memória adequada, mas build pode ser lento${NC}"
        log "Recomendação: Considere aumentar para 6GB+ para builds mais rápidos."
        EXIT_CODE=1
    else
        log "${GREEN}[OK] Sistema tem memória suficiente para build${NC}"
        log "Recomendação: Você pode prosseguir com o build."
    fi
else
    # Fallback sem 'bc' usando inteiros (KB)
    if [[ "$OS" == "linux" ]]; then
        AVAIL_KB="$MEM_AVAILABLE_KB"
    else
        AVAIL_KB=$(( MEM_AVAILABLE_BYTES / 1024 ))
    fi
    MIN_KB=$(awk -v v="$MIN_MEMORY_GB" 'BEGIN { printf "%d", (v*1024*1024) }')
    if (( AVAIL_KB < MIN_KB )); then
        log "${RED}[ERRO] Memória insuficiente para build (mínimo ${MIN_MEMORY_GB}GB)${NC}"
        log "Recomendação: Adicione swap ou aumente a RAM física."
        EXIT_CODE=2
    elif (( AVAIL_KB >= MIN_KB && AVAIL_KB < (6*1024*1024) )); then
        log "${YELLOW}[AVISO] Memória adequada, mas build pode ser lento${NC}"
        log "Recomendação: Considere aumentar para 6GB+ para builds mais rápidos."
        EXIT_CODE=1
    else
        log "${GREEN}[OK] Sistema tem memória suficiente para build${NC}"
        log "Recomendação: Você pode prosseguir com o build."
    fi
fi

if [[ $SWAP_USAGE_PERCENT -gt 50 ]]; then
    log "${YELLOW}[AVISO] Swap está sendo usado excessivamente ($SWAP_USAGE_PERCENT%)${NC}"
    log "Recomendação: Considere aumentar a RAM física."
    if [[ $EXIT_CODE -eq 0 ]]; then
        EXIT_CODE=1
    fi
fi

if [[ $BUILD_PROCESSES -gt 0 ]]; then
    log "${YELLOW}[AVISO] Há builds em andamento${NC}"
    log "Recomendação: Aguarde a conclusão ou cancele builds desnecessários."
    if [[ $EXIT_CODE -eq 0 ]]; then
        EXIT_CODE=1
    fi
fi

exit $EXIT_CODE
