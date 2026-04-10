# ZattarOS

## What This Is

Sistema corporativo para firmas legais (Synthropic). Modulos de Audiencias, Expedientes, Processos, Chat e Dashboard ja implementados com design system "Glass Briefing". O foco atual e a revisao completa do modulo de Audiencias para corrigir gaps de dados, redesenhar views e conectar componentes existentes.

## Core Value

Gestao eficiente de audiencias judiciais com visualizacao completa de dados, preparo e historico — coerente com o design system Glass Briefing.

## Current Milestone: v1.1 Revisao Completa — Audiencias

**Goal:** Revisao e aprimoramento completo do modulo de audiencias: detail dialog, redesign visual das views, wiring de componentes, indicadores faltantes e filtros avancados.

**Target features:**
- Detail Dialog substituindo detail sheet (com historico de alteracoes)
- Redesign das views Lista, Mes e Ano para Glass Briefing
- Wiring de PostHearingFlow, ConflictAlert e MissionCard actions
- Indicadores visuais: sigilo, juizo digital, designada, documento ativo, litisconsorcio, presenca hibrida
- Edicao de link virtual e endereco presencial
- Acesso direto a ata de audiencia
- Filtros avancados (sigilo, preparo, URL, ata)
- Cleanup de componentes legados

## Requirements

### Validated

- ✓ Listagem de audiencias com paginacao e filtros basicos — existente
- ✓ 5 views: Quadro/Missao, Semana, Mes, Ano, Lista — existente
- ✓ Detail sheet com informacoes da audiencia — existente (sera substituido por dialog)
- ✓ KPI strip com metricas semanais — existente
- ✓ Prep score com calculo ponderado (6 itens) — existente
- ✓ Badges semanticos para status, modalidade, TRT, grau — existente
- ✓ Formulario de criacao/edicao de audiencia — existente
- ✓ Integracao PJE com captura automatica — existente
- ✓ Countdown em tempo real para proxima audiencia — existente
- ✓ Hook unificado (useAudienciasUnified) com date range por view — existente

### Active

- [ ] Detail Dialog com todas as secoes + historico de alteracoes
- [ ] Redesign Lista View com Glass Briefing
- [ ] Redesign Mes View com Glass Briefing
- [ ] Redesign Ano View com Glass Briefing
- [ ] Wiring PostHearingFlow no client
- [ ] Wiring ConflictAlert no client
- [ ] Wiring MissionCard quick actions
- [ ] Indicadores visuais completos (sigilo, juizo digital, designada, etc.)
- [ ] Edicao de link virtual e endereco presencial
- [ ] Acesso direto a ata de audiencia
- [ ] Filtros avancados
- [ ] Cleanup de componentes legados

### Out of Scope

- Mudancas no schema do banco de dados — nenhuma migracao
- Alteracoes na logica de negocio (service.ts, repository.ts) — apenas visual e wiring
- Redesign do modulo de Chat — milestone separado (v1.0)
- Novas server actions — aproveitar as existentes
- Integracao com documento PJE via documento_ativo — flag booleana sem documento real

## Context

O modulo de audiencias ja foi refatorado para o design system Glass Briefing na view Quadro/Missao, mas as views Lista, Mes e Ano ficaram parcialmente implementadas. Auditoria revelou:

- 33 campos no DB, varios sem representacao visual (sigilo, juizo digital, designada, litisconsorcio)
- PostHearingFlow e ConflictAlert codificados mas nunca renderizados no client
- MissionCard com 4 quick actions sem callbacks conectados
- Detail sheet atual nao mostra historico de alteracoes (dados_anteriores)
- 4 componentes legados no diretorio sem uso
- Badges hardcoded em vez de SemanticBadge em varias views

Mocks aprovados em `.mocks/` (4 HTMLs: lista, mes, ano, dialog).

`documento_ativo` e flag PJE (nao aponta para documento real). Ata via `url_ata_audiencia`.
`designada` e independente do status (M/F/C) — conceito PJE separado.

## Constraints

- **Stack**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui — manter
- **Componentes shared**: Reutilizar GlassPanel, SemanticBadge, TabPills, SearchInput, IconContainer, Heading, Text, DialogFormShell
- **FSD Architecture**: Manter modulo em `src/app/(authenticated)/audiencias/`
- **Zero regressao**: Todas as features atuais devem continuar funcionando
- **Performance**: Manter Suspense boundaries e lazy loading
- **Mocks**: Implementacao deve seguir os mocks aprovados em `.mocks/`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Detail Sheet → Dialog centrado | Sheet lateral limitava espaco para historico e secoes adicionais | — Pending |
| documento_ativo como indicador visual simples | Flag PJE sem documento real vinculado; ata e o documento acessivel | — Pending |
| designada como badge independente | PJE distingue "marcada" vs "designada" — sao conceitos separados | — Pending |
| Mocks HTML para aprovacao pre-implementacao | Validar visual antes de codar, reduzir retrabalho | ✓ Good |
| Historico via dados_anteriores em timeline | Campo JSON ja armazena estado anterior, so falta UI | — Pending |
| Presenca hibrida com badge explicativo | Caso mais complexo precisa indicar quem e presencial e quem e virtual | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 04 (detail-panel-preservation) complete — Chat Redesign v1.0 milestone complete. ChatDetailPanel wired inline (xl+ screens) with avatar, online status, glass card sections. Header toggle via Zustand toggleProfileSheet. Mobile UserDetailSheet preserved. All automated regression checks passed (TypeScript clean, FSD clean, Suspense/lazy intact).*
