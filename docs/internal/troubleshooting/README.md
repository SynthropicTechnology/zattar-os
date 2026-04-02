# Troubleshooting - Docker

## Documentacao Consolidada

- [docker-build-errors.md](./docker-build-errors.md) - Erros de build: EOF, proxy/network timeout, BuildKit
- [docker-memory-issues.md](./docker-memory-issues.md) - Erros de memoria: OOM, requisitos por Dockerfile

## Scripts e Recursos

### Scripts de Build
- `scripts/docker/fix-buildkit.sh` - Recupera e reconstroi o BuildKit
- `scripts/docker/check-docker-resources.sh` - Verifica recursos antes do build

### Dockerfiles Alternativos
- `Dockerfile.no-cache` - Versao sem cache mounts (fallback estavel)
- `Dockerfile.efficient` - Build eficiente com Webpack (6GB suficiente)
- `Dockerfile.low-memory` - Build com heap reduzido (8GB suficiente)
- `Dockerfile.no-syntax` - Sem syntax directive (resolve erros de proxy)
- `docker-compose.no-cache.yml` - Docker Compose usando Dockerfile alternativo

## Uso Rapido

```bash
# Verificar recursos
npm run docker:check-resources

# Recuperar BuildKit (erro EOF)
npm run docker:fix-buildkit

# Build sem cache (fallback)
npm run docker:build:no-cache

# Build eficiente (6GB, recomendado)
npm run docker:build:efficient
```

## Referencias

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
