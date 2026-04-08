## Context

O projeto Synthropic utiliza Docker para containerização e GitHub Actions para CI/CD. A infraestrutura atual está funcional mas não otimizada para as melhores práticas de 2025. O workflow de deploy está inativo em `.gemini/` e precisa ser migrado e modernizado.

### Stakeholders
- Desenvolvedores (tempo de build local e CI)
- DevOps (manutenção de infraestrutura)
- Usuários finais (tempo de deploy e disponibilidade)

### Constraints
- Manter compatibilidade com arquitetura FSD existente
- Não quebrar builds existentes
- Suportar CapRover como plataforma de deploy
- Usar Node.js 24 LTS e Next.js 16

## Goals / Non-Goals

### Goals
- Reduzir tamanho da imagem Docker em 40-50%
- Acelerar builds em 20-60% (com e sem cache)
- Automatizar deploy para CapRover via GitHub Actions
- Implementar builds determinísticos com pinning de imagens
- Modernizar workflows para Node.js 24.x

### Non-Goals
- Migrar para outra plataforma de deploy (fora CapRover)
- Implementar multi-arch builds (ARM64) nesta fase
- Configurar Kubernetes ou orquestração avançada
- Implementar blue-green deployment

## Decisions

### Decision 1: Alpine vs Slim

**Escolha**: `node:24-alpine`

**Alternativas consideradas**:
- `node:24-slim` (~150MB) - Mais compatível, mas maior
- `node:24-alpine` (~50MB) - Menor, algumas limitações de musl
- `node:24` (~350MB) - Maior compatibilidade, muito grande

**Rationale**: Alpine oferece melhor trade-off tamanho/funcionalidade para aplicações Next.js. O projeto não usa bibliotecas nativas que requerem glibc.

### Decision 2: Cache Strategy

**Escolha**: Registry cache com mode=max

**Alternativas consideradas**:
- `type=local` - Cache local, não compartilhado entre runners
- `type=gha` - GitHub Actions cache, limitado a 10GB
- `type=registry` - Cache no registry, compartilhado e persistente

**Rationale**: Registry cache permite compartilhar layers entre todos os workflows e é persistente. `mode=max` cacheia todas as layers, não apenas as finais.

### Decision 3: Image Pinning

**Escolha**: Pinning com digest SHA256

**Alternativas consideradas**:
- Tag semântica (`node:24-alpine`) - Pode mudar sem aviso
- Tag específica (`node:24.1.0-alpine`) - Mais estável
- Digest (`node:24-alpine@sha256:...`) - Completamente determinístico

**Rationale**: Digest garante builds reproduzíveis. Atualizações são explícitas e auditáveis.

### Decision 4: Deploy Automation

**Escolha**: Webhook do CapRover via GitHub Actions

**Alternativas consideradas**:
- Deploy manual via UI do CapRover
- `caprover deploy` CLI em GitHub Actions
- Webhook trigger automático

**Rationale**: Webhook é a forma mais simples e confiável. Não requer CLI extra e integra bem com GitHub Actions.

## Risks / Trade-offs

### Risk 1: Alpine Compatibility
- **Risk**: Algumas dependências podem não funcionar com musl
- **Mitigation**: Testar build completo antes de mergear; fallback para slim se necessário

### Risk 2: Cache Invalidation
- **Risk**: Cache corrompido pode causar builds quebrados
- **Mitigation**: Implementar rebuild forçado via workflow_dispatch; cache key inclui hash de package-lock.json

### Risk 3: Digest Pinning Maintenance
- **Risk**: Digests precisam ser atualizados manualmente
- **Mitigation**: Documentar processo de atualização; considerar Dependabot para Docker

### Risk 4: Secrets Exposure
- **Risk**: Build args com secrets podem vazar em logs
- **Mitigation**: Usar `--secret` mount para valores sensíveis; verificar logs não expõem valores

## Migration Plan

### Fase 1: Dockerfile Optimization (Low Risk)
1. Criar branch `feature/optimize-docker`
2. Atualizar Dockerfile com Alpine e pinning
3. Testar build local
4. Comparar tamanho de imagens
5. Merge após validação

### Fase 2: GitHub Actions (Medium Risk)
1. Mover workflow de `.gemini/` para `.github/`
2. Atualizar actions para versões recentes
3. Configurar cache registry
4. Testar em branch de feature
5. Habilitar para main após validação

### Fase 3: CapRover Integration (Low Risk)
1. Criar `captain-definition`
2. Configurar app no CapRover
3. Testar deploy manual
4. Ativar webhook automático
5. Documentar processo

### Rollback Plan
- Dockerfile: Reverter para versão anterior via git
- GitHub Actions: Desabilitar workflow e usar deploy manual
- CapRover: Deploy manual via UI enquanto investiga

## Deployment Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Developer     │────▶│     GitHub      │────▶│  GitHub Actions │
│   Push code     │     │   Repository    │     │    Workflow     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
               │   Build Image   │              │  Push to Docker │              │ Trigger Deploy  │
               │  (Multi-stage)  │─────────────▶│      Hub        │─────────────▶│    Webhook      │
               └─────────────────┘              └─────────────────┘              └────────┬────────┘
                        │                                                                 │
                        │  Cache layers                                                   ▼
                        ▼                                                        ┌─────────────────┐
               ┌─────────────────┐                                               │    CapRover     │
               │  Registry Cache │                                               │  Pull & Deploy  │
               │   (mode=max)    │                                               └────────┬────────┘
               └─────────────────┘                                                        │
                                                                                          ▼
                                                                                 ┌─────────────────┐
                                                                                 │   Synthropic App   │
                                                                                 │    Running      │
                                                                                 └─────────────────┘
```

## Open Questions

1. **Secrets Management**: Usar Docker secrets mount ou continuar com build args para variáveis públicas?
2. **Multi-arch Support**: Quando/se implementar suporte para ARM64?
3. **Trivy Integration**: Bloquear deploy em vulnerabilidades críticas ou apenas alertar?
4. **Notificações**: Integrar Slack/Discord para notificar sobre deploys?
