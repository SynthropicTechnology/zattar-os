# Quick Fix: Erro BuildKit EOF

## 🚨 Erro
```
ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF
```

## ⚡ Solução Rápida (3 passos)

### 1. Verificar Recursos
```bash
npm run docker:check-resources
```

### 2. Recuperar BuildKit
```bash
npm run docker:fix-buildkit
```

### 3. Build Alternativo (sem cache)
```bash
# Opção A: Docker direto
npm run docker:build:no-cache

# Opção B: Docker Compose
docker-compose -f docker-compose.no-cache.yml up -d --build
```

## 📋 Checklist

- [ ] Docker Desktop: Settings → Resources → Memory: **8GB+** (12GB recomendado)
- [ ] Docker Desktop: Settings → Resources → Swap: **2GB+**
- [ ] Executou `npm run docker:check-resources`?
- [ ] Executou `npm run docker:fix-buildkit`?
- [ ] Tentou build sem cache?

## 🔍 Diagnóstico

### Verificar memória durante build:
```bash
# Em outro terminal, durante o build:
docker stats --no-stream
```

### Verificar logs do sistema (OOM):
```bash
# Linux
dmesg | grep -i oom

# macOS
log show --predicate 'eventMessage contains "out of memory"' --last 1h
```

### Limpar cache do Docker:
```bash
docker system prune -a
```

## 📚 Documentação Completa

Veja `docs/troubleshooting/docker-buildkit-eof-error.md` para detalhes completos.
