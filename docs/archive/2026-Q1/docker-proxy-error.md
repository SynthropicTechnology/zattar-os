# Erro Docker: Proxy/Network Timeout

## 🚨 Erro
```
ERROR: failed to solve: failed to resolve source metadata for docker.io/docker/dockerfile:1.4: 
failed to do request: Head "https://registry-1.docker.io/v2/docker/dockerfile/manifests/1.4": 
proxyconnect tcp: dial tcp: lookup http.docker.internal on 192.168.65.7:53: read udp ...: i/o timeout
```

## 🔍 Causa
- Docker Desktop tentando usar proxy interno (`http.docker.internal`) que não está respondendo
- Problema de DNS/resolução de nomes no Docker Desktop
- Configuração de proxy incorreta

## ⚡ Solução Rápida

### Opção 1: Usar Dockerfile sem Syntax Directive (Recomendado)

```bash
# Build com Dockerfile alternativo (sem syntax directive)
docker build -f Dockerfile.no-syntax \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://cxxdivtgeslrujpfpivs.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="sb_publishable_c2-ICRd-M-68oCRJNNDEVw_uMnxGgD_" \
  -t sinesys:latest .
```

Ou usando o script:
```bash
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax
```

### Opção 2: Corrigir Configurações do Docker Desktop

1. **Docker Desktop → Settings → Resources → Network:**
   - Desabilite "Use kernel networking for UDP" se estiver habilitado
   - Verifique se não há proxy configurado

2. **Docker Desktop → Settings → Docker Engine:**
   - Remova configurações de proxy se existirem
   - Exemplo de configuração limpa:
   ```json
   {
     "features": {
       "buildkit": true
     }
   }
   ```

3. **Reiniciar Docker Desktop:**
   - Feche completamente o Docker Desktop
   - Abra novamente

### Opção 3: Limpar Cache e Tentar Novamente

```bash
# Limpar cache do Docker
docker system prune -a

# Tentar build novamente
npm run docker:build
```

## 📋 Checklist

- [ ] Tentou usar `Dockerfile.no-syntax`?
- [ ] Verificou configurações de proxy no Docker Desktop?
- [ ] Reiniciou o Docker Desktop?
- [ ] Limpou cache do Docker?
- [ ] Verificou conectividade com internet?

## 🔧 Scripts Disponíveis

```bash
# Diagnóstico de proxy
npm run docker:fix-proxy

# Build sem syntax directive
bash scripts/docker/build-no-cache.sh Dockerfile.no-syntax

# Build sem cache mount
npm run docker:build:no-cache
```

## 📚 Referências

- [Docker Desktop Network Settings](https://docs.docker.com/desktop/settings/windows/#network)
- [Docker BuildKit Troubleshooting](https://docs.docker.com/build/buildkit/troubleshooting/)
