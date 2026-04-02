# Docker Memory Issues — OOM e Requisitos de Memoria

## Erro: Out of Memory (OOM)

```
ERROR: failed to build: failed to solve: ResourceExhausted:
process "/bin/sh -c npm run build:ci" did not complete successfully:
cannot allocate memory

npm error signal SIGKILL
```

### Causa

O build do Next.js requer heap grande no Node.js. A quantidade necessaria depende do Dockerfile usado:

| Dockerfile | Heap Node.js | Memoria Docker Minima | Velocidade | Estabilidade |
|---|---|---|---|---|
| `Dockerfile.efficient` (Webpack) | 3GB | **6GB** | Media (~15-20min) | ⭐⭐⭐⭐⭐ |
| `Dockerfile.low-memory` | 4GB | 8GB | Lenta (~20-25min) | ⭐⭐⭐⭐ |
| `Dockerfile` (padrao, experimental) | 6GB | 12GB+ | Media (~15-20min) | ⭐⭐⭐ |

### Recomendacao: Build Eficiente (6GB suficiente)

O build eficiente usa **Webpack** em vez do modo experimental — mais estavel, menos memoria:

```bash
npm run docker:build:efficient
```

**Precisa de 12GB? NAO** — 6GB e suficiente para o build eficiente.
12GB so e necessario para o `Dockerfile` padrao com `--experimental-build-mode=compile`.

### Solucao: Aumentar Memoria do Docker Desktop

1. Abra **Docker Desktop → Settings → Resources → Memory**
2. Aumente para **6GB** (build eficiente) ou **12GB** (build padrao)
3. Aumente **Swap para 2GB**
4. Clique em **"Apply & Restart"**
5. Aguarde Docker reiniciar completamente

### Solucao Temporaria: Dockerfile com Menos Memoria

Se nao puder aumentar a memoria agora:

```bash
# Build com heap de 4GB (funciona com 8GB no Docker Desktop)
bash scripts/docker/build-no-cache.sh Dockerfile.low-memory
```

## Breakdown de Memoria por Modo

### Build Eficiente (Webpack) — RECOMENDADO

- Node.js heap: 3GB
- Docker overhead: ~1GB
- Sistema operacional: ~1GB
- Cache e buffers: ~1GB
- **Total: ~6GB**

### Build Padrao (Experimental)

- Node.js heap: 6GB
- Docker overhead: ~2GB
- Sistema operacional: ~2GB
- Cache e buffers: ~2GB
- **Total: ~12GB**

## Verificacao e Diagnostico

```bash
# Verificar requisitos de memoria
npm run docker:check-memory

# Monitorar uso durante build (em outro terminal)
docker stats --no-stream

# Verificar se houve OOM no sistema
# Linux:
dmesg | grep -i oom

# macOS:
log show --predicate 'eventMessage contains "out of memory"' --last 1h
```

## Para CI/CD (GitHub Actions)

Runners do GitHub Actions tem ~7GB disponíveis. O build eficiente funciona perfeitamente.
Use `Dockerfile.efficient` para CI.

## Checklist

- [ ] Verificou memoria disponivel: `npm run docker:check-memory`
- [ ] Aumentou Docker Desktop para 6GB+ (eficiente) ou 12GB+ (padrao)?
- [ ] Reiniciou Docker Desktop completamente?
- [ ] Tentou build eficiente: `npm run docker:build:efficient`?
- [ ] Se ainda falhar: `npm run docker:build:low-memory`

## Scripts Disponiveis

```bash
npm run docker:check-memory        # Verifica requisitos de memoria
npm run docker:check-resources     # Verifica todos os recursos
npm run docker:build:efficient     # Build otimizado (6GB suficiente)
npm run docker:build               # Build padrao (12GB recomendado)
npm run docker:build:low-memory    # Build com heap reduzido (8GB suficiente)
```
