# Processo Cockpit — Design Spec

> Redesign da página de visualização de processo (`/processos/[id]`) transformando-a de um document viewer com sidebar em um **cockpit de inteligência processual** com consciência temporal.

**Data:** 2026-04-05
**Módulo:** `src/app/(authenticated)/processos/`
**Referência de design:** Audiências (Glass Briefing), Partes (Glass Briefing)

---

## 1. Problema

A página atual do processo é funcional mas apresenta gaps de experiência:

| Gap | Impacto |
|-----|---------|
| Header pesado (~150px) empurra timeline para baixo | Advogado não vê o conteúdo útil imediatamente |
| Timeline é lista plana sem agrupamento | Difícil navegar em processos com 100+ movimentações |
| Sem noção temporal ("onde estamos no processo") | Advogado não distingue passado de futuro rapidamente |
| Expedientes/audiências/perícias em tabs colapsáveis | Informação urgente (prazos vencendo) fica escondida |
| Design antigo (`border bg-card shadow-sm`) | Inconsistente com Glass Briefing de partes/audiências |
| Sem filtros inline na timeline | Só CMD+K para buscar, sem filtro por tipo |
| Sem indicador de novidades | Advogado não sabe o que mudou desde última visita |

## 2. Visão

Transformar a visualização do processo em um **centro de comando** com 3 zonas:

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONA 1: Case Identity Bar (compacta, ~48px, glass)            │
│  ← │ Partes │ Nº │ TRT │ Graus │ 🔒 │ [Avatar] │ ⟳           │
├────────────────┬────────────────────────────────────────────────┤
│                │  Attention Strip (GlassPanel depth=2)          │
│  ZONA 2        │  ┌──────┬──────┬──────┐                       │
│  PULSE         │  │⏱ Aud │📋 Exp│🔬 Per│  KPI-style urgency   │
│  TIMELINE      │  └──────┴──────┴──────┘                       │
│                ├────────────────────────────────────────────────┤
│  ┌───────┐     │                                                │
│  │Filtros│     │  ZONA 3: Workspace                             │
│  ├───────┤     │                                                │
│  │Futuro │     │  Document Viewer / Event Detail                │
│  │  ▲▲▲  │     │                                                │
│  │═AGORA═│     │                                                │
│  │  ▼▼▼  │     │                                                │
│  │Passado│     │                                                │
│  └───────┘     │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

## 3. Zona 1 — Case Identity Bar

### Objetivo
Condensar o header atual de ~150px em uma barra compacta de ~48px que mantém toda informação essencial.

### Layout
```
GlassPanel depth=1, px-4 py-2.5, flex items-center gap-3
├─ BackButton (ghost, icon-sm)
├─ Partes (text-base font-heading font-semibold, truncate, max-w-[40%])
├─ Separator (w-px h-5 bg-border/10)
├─ NúmeroProcesso (font-mono text-sm + CopyButton inline)
├─ TribunalBadge (SemanticBadge, text-[10px])
├─ GrauBadges (text-[10px], inline)
├─ SegredoJustiça (Lock icon, conditional)
├─ Spacer (flex-1)
├─ ProximaAudienciaPopover (se houver)
├─ Instâncias badge (se multi-instância)
├─ ResponsávelAvatar (h-7 w-7, click to change)
├─ RefreshTimeline (ghost icon button)
└─ CMD+K hint (kbd badge)
```

### Modo Reading-Focused
Colapsa para breadcrumb mínimo: `Nº Processo │ Partes (truncado)` em uma única linha de ~32px.

### Componente
`CaseIdentityBar` — novo componente, substitui `ProcessoHeader` neste contexto.

**Props:**
```typescript
interface CaseIdentityBarProps {
  processo: ProcessoUnificado;
  instancias?: InstanciaInfo[];
  isCapturing?: boolean;
  isReadingFocused?: boolean;
  usuarios: Usuario[];
  onVoltar: () => void;
  onAtualizarTimeline: () => void;
  onOpenSearch: () => void;
}
```

## 4. Zona 2 — Pulse Timeline

### 4.1 Timeline Header com Filtros Inline

```
GlassPanel-like header, border-b, px-3 py-2.5
├─ Contagens (text-xs muted): "42 docs · 87 movs"
├─ FilterChips (padrão TabPills)
│   └─ flex gap-1 p-1 rounded-xl bg-border/6
│   └─ Chips: Todos | Docs | Decisões | Recursos | Citações | Audiências
│   └─ Active: bg-primary/12 text-primary shadow-sm
│   └─ Inactive: text-muted-foreground/50 hover:bg-white/4
├─ GrauFilter (toggle secundário, opcional)
│   └─ 1º | 2º | TST (se multi-instância)
└─ CMD+K kbd hint
```

**Componente:** `TimelineFilterChips`

**Props:**
```typescript
interface TimelineFilterChipsProps {
  counts: { docs: number; movs: number; total: number };
  activeFilter: TimelineFilterType;
  onFilterChange: (filter: TimelineFilterType) => void;
  graus?: GrauProcesso[]; // só se multi-instância
  activeGrau?: GrauProcesso | 'todos';
  onGrauChange?: (grau: GrauProcesso | 'todos') => void;
}

type TimelineFilterType = 'todos' | 'documentos' | 'decisoes' | 'recursos' | 'citacoes' | 'audiencias';
```

### 4.2 Agrupamento por Mês

Items agrupados por mês com headers sticky:

```
── Abril 2026 ──────────── (sticky, backdrop-blur-sm bg-background/80)
● Sentença publicada          02/04
● Contestação juntada         01/04

── Março 2026 ──────────── (sticky)
● Despacho                    28/03
```

**Headers de mês:**
- Container: `sticky top-0 z-10 backdrop-blur-sm bg-background/80`
- Texto: `text-[9px] uppercase tracking-wider text-muted-foreground/40 font-semibold`
- Linha decorativa: `h-px bg-border/10 flex-1` (ao lado do texto)
- Click no header colapsa/expande o mês (accordion behavior)

**Componente:** `TimelineMonthGroup`

**Props:**
```typescript
interface TimelineMonthGroupProps {
  label: string; // "Abril 2026"
  items: TimelineItemUnificado[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  defaultExpanded?: boolean;
}
```

### 4.3 Marcador AGORA

Separador visual pulsante que divide a timeline em futuro e passado.

**Layout:**
```
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
        ◉ Hoje — 05 abr 2026
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

**CSS:**
- Linhas: `h-px bg-primary/20` com gradiente nas pontas (`bg-gradient-to-r from-transparent via-primary/20 to-transparent`)
- Dot: `size-2.5 rounded-full bg-primary animate-pulse`
- Label: `text-[10px] font-medium text-primary/70 uppercase tracking-wider`
- Container: `py-3 px-2`

**Comportamento:**
- Posicionado entre o item futuro mais próximo e o item passado mais recente
- Ao abrir o processo, scroll automático para centralizar AGORA na viewport da sidebar
- Se não há itens futuros, AGORA fica no topo da lista
- Se não há itens passados, AGORA fica no final

**Itens ACIMA do AGORA (futuros):**
- Incluem: próximas audiências agendadas, prazos de expedientes não vencidos, perícias pendentes
- Visual diferenciado: círculo do timeline item é **vazado** (`border-2 border-{color} bg-transparent` em vez de preenchido)
- Texto com `opacity-70`
- Ordenados ascendente (mais próximo do hoje = mais perto do AGORA)
- Dados: vêm dos dados complementares (audiências, expedientes com prazo)

**Itens ABAIXO do AGORA (passados):**
- Movimentações e documentos da timeline existente
- Visual atual: círculos preenchidos com cores tipadas
- Ordenados descendente (mais recente primeiro)

**Componente:** `TimelineNowMarker`

```typescript
interface TimelineNowMarkerProps {
  className?: string;
}
```

### 4.4 Indicadores "NOVO"

Quando items são mais recentes que a última visita do advogado.

**Implementação:**
- `localStorage` key: `processo_last_visit_${processoId}` = ISO timestamp
- Salvar timestamp ao abrir o processo
- Items com `item.data > lastVisitDate` recebem badge "NOVO"

**Badge visual:**
- `text-[8px] font-bold uppercase bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full`
- Posicionado inline após o badge de tipo
- Desaparece ao clicar no item (marca como "visto" em state local)

### 4.5 Phase Markers (Marcos Processuais)

Marcadores visuais de fase no fluxo processual, detectados por heurística.

**Fases detectáveis:**
| Fase | Termos trigger |
|------|---------------|
| Recurso | agravo, recurso, embargo, apelação |
| Sentença | sentença, acórdão, julgamento |
| Instrução | audiência, perícia, prova, testemunha, oitiva, inspeção |
| Conhecimento | petição inicial, distribuição, citação |

**Visual:**
```
━━━ ⚖ FASE: SENTENÇA ━━━━━━━━━━━━
```
- Texto: `text-[9px] uppercase tracking-[0.15em] text-muted-foreground/30 font-bold`
- Linha: `h-px bg-border/8`
- Ícone: Lucide icon correspondente, `size-3 text-muted-foreground/25`
- Aparece na primeira ocorrência de um termo da fase na timeline descendente

**Componente:** `TimelinePhaseMarker`

```typescript
interface TimelinePhaseMarkerProps {
  phase: 'recurso' | 'sentenca' | 'instrucao' | 'conhecimento';
}
```

### 4.6 Componente Orquestrador: PulseTimeline

Substitui `TimelineSidebar`. Orquestra filtros, agrupamento, AGORA, e phases.

```typescript
interface PulseTimelineProps {
  items: TimelineItemUnificado[];
  futureItems?: FutureTimelineItem[]; // audiências, prazos, perícias
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  onSelectFutureItem?: (item: FutureTimelineItem) => void; // abre detail no workspace
  processoId: number;
  graus?: GrauProcesso[];
  className?: string;
}
```

**Lógica interna:**
1. Recebe items + futureItems
2. Aplica filtro ativo (tipo, grau)
3. Divide em futuros (data > hoje) e passados (data <= hoje)
4. Agrupa cada conjunto por mês
5. Renderiza: Filtros → Futuros (asc) → AGORA → Passados (desc) → "Início do processo"
6. Auto-scroll para AGORA via `useEffect` + `scrollIntoView`

## 5. Attention Strip

### Objetivo
Substituir `ProcessoDetailsTabs` (tabs colapsáveis) por uma superfície proativa que mostra apenas itens urgentes.

### Layout
```
GlassPanel depth=2, flex items-stretch gap-0
├─ Card: Próxima Audiência (se houver)
│   ├─ Countdown com cores de urgência (padrão MissionCard)
│   ├─ Tipo + data/hora
│   ├─ TRT + modalidade
│   └─ Quick actions: [Entrar sala] [Ver processo]
│
├─ Divider (w-px bg-border/10)
│
├─ Card: Expedientes Urgentes (se houver prazos vencendo/vencidos)
│   ├─ Contagem: "2 prazos vencendo"
│   ├─ Badges: destructive (vencido), warning (vencendo)
│   └─ [Ver expedientes]
│
├─ Divider (w-px bg-border/10)
│
├─ Card: Perícias Pendentes (se houver)
│   ├─ Contagem + status
│   └─ [Ver perícias]
│
└─ Spacer + [Ver todos detalhes] → abre AllDetailsSheet
```

**Regras de visibilidade:**
- Se nenhum item urgente, o strip **não renderiza** (return null)
- Cada card individual só aparece se tem dados relevantes
- "Urgente" = audiência < 7 dias, expediente com prazo < 5 dias ou vencido, perícia pendente

### Componente: AttentionStrip

```typescript
interface AttentionStripProps {
  audiencias: Audiencia[];
  expedientes: Expediente[];
  pericias: Pericia[];
  onOpenAllDetails: () => void;
  onOpenAudiencia?: (audiencia: Audiencia) => void;
}
```

### AllDetailsSheet

Sheet lateral (right, w-full sm:w-135 md:w-155) que mostra TODOS os detalhes complementares com tabs, substituindo o acesso completo que `ProcessoDetailsTabs` oferecia.

```typescript
interface AllDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: number;
  numeroProcesso: string;
  usuariosMap: Map<number, UsuarioInfo>;
}
```

Internamente, reutiliza os componentes existentes `AudienciasTable`, `ExpedientesTable`, `PericiasTable` de `processo-details-tabs.tsx`, reorganizados dentro do layout do DetailSheet.

## 6. Zona 3 — Workspace (Document Viewer)

### Migrações de Estilo
O `DocumentViewer` existente recebe ajustes visuais para Glass Briefing:

- Toolbar flutuante: `backdrop-blur-sm bg-background/80 border-border/20 rounded-xl`
- Background: `glass-widget` no container (em vez de `bg-background`)
- Pagination pill: já flutuante, manter

### Sem Mudanças Funcionais
O viewer de documentos, annotations, zoom, e pagination funcionam bem. Não há mudanças funcionais, apenas migração visual.

## 7. Layout Orquestrador (ProcessoVisualizacao)

### Estrutura Revisada

```tsx
<div className="flex w-full min-h-[calc(100vh-7rem)] flex-col">
  {/* Zona 1 — sempre visível */}
  <CaseIdentityBar ... />

  {/* Container principal — flex-1 */}
  <div className="flex-1 min-h-0 flex flex-col">

    {/* Attention Strip — condicional */}
    {hasUrgentItems && <AttentionStrip ... />}

    {/* Split panel — flex-1 */}
    <div className="hidden md:flex flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={24} minSize={18} maxSize={38}>
          <PulseTimeline ... />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={76} minSize={50}>
          <DocumentViewer ... />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>

    {/* Mobile — tabs */}
    <div className="md:hidden flex-1 min-h-0">
      <Tabs ...>
        <TabsList>Timeline | Documento</TabsList>
        <TabsContent value="timeline"><PulseTimeline /></TabsContent>
        <TabsContent value="documento"><DocumentViewer /></TabsContent>
      </Tabs>
    </div>
  </div>
</div>
```

### Mudanças vs. Atual
- `ProcessoHeader` → `CaseIdentityBar` (compacto)
- `ProcessoDetailsTabs` → `AttentionStrip` + `AllDetailsSheet`
- `TimelineSidebar` → `PulseTimeline`
- Container externo: remove `rounded-2xl border bg-card shadow-sm`, usa glass styling
- Remove `section` wrapper, layout mais flat

## 8. Dados e Estado

### Dados já disponíveis (sem novas server actions)
- `useProcessoTimeline(id)` → processo, timeline, isLoading, isCapturing
- `actionObterDetalhesComplementaresProcesso(id, numero)` → audiências, expedientes, perícias
- `actionListarUsuarios()` → usuários

### Novo estado local
- `activeFilter: TimelineFilterType` — filtro de tipo na timeline
- `activeGrau: GrauProcesso | 'todos'` — filtro de grau
- `lastVisitDate: string` — de localStorage, para badges "NOVO"
- `isAllDetailsOpen: boolean` — controle do AllDetailsSheet

### FutureTimelineItems
Items futuros são derivados dos dados complementares:
```typescript
interface FutureTimelineItem {
  id: string; // prefixo 'aud_' ou 'exp_' ou 'per_' + id
  tipo: 'audiencia' | 'expediente' | 'pericia';
  data: string; // ISO date
  titulo: string;
  meta?: Record<string, unknown>;
}
```

Construídos via `useMemo` a partir de audiências futuras, expedientes com prazo pendente, e perícias pendentes.

## 9. Componentes — Resumo de Criação/Modificação

### Novos
| Componente | Arquivo |
|-----------|---------|
| `CaseIdentityBar` | `components/cockpit/case-identity-bar.tsx` |
| `AttentionStrip` | `components/cockpit/attention-strip.tsx` |
| `PulseTimeline` | `components/cockpit/pulse-timeline.tsx` |
| `TimelineFilterChips` | `components/cockpit/timeline-filter-chips.tsx` |
| `TimelineMonthGroup` | `components/cockpit/timeline-month-group.tsx` |
| `TimelineNowMarker` | `components/cockpit/timeline-now-marker.tsx` |
| `TimelinePhaseMarker` | `components/cockpit/timeline-phase-marker.tsx` |
| `AllDetailsSheet` | `components/cockpit/all-details-sheet.tsx` |

Todos os novos componentes vivem em `src/app/(authenticated)/processos/components/cockpit/`.

### Modificados
| Componente | Mudança |
|-----------|---------|
| `ProcessoVisualizacao` | Reescrita do layout orquestrador |
| `TimelineSidebarItem` | Suporte a estilo futuro/passado + badge NOVO |
| `DocumentViewer` | Migração visual para glass styling |
| `ViewerToolbar` | Glass styling |

### Sem Mudanças
| Componente | Razão |
|-----------|-------|
| `TimelineSearchModal` | Funciona bem como está |
| `EventDetailDrawer` | Funciona bem, apenas glass styling opcional |
| `PDFViewerCanvas` | Sem mudanças |
| `DocumentAnnotationOverlay` | Sem mudanças |

## 10. Acessibilidade

- `CaseIdentityBar`: landmarks `<header role="banner">`
- `PulseTimeline`: `role="listbox"` com `aria-label="Timeline do processo"`
- `TimelineNowMarker`: `role="separator"` com `aria-label="Momento atual"`
- Filter chips: `role="tablist"` com `aria-selected`
- Month groups: `role="group"` com `aria-label="Mês: Abril 2026"`
- Keyboard: Tab entre filtros → Tab para lista → Arrow keys entre items → Enter para selecionar
- `prefers-reduced-motion`: desabilitar `animate-pulse` no AGORA marker

## 11. Responsividade

| Breakpoint | Comportamento |
|-----------|---------------|
| < md (mobile) | Tabs Timeline/Documento, Identity bar compacta, Attention Strip empilhado vertical |
| md-lg | Split panel com resize, Identity bar completa |
| > lg | Split panel com mais espaço, detail sheet pode coexistir |

## 12. Fora de Escopo

- AI Summary Panel no viewer (melhoria futura)
- Keyboard shortcuts além de CMD+K (melhoria futura)
- Heatmap de atividade na timeline (melhoria futura)
- Swipe gestures no mobile (melhoria futura)
