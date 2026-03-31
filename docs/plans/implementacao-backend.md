# Plano de Implementacao: Mock → Dados Reais

## Visao Geral

Dois sistemas mock precisam de back-end real:
- **Partes** — CRM juridico visual (cards, pulse strip, filtros)
- **Dashboard** — 54 widgets com dados mock inline

---

## PLAN A: Partes — Mock → Real

### O que ja existe

| Recurso | Arquivo |
|---------|---------|
| `actionListarClientes` | `src/features/partes/actions/clientes-actions.ts` |
| `actionContarClientesComEstatisticas` | `src/features/partes/actions/clientes-actions.ts` |
| `actionContarClientesPorEstado` | `src/features/partes/actions/clientes-actions.ts` |
| `actionListarPartesContrarias` | `src/features/partes/actions/partes-contrarias-actions.ts` |
| `actionContarPartesContrariasComEstatisticas` | `src/features/partes/actions/partes-contrarias-actions.ts` |
| `actionListarTerceiros` | `src/features/partes/actions/terceiros-actions.ts` |
| `actionListarRepresentantes` | `src/features/partes/actions/representantes-actions.ts` |
| `useClientes`, `usePartesContrarias`, `useTerceiros`, `useRepresentantes` | `src/features/partes/hooks/` |

### Gaps

- Nao existe `countTerceiros()` nem `countRepresentantes()`
- Nao existe action agregada que retorne stats de todos os 4 tipos
- Nao existe adapter para tipo unificado `EntityCardData`

### O que criar (ordenado por dependencia)

| # | Acao | Arquivo | Complexidade |
|---|------|---------|--------------|
| 1 | Adicionar `countTerceiros` | `src/features/partes/repositories/terceiros-repository.ts` | Baixa |
| 2 | Adicionar `countRepresentantes` | `src/features/partes/repositories/representantes-repository.ts` | Baixa |
| 3 | Adicionar `contarTerceiros()`, `contarRepresentantes()` | `src/features/partes/service.ts` | Baixa |
| 4 | Criar `actionContarPartesPorTipo` | `src/features/partes/actions/partes-stats-actions.ts` | Media |
| 5 | Criar adapter `toEntityCardData` | `src/features/partes/adapters/entity-card-adapter.ts` | Media |
| 6 | Criar hook `usePartes` unificado | `src/features/partes/hooks/use-partes.ts` | Alta |
| 7 | Criar Client Component | `src/app/app/partes/partes-client.tsx` | Alta |
| 8 | Reescrever Server Component | `src/app/app/partes/page.tsx` | Media |

### Fluxo de dados

```
page.tsx (Server)
  ├── actionContarPartesPorTipo()  →  stats
  ├── actionListarClientes(page 1) →  dados iniciais
  └── <PartesClient initialStats={} initialData={} />
        ├── usePartes(params)  ←  reage a mudancas
        ├── <PulseStrip stats={} />
        ├── <TabPills active={tab} />
        ├── <SearchInput />
        ├── <EntityCard[] />
        └── <EntityDetail />
```

---

## PLAN B: Dashboard Widgets — Mock → Real

### Estrategia: Data Props + Wrapper Components

Cada widget mock se torna:
- **View** (componente puro, recebe props)
- **Wrapper** (busca dados via hooks, passa para view)

### Fase 1 — DEFAULT_LAYOUT (18 widgets, 3 sprints)

**Sprint 1 (5 widgets — dados prontos):**

| Widget | Fonte | Complexidade |
|--------|-------|--------------|
| `audiencias-proximas` | `useDashboard().proximasAudiencias` | Baixa |
| `expedientes-urgency-list` | `useDashboard().expedientesUrgentes` | Baixa |
| `financeiro-fluxo-tabs` | `useFluxoCaixa()` | Baixa |
| `financeiro-despesas-treemap` | `useDespesasPorCategoria()` | Baixa |
| `financeiro-inadimplencia` | `useDashboardFinanceiro()` | Baixa |

**Sprint 2 (7 widgets — composicao de hooks):**

| Widget | Fonte | Complexidade |
|--------|-------|--------------|
| `pessoal-produtividade-semanal` | `useDashboard().produtividade.porDia` | Baixa |
| `pessoal-lembretes` | `useReminders()` | Baixa |
| `financeiro-saude-financeira` | `useDashboardFinanceiro()` + `useFluxoCaixa()` | Media |
| `processos-saude-processual` | `useDashboard().processosResumo` | Media |
| `pessoal-score-pessoal` | Novo `useProgressoDiario()` + composicao | Media |
| `pessoal-meu-dia` | `useDashboard()` + `useReminders()` + tarefas | Media |
| `pessoal-foco-hoje` | Composicao de urgentes + audiencias + tarefas | Media |

**Sprint 3 (6 widgets — novos repos):**

| Widget | O que falta | Complexidade |
|--------|-------------|--------------|
| `pessoal-tarefas-status` | `useTarefasResumo()` | Media |
| `expedientes-aging-funnel` | `buscarExpedientesPorFaixa()` | Media |
| `processos-heatmap-atividade` | `buscarHeatmapMovimentacoes()` | Media |
| `audiencias-preparacao` | Repo preparacao + hook | Alta |
| `contratos-saude-contratual` | `useContratosResumo()` | Alta |
| `contratos-obrigacoes-treemap` | Repo obrigacoes + hook | Media |

### Fase 2 — Widgets secundarios (36 restantes)

Migrar por modulo, reusando data sources da Fase 1.

### Novos hooks/repos necessarios

| Arquivo | O que faz |
|---------|-----------|
| `hooks/use-progresso-diario.ts` | Client hook para progresso do dia |
| `hooks/use-contratos-resumo.ts` | Metricas de contratos |
| `actions/progresso-diario-actions.ts` | Action wrapping repo |
| `repositories/processos-metrics.ts` — add `buscarHeatmapMovimentacoes` | Movimentacoes por dia |
| `repositories/expedientes-metrics.ts` — add `buscarExpedientesPorFaixa` | Expedientes por faixa |
| `widgets/types.ts` | Interfaces de props para cada widget |
| `widgets/shared/widget-skeleton.tsx` | Skeleton por tamanho |
