# Erro EOF Recorrente - BuildKit Connection Lost

## 🚨 Problema

Build falha repetidamente com:
```
ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF
```

**Mesmo após:**
- ✅ Limpar disco
- ✅ Aumentar memória
- ✅ Recuperar BuildKit

## 🔍 Causa

**Cache mounts (`--mount=type=cache`) estão causando perda de conexão BuildKit** durante operações longas:
- Copiar `node_modules` grandes (74s+)
- Builds que demoram mais de 10 minutos
- Operações de I/O intensivas

## ✅ Solução

### Opção 1: Remover Cache Mounts (RECOMENDADO)

Use `Dockerfile.efficient` **SEM cache mounts**:
- Mais lento (~5-6 min para npm ci)
- **Mas funciona de forma estável**
- Não perde conexão BuildKit

### Opção 2: Usar Dockerfile Alternativo

```bash
# Sem cache mounts, sem syntax directive
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax
```

### Opção 3: Build Incremental

Divida o build em etapas menores para evitar timeouts:
1. Build apenas deps: `docker build --target deps -t sinesys:deps .`
2. Build completo depois

## 📊 Comparação

| Dockerfile | Cache Mount | Estabilidade | Velocidade |
|------------|-------------|--------------|------------|
| `Dockerfile.efficient` (sem cache) | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| `Dockerfile.efficient` (com cache) | ✅ | ⭐⭐ | ⭐⭐⭐ |
| `Dockerfile.no-syntax` | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🎯 Recomendação

**Use `Dockerfile.efficient` SEM cache mounts:**
- Funciona de forma estável
- npm ci: ~5-6 minutos (aceitável)
- Build completo: ~20-25 minutos
- **Sem erros EOF!**

## 💡 Por Que Cache Mount Falha?

Cache mounts requerem conexão BuildKit constante. Em builds longos:
- Conexão pode expirar
- Timeout de rede
- Problemas de sincronização

**Sem cache mount:** Build é mais lento, mas **sempre funciona**.
