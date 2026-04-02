# Docker Build Errors — EOF, Proxy e BuildKit

## Erro 1: BuildKit EOF (End of File)

```
ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF
```

### Causas

- Build longo (40+ min) causa timeout de conexão com o daemon BuildKit
- Cache mounts (`--mount=type=cache`) causam perda de conexão em operações de I/O intensivas
- Memória insuficiente leva a falha silenciosa do BuildKit
- Daemon do BuildKit foi reiniciado durante o build

### Solucao Rapida (3 passos)

1. Verificar recursos:
   ```bash
   npm run docker:check-resources
   ```

2. Recuperar BuildKit:
   ```bash
   npm run docker:fix-buildkit
   ```

3. Build alternativo sem cache:
   ```bash
   npm run docker:build:no-cache
   # ou
   docker-compose -f docker-compose.no-cache.yml up -d --build
   ```

### Solucoes Detalhadas

#### Remover Cache Mounts (RECOMENDADO para EOF recorrente)

Cache mounts requerem conexao BuildKit constante. Em builds longos a conexao pode expirar.
Use `Dockerfile.efficient` **sem cache mounts**:

```bash
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax
```

- Build mais lento (~5-6 min para npm ci), mas estavel
- npm ci: ~5-6 minutos | Build completo: ~20-25 minutos

#### Reconstruir BuildKit Daemon

```bash
docker buildx stop
docker buildx rm builder
docker buildx create --name builder --driver docker-container --use
docker buildx inspect --bootstrap
docker buildx ls
```

#### Build Incremental

```bash
# Etapa 1: apenas dependencias
docker build --target deps -t sinesys:deps .
# Etapa 2: build completo
docker build -t sinesys:latest .
```

#### Comparacao de Dockerfiles por Estabilidade

| Dockerfile | Cache Mount | Estabilidade | Velocidade |
|---|---|---|---|
| `Dockerfile.efficient` (sem cache) | Nao | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| `Dockerfile.efficient` (com cache) | Sim | ⭐⭐ | ⭐⭐⭐ |
| `Dockerfile.no-syntax` | Nao | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### Diagnostico

```bash
# Verificar memoria durante build (em outro terminal)
docker stats --no-stream

# Verificar logs OOM no Linux
dmesg | grep -i oom

# Verificar logs OOM no macOS
log show --predicate 'eventMessage contains "out of memory"' --last 1h

# Limpar cache do Docker
docker system prune -a
```

---

## Erro 2: Proxy / Network Timeout

```
ERROR: failed to solve: failed to resolve source metadata for docker.io/docker/dockerfile:1.4:
failed to do request: Head "https://registry-1.docker.io/...":
proxyconnect tcp: dial tcp: lookup http.docker.internal on ...: i/o timeout
```

### Causa

Docker Desktop tenta usar proxy interno (`http.docker.internal`) que nao responde.
Problema de DNS ou configuracao de proxy incorreta.

### Solucao Rapida

Usar Dockerfile sem syntax directive (evita requisicao ao registry):

```bash
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax
```

Ou com script NPM:

```bash
npm run docker:fix-proxy
```

### Corrigir Configuracoes do Docker Desktop

1. **Settings → Resources → Network:** desabilite "Use kernel networking for UDP"
2. **Settings → Docker Engine:** remova entradas de proxy, use config limpa:
   ```json
   {
     "features": {
       "buildkit": true
     }
   }
   ```
3. Reinicie o Docker Desktop completamente.

---

## Checklist Geral

- [ ] Docker Desktop: Settings → Resources → Memory: 8GB+ (ver `docker-memory-issues.md`)
- [ ] Executou `npm run docker:check-resources`?
- [ ] Executou `npm run docker:fix-buildkit`?
- [ ] Tentou build sem cache: `npm run docker:build:no-cache`?
- [ ] Verificou configuracoes de proxy no Docker Desktop?
- [ ] Limpou cache: `docker system prune -a`?

## Scripts Disponiveis

```bash
npm run docker:check-resources     # Diagnostico de recursos
npm run docker:fix-buildkit        # Recupera BuildKit
npm run docker:build:no-cache      # Build sem cache mount
npm run docker:fix-proxy           # Diagnostico de proxy
```

## Referencias

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [BuildKit Troubleshooting](https://docs.docker.com/build/buildkit/troubleshooting/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Docker Desktop Network Settings](https://docs.docker.com/desktop/settings/windows/#network)
