# Design: Dashboard Personalizada

## Context

O Synthropic precisa de uma dashboard que:
1. Mostre informações relevantes para cada tipo de usuário
2. Permita visão rápida do estado atual (status cards)
3. Ofereça detalhamento através de widgets
4. Seja personalizável (futuro)

A arquitetura deve considerar:
- Performance (agregações podem ser pesadas)
- Escalabilidade (mais widgets no futuro)
- Consistência visual (seguir padrões shadcn/ui)

## Goals / Non-Goals

### Goals
- Dashboard contextual (user vs admin)
- Status cards com métricas-chave
- Widgets de detalhamento com gráficos
- Cache para performance
- Hierarquia tipográfica consistente

### Non-Goals
- Dashboard em tempo real (WebSocket)
- Exportação de relatórios (feature separada)
- Dashboards customizáveis por drag-and-drop (fase futura)

## Decisions

### 1. Biblioteca de Gráficos: Recharts

**Decisão**: Usar Recharts para visualização de dados.

**Alternativas consideradas**:
- Chart.js - Mais leve, mas API menos React-friendly
- Nivo - Mais bonito, mas bundle maior
- Victory - Boa API, mas menos popular

**Rationale**: Recharts é React-first, bem documentado, bundle razoável (~150KB), e se integra bem com Tailwind.

### 2. Estrutura de Componentes

**Decisão**: Componentes wrapper para padronização.

```
components/
  ui/
    charts/
      mini-chart.tsx        # Wrappers Recharts
      index.ts

app/(dashboard)/dashboard/
  components/
    status-cards.tsx        # Cards de resumo
    widget-wrapper.tsx      # Container padrão
    widget-*.tsx            # Widgets específicos
  page.tsx                  # Página principal
```

### 3. Agregação de Dados

**Decisão**: Serviços backend com cache Redis.

```
backend/dashboard/
  services/
    dashboard/
      dashboard-usuario.service.ts   # Dados para user
      dashboard-admin.service.ts     # Dados para admin
    persistence/
      dashboard-*.persistence.ts     # Queries SQL
```

**Cache Strategy**:
- Dados de usuário: 5 min TTL (mais volátil)
- Métricas globais: 10 min TTL (menos volátil)
- Invalidação em: criação/baixa de expediente, nova audiência

### 4. API Design

**Decisão**: Endpoint único com dados contextuais.

```
GET /api/dashboard
Response (user):
{
  role: 'user',
  processos: ProcessosResumo,
  audiencias: AudienciasResumo,
  expedientes: ExpedientesResumo,
  produtividade: ProdutividadeResumo
}

Response (admin):
{
  role: 'admin',
  metricas: MetricasEscritorio,
  cargaUsuarios: CargaUsuario[],
  statusCapturas: StatusCaptura[],
  performance: PerformanceAdvogado[]
}
```

### 5. Nomenclatura Frontend

**Decisão**: Usar "Expedientes" em vez de "Pendentes de Manifestação".

**Rationale**:
- "Expedientes" é mais genérico e familiar para usuários
- Engloba tanto `pendentes_manifestacao` quanto `expedientes_manuais`
- Tabelas do banco mantêm nomes técnicos

### 6. Hierarquia Tipográfica

**Decisão**: Usar componentes Typography existentes.

```tsx
<Typography.H2 as="h1">Dashboard</Typography.H2>     // Título página
<Typography.H4>Detalhamento</Typography.H4>           // Seções
<Typography.Small>Texto auxiliar</Typography.Small>   // Labels
<Typography.Muted>Descrições</Typography.Muted>       // Subtítulos
```

## Risks / Trade-offs

### Performance de Agregação

**Risco**: Queries de agregação podem ser lentas com muitos dados.

**Mitigação**:
- Índices em `responsavel_id`, `data_audiencia`, `prazo_fatal`
- Cache Redis com TTL
- Limitar período de dados (últimos 30 dias para histórico)

### Complexidade de Manutenção

**Risco**: Muitos widgets aumentam complexidade.

**Mitigação**:
- WidgetWrapper padronizado
- Componentes de gráfico reutilizáveis
- Tipos TypeScript bem definidos

### Dados Desatualizados

**Risco**: Cache pode mostrar dados stale.

**Mitigação**:
- TTL curto (5-10 min)
- Botão de refresh manual
- Indicador de "última atualização"

## Migration Plan

1. **Fase atual**: Sandbox com dados mockados (CONCLUÍDO)
2. **Próxima fase**: Backend services + API
3. **Fase final**: Migrar sandbox para produção
4. **Cleanup**: Remover sandbox após validação

## Open Questions

1. Quais métricas específicas são mais importantes para admin?
2. Período padrão para gráficos de tendência (7 dias, 30 dias, 90 dias)?
3. Prioridade dos widgets de personalização (drag-and-drop)?
