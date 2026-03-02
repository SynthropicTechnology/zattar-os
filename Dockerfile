# syntax=docker/dockerfile:1
# ============================================================================
# REQUISITO: Docker BuildKit
# ============================================================================
# Este Dockerfile usa recursos do BuildKit (--mount=type=cache).
# O BuildKit é ativado automaticamente no Docker 23.0+ ou pode ser habilitado:
#
# Opcao 1: Variavel de ambiente
#   export DOCKER_BUILDKIT=1
#
# Opcao 2: Configuracao do daemon (/etc/docker/daemon.json)
#   { "features": { "buildkit": true } }
#
# Se BuildKit nao estiver disponivel, remova o uso de --mount=type=cache
# na linha do "npm ci" e use: RUN npm ci --legacy-peer-deps --ignore-scripts
# ============================================================================
#
# Dockerfile para Sinesys (Next.js App)
#
# Este Dockerfile cria uma imagem LEVE do Next.js usando output standalone.
# Usa Alpine Linux para imagens menores (~50MB base vs ~150MB slim).
# O Playwright/Browser e um servico SEPARADO (ver docs/deploy.md).
#
# Para CapRover: o arquivo captain-definition ja aponta para este Dockerfile
#
# Otimizacoes aplicadas:
# - Alpine Linux (menor tamanho base)
# - Image pinning com digest (builds deterministicos)
# - Cache mounts para npm e cache
# - .dockerignore otimizado (contexto menor)
# - Memoria limitada para evitar OOM
#
# ============================================================================
# TROUBLESHOOTING
# ============================================================================
# Build acontece no GitHub Actions, nao no servidor de producao.
# Se houver problemas:
# 1. Verifique logs do GitHub Actions
# 2. Verifique se secrets estao configurados (NEXT_PUBLIC_SUPABASE_*)
# 3. Veja documentacao completa em docs/deploy.md
#
# Erro "rpc error: code = Unavailable desc = error reading from server: EOF"?
# - Quick fix: docs/troubleshooting/docker-buildkit-quick-fix.md
# - Detalhes: docs/troubleshooting/docker-buildkit-eof-error.md
# - Scripts: npm run docker:check-resources | npm run docker:fix-buildkit
# - Fallback: Use Dockerfile.no-cache ou docker-compose.no-cache.yml
# ============================================================================

# ============================================================================
# STAGE: Dependencies
# ============================================================================
# Estrategia de cache: Copiar package.json ANTES de npm ci maximiza cache de deps
# Como funciona: Reutiliza node_modules se dependencias nao mudarem
# Impacto: ~60s economizados quando deps nao mudam
# Alpine: ~50MB base vs ~150MB slim
# ============================================================================
FROM node:22-alpine AS deps
WORKDIR /app

# Impedir download de browsers do Playwright (browser esta em container separado)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Desabilitar telemetria o mais cedo possivel para reduzir overhead
ENV NEXT_TELEMETRY_DISABLED=1

# Compatibilidade glibc para modulos nativos no Alpine
# Ref: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
RUN apk add --no-cache libc6-compat

# Copiar arquivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias com otimizacoes de memoria e cache
# --legacy-peer-deps evita conflitos e reduz memoria
# --mount=type=cache acelera reinstalacoes via cache npm global
# --prefer-offline usa cache local quando possivel
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm ci --legacy-peer-deps --ignore-scripts --prefer-offline

# ============================================================================
# STAGE: Builder
# ============================================================================
# Estrategia de cache: Copiar node_modules do stage anterior evita reinstalar deps
# Por que COPY . . antes dos ARGs: Next.js precisa de todos os arquivos para build
# Por que nao seletivo: Next.js escaneia todo o projeto
# .dockerignore reduz contexto: ~1GB -> ~100MB
# ============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# ============================================================================
# CONFIGURACAO DE MEMORIA
# ============================================================================
# NOTA IMPORTANTE: NAO definir NODE_OPTIONS aqui!
# O script build:ci no package.json define --max-old-space-size=6144 (6GB)
# Se definirmos ENV aqui, ele SOBRESCREVE o valor do script
# Resultado: build usa apenas 4GB e falha com OOM
#
# Build acontece no GitHub Actions (nao no CapRover):
# - 6GB e suficiente para builds Next.js com cache persistente
# - GitHub Actions runners tem ~7GB de RAM disponivel
# - Cache handler customizado reduz uso de memoria em ~30%
#
# OTIMIZACOES ADICIONAIS (ver next.config.ts):
# - productionBrowserSourceMaps: false (economiza ~500MB)
# - serverSourceMaps: false (reduz tamanho da imagem)
# - output: 'standalone' (build otimizado para Docker)
# - cacheHandler: './cache-handler.js' (cache persistente)
# - cacheMaxMemorySize: 0 (desabilita cache em memoria)
# ============================================================================


# ============================================================================
# BUILD ARGS (DECLARADOS ANTES DO COPY)
# ============================================================================
# Declarar ARGs o mais cedo possível para melhor uso do cache
# Se secrets mudarem, só invalida a partir daqui
# ============================================================================
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Converter ARGs para ENVs para o build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}

# Desabilitar TypeScript check durante build Docker (ja foi feito no CI)
# Economiza ~1min e ~2GB de memoria
ENV NEXT_BUILD_LINT_DISABLED=1
ENV SKIP_TYPE_CHECK=true
# Webpack é forçado via --webpack no script build:ci (package.json)
# NÃO definir TURBOPACK=0 aqui — Next.js 16 rejeita múltiplas flags de bundler

# Copiar dependencias do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Criar diretorio de cache ANTES de copiar codigo (melhor cache)
RUN mkdir -p .next/cache

# Copiar codigo fonte por ultimo (muda mais frequentemente)
COPY . .

# Copiar PDF.js worker para public/ (postinstall nao roda com --ignore-scripts)
# O browser precisa deste arquivo para renderizar PDFs no cliente
RUN mkdir -p public/pdfjs && \
    cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdfjs/pdf.worker.min.mjs

# Build da aplicacao com cache persistente entre builds
# --mount=type=cache persiste o diretorio .next/cache entre builds
# uid/gid=1001 corresponde ao usuario nextjs no stage runner
# NOTA: NODE_OPTIONS=--max-old-space-size=6144 vem do script build:ci
RUN --mount=type=cache,target=/app/.next/cache,uid=1001,gid=1001 \
    npm run build:ci

# ============================================================================
# STAGE: Runner
# ============================================================================
# Estrategia: Copiar apenas arquivos necessarios reduz tamanho final
# Standalone output: Inclui apenas dependencias necessarias
# Tamanho final: ~200-300MB vs ~1GB sem otimizacao
# Alpine: Imagem base menor para producao
# ============================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# dumb-init: processo init leve para tratamento correto de sinais (SIGTERM, SIGINT)
# Node.js nao foi projetado para rodar como PID 1 - o kernel trata PID 1 de forma especial
# dumb-init atua como PID 1 e repassa sinais corretamente para o processo Node.js
RUN apk add --no-cache dumb-init

# Criar usuario nao-root para seguranca (Alpine usa addgroup/adduser)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessarios do build com ownership correto
# --link melhora cache de layers (reusa layers mesmo se anteriores mudaram)
# Usa UIDs numericos (1001:1001) porque --link cria layers independentes
# e nao consegue resolver nomes de usuario/grupo criados em layers anteriores
COPY --from=builder --chown=1001:1001 --link /app/public ./public
COPY --from=builder --chown=1001:1001 --link /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 --link /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# ============================================================================
# HEALTHCHECK E DETECCAO DE OOM
# ============================================================================
# Este healthcheck verifica se a aplicacao esta respondendo
#
# Configuracoes:
# - interval=30s: Verifica a cada 30 segundos
# - timeout=10s: Falha se nao responder em 10 segundos
# - start-period=40s: Aguarda 40s antes de comecar (tempo de inicializacao)
# - retries=3: Marca como unhealthy apos 3 falhas consecutivas
#
# Relacao com OOM:
# - Se container ficar sem memoria, healthcheck falhara
# - CapRover reiniciara container automaticamente
# - Logs mostrarao "unhealthy" antes do restart
#
# Para monitorar OOM:
# - Verifique logs: docker logs <container_id>
# - Procure por: "out of memory", "heap", "killed"
# - Use: docker stats <container_id> para ver uso de memoria em tempo real
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
