# Erro Docker BuildKit: EOF (End of File)

## Erro Identificado

```
ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF
```

## Causas Prováveis

### 1. **Timeout de Conexão**
- Build rodou por **2581.6s** (~43 minutos) antes de falhar
- BuildKit perdeu conexão com o daemon durante o build longo
- Timeout padrão do BuildKit pode ser insuficiente para builds grandes

### 2. **Memória Insuficiente**
- Dockerfile configura `NODE_OPTIONS="--max-old-space-size=6144"` (6GB)
- Se o sistema não tiver memória suficiente, pode causar OOM (Out of Memory)
- BuildKit pode falhar silenciosamente quando há falta de memória

### 3. **Problemas com BuildKit Daemon**
- Daemon do BuildKit pode ter sido reiniciado durante o build
- Conexão RPC interrompida inesperadamente
- Problemas de rede entre cliente e daemon

### 4. **Cache Mount Issues**
- Cache mounts (`--mount=type=cache`) podem causar problemas em alguns ambientes
- Permissões incorretas (uid/gid) podem causar falhas silenciosas

## Soluções

### Solução 1: Aumentar Timeout do BuildKit

**Para Docker Desktop (Windows/Mac):**
```bash
# Aumentar timeout do BuildKit (padrão: 20 minutos)
export BUILDKIT_STEP_LOG_MAX_SIZE=50000000
export BUILDKIT_STEP_LOG_MAX_SPEED=10000000
```

**Para Docker Engine (Linux):**
Edite `/etc/docker/daemon.json`:
```json
{
  "features": {
    "buildkit": true
  },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5
}
```

### Solução 2: Aumentar Memória do Docker

**Docker Desktop:**
1. Abra Settings → Resources
2. Aumente Memory para pelo menos **8GB** (recomendado: 12GB+)
3. Aumente Swap para **2GB**
4. Reinicie Docker Desktop

**Docker Engine (Linux):**
```bash
# Verificar memória disponível
free -h

# Se necessário, aumentar swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Solução 3: Reconstruir BuildKit Daemon

```bash
# Parar BuildKit
docker buildx stop

# Remover builder atual
docker buildx rm builder

# Criar novo builder com mais recursos
docker buildx create --name builder --driver docker-container --use
docker buildx inspect --bootstrap

# Verificar status
docker buildx ls
```

### Solução 4: Build sem Cache Mount (Fallback)

Se os cache mounts continuarem causando problemas, modifique temporariamente o Dockerfile:

```dockerfile
# Substituir esta linha:
RUN --mount=type=cache,target=/app/.next/cache,uid=1000,gid=1000 \
    npm run build:ci

# Por esta (sem cache mount):
RUN npm run build:ci
```

**Nota:** Isso tornará o build mais lento, mas pode resolver problemas de conexão.

### Solução 5: Build Incremental (Recomendado)

Divida o build em etapas menores para evitar timeouts:

```dockerfile
# Etapa 1: Instalar dependências (já está otimizado)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts

# Etapa 2: Build com verificação de memória
RUN --mount=type=cache,target=/app/.next/cache,uid=1000,gid=1000 \
    node --max-old-space-size=6144 node_modules/next/dist/bin/next build
```

### Solução 6: Usar Build Paralelo

Se possível, use múltiplos builders:

```bash
# Criar builder com mais recursos
docker buildx create --name multi-builder \
  --driver docker-container \
  --driver-opt network=host \
  --use

# Build com paralelismo
docker buildx build --platform linux/amd64 \
  --builder multi-builder \
  --cache-from type=local,src=/tmp/.buildx-cache \
  --cache-to type=local,dest=/tmp/.buildx-cache \
  -t sinesys:latest .
```

## Verificação Pós-Correção

Após aplicar as soluções, verifique:

```bash
# 1. Verificar memória disponível
docker system df
docker stats --no-stream

# 2. Verificar BuildKit
docker buildx ls
docker buildx inspect

# 3. Testar build com logs detalhados
DOCKER_BUILDKIT=1 docker build \
  --progress=plain \
  --no-cache \
  -t sinesys:test .
```

## Prevenção

1. **Monitorar uso de memória durante builds**
   ```bash
   # Em outro terminal, durante o build:
   watch -n 1 'docker stats --no-stream'
   ```

2. **Usar build com limite de memória explícito**
   ```bash
   docker build --memory=8g --memory-swap=10g -t sinesys:latest .
   ```

3. **Configurar alertas de OOM**
   - Verificar logs do sistema: `dmesg | grep -i oom`
   - Configurar limites no docker-compose.yml

## Referências

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [BuildKit Troubleshooting](https://docs.docker.com/build/buildkit/troubleshooting/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
