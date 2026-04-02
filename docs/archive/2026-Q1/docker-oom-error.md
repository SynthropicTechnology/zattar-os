# Erro Docker: Out of Memory (OOM)

## 🚨 Erro
```
ERROR: failed to build: failed to solve: ResourceExhausted: 
process "/bin/sh -c npm run build:ci" did not complete successfully: 
cannot allocate memory

npm error signal SIGKILL
```

## 🔍 Causa
- **Docker Desktop com memória insuficiente** (atualmente ~5.7GB)
- Build do Next.js requer **6GB apenas para Node.js** (`--max-old-space-size=6144`)
- Mais overhead do Docker, sistema operacional, etc.
- **Total necessário: mínimo 8GB, recomendado 12GB+**

## ⚡ Solução Definitiva

### Opção 1: Aumentar Memória do Docker Desktop (RECOMENDADO)

1. **Docker Desktop → Settings → Resources → Memory**
2. **Aumente para 12GB** (ou máximo disponível)
3. **Aumente Swap para 2GB**
4. **Clique em "Apply & Restart"**
5. **Aguarde Docker reiniciar completamente**
6. **Tente build novamente**

### Opção 2: Usar Dockerfile Otimizado (Temporário)

Se não puder aumentar memória agora:

```bash
# Build com menos memória (4GB em vez de 6GB)
bash scripts/docker/build-no-cache.sh Dockerfile.low-memory
```

**Nota:** Build será mais lento, mas funciona com 8GB de memória.

## 🔧 Verificar Memória

```bash
# Verificar requisitos
npm run docker:check-memory

# Ver uso durante build (em outro terminal)
docker stats --no-stream
```

## 📊 Comparação de Dockerfiles

| Dockerfile | Heap Node.js | Memória Mínima | Velocidade |
|------------|--------------|----------------|------------|
| `Dockerfile` | 6GB | 12GB+ | ⚡ Rápido |
| `Dockerfile.low-memory` | 4GB | 8GB | 🐢 Mais lento |
| `Dockerfile.no-cache` | 6GB | 12GB+ | ⚡ Rápido (sem cache) |
| `Dockerfile.no-syntax` | 6GB | 12GB+ | ⚡ Rápido (sem syntax) |

## 🎯 Solução Permanente

**Aumente a memória do Docker Desktop para 12GB+.** Isso resolve o problema definitivamente e permite builds rápidos.

### Por que 12GB?

- Node.js heap: 6GB
- Docker overhead: ~1GB
- Sistema operacional: ~2GB
- Cache e buffers: ~2GB
- Margem de segurança: ~1GB
- **Total: ~12GB**

## 📋 Checklist

- [ ] Verificou memória: `npm run docker:check-memory`
- [ ] Aumentou Docker Desktop para 12GB+?
- [ ] Reiniciou Docker Desktop completamente?
- [ ] Tentou build: `npm run docker:build`
- [ ] Se ainda falhar: `npm run docker:build:low-memory`

## 🚀 Após Aumentar Memória

```bash
# Verificar recursos
npm run docker:check-resources

# Build normal (rápido)
npm run docker:build
```

## 💡 Dica

Se você tem 16GB+ de RAM no sistema, **configure Docker Desktop com 12GB**. Isso garante builds estáveis e rápidos sem problemas de memória.
