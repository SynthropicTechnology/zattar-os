# Processos Listagem — Glass Briefing Redesign

> Migração da listagem de processos (`/processos`) do padrão DataShell/DataTable para o design system Glass Briefing, seguindo os padrões implementados em Partes e Audiências.

**Data:** 2026-04-05
**Módulo:** `src/app/(authenticated)/processos/`
**Referência de design:** Partes (`partes-client.tsx`), Audiências (`audiencias-client.tsx`)

---

## 1. Problema

A listagem de processos usa o padrão antigo DataShell/DataTable:

| Aspecto | Atual (DataShell) | Novo (Glass Briefing) |
|---------|-------------------|----------------------|
| Container | `PageShell` + DataTable | `max-w-350 mx-auto space-y-5` |
| Métricas | Não existe | PulseStrip com KPIs do acervo |
| Filtros | Toolbar com selects e inputs | TabPills + SearchInput compactos |
| Visualização | Tabela única | Cards + Lista + Tabela (ViewToggle) |
| Cards | Não existe | ProcessoCard glass com dados essenciais |
| Detail | Navega para `/processos/[id]` | ProcessoDetailSheet (preview rápido) + navegação |
| Estilo | `border bg-card shadow-sm` | Glass Briefing (glass-widget, glass-kpi) |
| Insights | Não existe | InsightBanner para alertas proativos |

## 2. Layout Alvo

Segue o padrão exato de Partes/Audiências:

```
┌─────────────────────────────────────────────────────┐
│  max-w-350 mx-auto space-y-5                        │
│                                                      │
│  1. HEADER                                           │
│     ├─ h1 "Processos" (text-2xl font-heading)       │
│     ├─ subtitle "1.247 processos · 892 ativos"      │
│     └─ [+ Novo Processo] button                      │
│                                                      │
│  2. PULSE STRIP (GlassPanel depth=2)                │
│     ├─ Ativos │ Pendentes │ Em Recurso │ Arquivados │
│     └─ Cada com ícone, número animado, barra %      │
│                                                      │
│  3. INSIGHT BANNER (condicional)                     │
│     └─ "42 processos sem responsável atribuído"      │
│                                                      │
│  4. VIEW CONTROLS                                    │
│     ├─ TabPills: Todos │ Meus │ Sem Resp │ Urgentes │
│     ├─ SearchInput (w-56)                            │
│     └─ ViewToggle: Cards │ Lista │ Tabela            │
│                                                      │
│  5. CONTENT AREA                                     │
│     ├─ Cards: grid 1→2→3 colunas                    │
│     ├─ Lista: rows compactos                         │
│     └─ Tabela: DataTable tradicional (preservado)    │
│                                                      │
│  6. PAGINATION                                       │
│     └─ "1–50 de 1.247" + prev/next                  │
│                                                      │
│  7. DETAIL SHEET (opcional, slide right)             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 3. Header

### Layout
```tsx
<div className="flex items-end justify-between">
  <div>
    <h1 className="text-2xl font-heading font-semibold tracking-tight">
      Processos
    </h1>
    <p className="text-sm text-muted-foreground/50 mt-0.5">
      {total} processos · {ativos} ativos
    </p>
  </div>
  <Button size="icon" className="h-9 w-9 bg-card">
    <Plus className="size-4" />
  </Button>
</div>
```

O botão abre o `ProcessoForm` existente (dialog de criação manual).

## 4. Pulse Strip — KPIs do Acervo

### Métricas

| Métrica | Ícone | Cálculo |
|---------|-------|---------|
| Ativos | `Scale` | `count WHERE codigoStatusProcesso = 'ATIVO'` |
| Pendentes | `Clock` | `count WHERE codigoStatusProcesso = 'PENDENTE'` |
| Em Recurso | `ArrowUpRight` | `count WHERE codigoStatusProcesso = 'EM_RECURSO'` |
| Arquivados | `Archive` | `count WHERE origem = 'arquivado'` |

### Componente

Reutiliza `PulseStrip` existente (`src/components/dashboard/pulse-strip.tsx`).

```typescript
interface ProcessosPulseStripProps {
  stats: {
    ativos: number;
    pendentes: number;
    emRecurso: number;
    arquivados: number;
    total: number;
  };
}
```

**Layout:** `grid grid-cols-2 lg:grid-cols-4 gap-3`

Cada card segue o padrão PulseStrip:
- `GlassPanel depth=1`, `px-4 py-3`
- Label: `text-[10px] font-medium text-muted-foreground/60 uppercase`
- Valor: `font-display text-xl font-bold tabular-nums`
- Barra proporcional: `h-1 rounded-full bg-muted/30` com fill `bg-{color}/25`
- Percentual: `text-[9px] text-muted-foreground/50`

### Dados
Os stats são derivados da resposta de `actionListarProcessos` que já retorna `totalRegistros`. Para os breakdowns por status, uma nova server action `actionObterEstatisticasProcessos` é necessária (query simples com `GROUP BY codigoStatusProcesso`).

```typescript
// Nova action
export const actionObterEstatisticasProcessos = authenticatedAction
  .schema(z.object({}))
  .action(async () => {
    return obterEstatisticasProcessos(); // service.ts
  });

// service.ts
export async function obterEstatisticasProcessos() {
  // Single query: SELECT codigo_status_processo, count(*) FROM processos GROUP BY 1
  // + SELECT count(*) FROM processos WHERE origem = 'arquivado'
}
```

## 5. Insight Banner

Banners proativos baseados em condições detectáveis:

| Condição | Tipo | Mensagem |
|----------|------|----------|
| Processos sem responsável | `warning` | "{N} processos sem responsável atribuído" |
| Processos com audiência < 7 dias | `alert` | "{N} processos com audiência nos próximos 7 dias" |
| Prazos vencidos | `alert` | "{N} processos com prazos de expedientes vencidos" |

### Visual (padrão existente)
```tsx
<div className="rounded-lg border border-{type}/10 bg-{type}/4
               px-3.5 py-2 text-[11px] font-medium text-{type}/70
               flex items-center gap-2 hover:bg-{type}/6
               transition-colors cursor-pointer">
  <AlertCircle className="size-3.5 shrink-0" />
  <span>{mensagem}</span>
  <ChevronRight className="size-3 ml-auto shrink-0" />
</div>
```

Click no banner aplica o filtro correspondente (ex: sem responsável → ativa filtro `semResponsavel`).

### Dados
Estes counts podem ser derivados dos stats já calculados ou via campo adicional na action de estatísticas.

## 6. View Controls

### TabPills (Filtros de Categoria)

```
┌──────────────────────────────────────────────────┐
│ Todos(1247) │ Meus(89) │ Sem Resp(42) │ Urgentes │
└──────────────────────────────────────────────────┘
```

Reutiliza `TabPills` existente (`src/components/dashboard/tab-pills.tsx`).

| Tab | Filtro aplicado |
|-----|----------------|
| Todos | Sem filtro |
| Meus | `responsavelId = currentUserId` |
| Sem Responsável | `semResponsavel = true` |
| Urgentes | `temProximaAudiencia = true` (próx 7 dias) OU expedientes vencendo |

Cada tab mostra count entre parênteses: `text-[10px] tabular-nums`.

### SearchInput
Reutiliza `SearchInput` existente (`src/components/dashboard/search-input.tsx`).
- Width: `w-56`
- Debounce: 500ms (já implementado no wrapper atual)
- Busca em: número do processo, nome das partes, órgão julgador

### ViewToggle
Reutiliza `ViewToggle` existente (`src/components/dashboard/view-toggle.tsx`).

3 modos:
| Modo | Ícone | Componente |
|------|-------|-----------|
| Cards | `LayoutGrid` | `ProcessoCard` em grid |
| Lista | `List` | `ProcessoListRow` compacto |
| Tabela | `Table2` | DataTable existente (migrado para glass) |

**Persistência:** Modo salvo em `localStorage` key `processos_view_mode`.

## 7. Content Area

### 7.1 Card View — ProcessoCard

Segue o padrão `EntityCard` de partes, adaptado para processos.

```
GlassPanel depth=1, p-4, cursor-pointer, group
├─ Header
│   ├─ Avatar (size-10 rounded-xl bg-{statusColor}/8)
│   │   └─ Scale icon (size-5 text-{statusColor}/50)
│   ├─ Content
│   │   ├─ Partes (text-sm font-semibold truncate)
│   │   │   └─ "Silva vs. Empresa X"
│   │   ├─ Número (text-[10px] font-mono text-muted-foreground/55 tabular-nums)
│   │   │   └─ "1002345-67.2023.5.03.0022" + CopyButton
│   │   └─ Badges row
│   │       ├─ TribunalBadge (text-[9px])
│   │       ├─ GrauBadge (text-[9px])
│   │       └─ StatusBadge (text-[9px])
│
├─ Info Section (mt-3 space-y-1)
│   ├─ InfoLine: icon=Building2, text=órgãoJulgador
│   ├─ InfoLine: icon=Calendar, text=dataAutuação (formatada)
│   └─ InfoLine: icon=User, text=classeJudicial
│
├─ Urgency Section (mt-3 pt-3 border-t border-border/10, condicional)
│   ├─ Se tem próxima audiência:
│   │   └─ Calendar icon + "Audiência em 3 dias" (text-[10px] text-warning)
│   └─ Se tem prazo vencendo:
│       └─ AlertTriangle icon + "Prazo vencendo" (text-[10px] text-destructive)
│
├─ Tags (mt-2, se houver)
│   └─ TagBadgeList (max 3 tags, text-[9px])
│
└─ Footer (flex items-center justify-between mt-2 pt-2 border-t border-border/10)
    ├─ Responsável: Avatar h-6 w-6 + nome (text-[9px])
    └─ Timestamp: Clock icon + timeAgo (text-[9px] muted)
```

**Status → Cor:**
```typescript
const STATUS_COLOR: Record<StatusProcesso, string> = {
  ATIVO: 'primary',
  PENDENTE: 'warning',
  EM_RECURSO: 'info',
  SUSPENSO: 'muted-foreground',
  ARQUIVADO: 'muted-foreground',
  EXTINTO: 'muted-foreground',
  BAIXADO: 'muted-foreground',
  OUTRO: 'muted-foreground',
};
```

**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`

**Props:**
```typescript
interface ProcessoCardProps {
  processo: ProcessoUnificado;
  tags?: Tag[];
  responsavel?: UsuarioInfo;
  isSelected?: boolean;
  onClick: () => void;
}
```

### 7.2 List View — ProcessoListRow

Segue o padrão `EntityListRow` de partes.

```
button, w-full, flex items-center gap-3, px-4 py-2.5, rounded-xl
├─ Status dot (size-2.5 rounded-full bg-{statusColor}/50)
├─ Icon (size-8 rounded-lg bg-primary/8 → Scale icon size-3.5 primary/50)
├─ Main info (flex-1 min-w-0)
│   ├─ Partes (text-xs font-medium truncate)
│   └─ Número (text-[10px] muted/55 font-mono tabular-nums)
├─ TRT badge (text-[9px], shrink-0, hidden sm:block)
├─ Grau badge (text-[9px], shrink-0, hidden sm:block)
├─ Status badge (text-[9px], shrink-0, hidden md:block)
├─ Responsável avatar (h-6 w-6, shrink-0)
├─ Data autuação (text-[10px] font-medium, hidden lg:block, w-20 text-right)
└─ ChevronRight (size-3.5 muted/60)
```

**Selected:** `bg-primary/6 border border-primary/15`
**Hover:** `hover:bg-white/4 border border-transparent`

**Props:**
```typescript
interface ProcessoListRowProps {
  processo: ProcessoUnificado;
  responsavel?: UsuarioInfo;
  isSelected?: boolean;
  onClick: () => void;
}
```

### 7.3 Table View — DataTable (Glass)

Preserva o DataTable existente com migração visual para Glass Briefing:

- Container: remove `border bg-card`, adiciona `glass-widget rounded-2xl`
- Headers: `bg-transparent` com `text-[10px] uppercase tracking-wider text-muted-foreground/40`
- Rows: `hover:bg-white/4` em vez de `hover:bg-accent/50`
- Colunas existentes preservadas (todas as 15 colunas)
- Toolbar filters migrados para o padrão TabPills + SearchInput superior
- Bulk actions preservados no toolbar

**Nota:** Este modo é o fallback para usuários que preferem a tabela densa. Mantém todas as funcionalidades avançadas (sort, column visibility, bulk select, etc.)

## 8. Pagination

Segue o padrão de partes:

```tsx
<div className="flex items-center justify-between pt-2">
  <p className="text-xs text-muted-foreground/50">
    1–50 de 1.247
  </p>
  <div className="flex items-center gap-1">
    <button className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30">
      <ChevronLeft className="size-4" />
    </button>
    <span className="text-xs font-medium tabular-nums px-2">1 / 25</span>
    <button className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30">
      <ChevronRight className="size-4" />
    </button>
  </div>
</div>
```

## 9. Detail Sheet (Preview)

Ao clicar em um card/row, abre um `ProcessoDetailSheet` no lado direito para preview rápido antes de navegar para o Processo Cockpit.

### Layout

```
DetailSheet (side="right", w-full sm:w-135 md:w-155)
├─ Header
│   ├─ Scale icon + "Processo"
│   ├─ StatusBadge
│   └─ Close button
│
├─ Content (space-y-4)
│   ├─ Meta Grid (rounded-xl border border-border/30 bg-muted/30 p-4)
│   │   ├─ Partes (autor vs réu, com ParteBadge)
│   │   ├─ Número do processo (font-mono + copy)
│   │   ├─ Tribunal + Grau
│   │   ├─ Órgão Julgador
│   │   ├─ Classe Judicial
│   │   ├─ Data Autuação
│   │   └─ Responsável (avatar + nome)
│   │
│   ├─ Section: Próxima Audiência (se houver)
│   │   └─ Data/hora + tipo + modalidade + countdown
│   │
│   ├─ Section: Etiquetas
│   │   └─ TagBadgeList
│   │
│   ├─ Section: Últimas Movimentações (preview)
│   │   └─ 3 itens mais recentes da timeline (se disponível)
│   │
│   └─ Audit (createdAt, updatedAt)
│
└─ Footer
    ├─ Button ghost: "Fechar"
    └─ Button primary: "Abrir Processo" → navega para /processos/[id]
```

### Componente

```typescript
interface ProcessoDetailSheetProps {
  processo: ProcessoUnificado | null;
  tags?: Tag[];
  responsavel?: UsuarioInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProcesso: (id: number) => void;
}
```

Utiliza os sub-componentes do `DetailSheet` compartilhado: `DetailSheetHeader`, `DetailSheetContent`, `DetailSheetSection`, `DetailSheetMetaGrid`, `DetailSheetFooter`.

## 10. Client Wrapper — ProcessosClient

### Substitui
`processos-table-wrapper.tsx` (1.110 linhas) → `processos-client.tsx`

**Nota de complexidade:** O wrapper atual tem 1.110 linhas porque combina DataTable, filtros, dialogs, e bulk actions num único arquivo. O novo `ProcessosClient` será menor porque:
- Cards/List views são componentes separados (`ProcessoCard`, `ProcessoListRow`)
- PulseStrip, TabPills, SearchInput, ViewToggle são componentes reutilizáveis existentes
- Filtros avançados movidos para Sheet separado
- Mas o modo tabela preserva a complexidade existente (bulk actions, column visibility)

### Props
```typescript
interface ProcessosClientProps {
  initialProcessos: ProcessoUnificado[];
  initialTotal: number;
  initialStats: ProcessoStats;
  tribunais: string[];
  usuarios: UsuarioInfo[];
  currentUserId: number;
}
```

### Estado
```typescript
// Dados
const [processos, setProcessos] = useState(initialProcessos);
const [total, setTotal] = useState(initialTotal);
const [stats, setStats] = useState(initialStats);
const [tagsMap, setTagsMap] = useState<Record<number, Tag[]>>({});

// Filtros
const [activeTab, setActiveTab] = useState<ProcessoTab>('todos');
const [search, setSearch] = useState('');
const [viewMode, setViewMode] = useState<'cards' | 'lista' | 'tabela'>(() =>
  localStorage.getItem('processos_view_mode') as any || 'cards'
);

// Paginação
const [pageIndex, setPageIndex] = useState(0);
const [pageSize] = useState(50);

// UI
const [selectedProcesso, setSelectedProcesso] = useState<ProcessoUnificado | null>(null);
const [isDetailOpen, setIsDetailOpen] = useState(false);
const [isFormOpen, setIsFormOpen] = useState(false);
```

### Fetch Pattern
Segue o mesmo padrão de partes: refetch via server action quando filtros/paginação mudam.

```typescript
useEffect(() => {
  const params = buildFilterParams(activeTab, search, pageIndex, pageSize);
  actionListarProcessos(params).then(result => {
    if (result.success) {
      setProcessos(result.data.processos);
      setTotal(result.data.total);
    }
  });
}, [activeTab, debouncedSearch, pageIndex]);
```

### Funcionalidades Preservadas
- Bulk selection + atribuição em lote (no modo tabela)
- Column visibility toggle (no modo tabela)
- Criação manual de processo (dialog)
- Gerenciamento de tags
- Alteração de responsável
- Configuração de atribuição automática

### Funcionalidades Movidas
- Filtros avançados (21 dimensões): acessíveis via botão "Filtros avançados" que abre um Sheet/Popover, em vez de estar no toolbar principal. O toolbar principal mostra apenas TabPills + Search (simplicidade).

## 11. Server Component — page.tsx

### Mudanças
```typescript
// Antes: PageShell wrapper
// Depois: layout direto com max-w-350

export default async function ProcessosPage({ searchParams }: Props) {
  const [processosResult, tribunais, usuarios, stats] = await Promise.all([
    listarProcessos(params),
    listarTribunais(),
    buscarUsuariosRelacionados(processoIds),
    obterEstatisticasProcessos(), // NOVO
  ]);

  return (
    <div className="max-w-350 mx-auto space-y-5 py-6">
      <ProcessosClient
        initialProcessos={processos}
        initialTotal={total}
        initialStats={stats}
        tribunais={tribunais}
        usuarios={usuarios}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
```

## 12. Componentes — Resumo

### Novos
| Componente | Arquivo | Referência |
|-----------|---------|-----------|
| `ProcessosClient` | `processos-client.tsx` | `partes-client.tsx` |
| `ProcessoCard` | `components/processo-card.tsx` | `entity-card.tsx` |
| `ProcessoListRow` | `components/processo-list-row.tsx` | `entity-list-row.tsx` |
| `ProcessoDetailSheet` | `components/processo-detail-sheet.tsx` | `DetailSheet` compartilhado |
| `ProcessosPulseStrip` | `components/processos-pulse-strip.tsx` | `PulseStrip` |
| `ProcessosInsightBanner` | `components/processos-insight-banner.tsx` | `InsightBanner` primitiva |

### Modificados
| Componente | Mudança |
|-----------|---------|
| `page.tsx` | Remove PageShell, adiciona stats fetch, layout max-w-350 |
| `processos-toolbar-filters.tsx` | Refatorar para Sheet de filtros avançados |

### Preservados (reutilizados no modo tabela)
| Componente | Uso |
|-----------|-----|
| `DataTable` | Modo "tabela" com glass styling |
| `ProcessoForm` | Dialog de criação |
| `ProcessoTagsDialog` | Gerenciamento de tags |
| `ProcessosAlterarResponsavelDialog` | Alteração de responsável |
| `ConfigAtribuicaoDialog` | Config de atribuição automática |
| `ProcessosBulkActions` | Ações em lote (modo tabela) |

### Eliminados
| Componente | Razão |
|-----------|-------|
| `processos-table-wrapper.tsx` | Substituído por `processos-client.tsx`. As funcionalidades de DataTable (bulk actions, column visibility, sorting) são preservadas internamente quando `viewMode === 'tabela'`, reutilizando os mesmos hooks e lógica. |

## 13. Nova Server Action

```typescript
// actions/estatisticas-actions.ts
export const actionObterEstatisticasProcessos = authenticatedAction
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const stats = await obterEstatisticasProcessos(ctx.userId);
    return { success: true, data: stats };
  });
```

```typescript
// Tipo retornado
interface ProcessoStats {
  total: number;
  ativos: number;
  pendentes: number;
  emRecurso: number;
  arquivados: number;
  semResponsavel: number;
  comAudienciaProxima: number; // próximos 7 dias
}
```

## 14. Acessibilidade

- Page: `<main>` com `aria-label="Listagem de Processos"`
- PulseStrip: cards com `role="status"` e `aria-label` descritivo
- TabPills: `role="tablist"` com `aria-selected`
- Cards grid: `role="list"` com items `role="listitem"`
- List rows: `role="listbox"` com items `role="option"`
- ViewToggle: `role="radiogroup"` com `aria-checked`
- SearchInput: `aria-label="Buscar processos"`
- DetailSheet: foco automático no open, trap focus

## 15. Fora de Escopo

- Kanban view por status (melhoria futura)
- Mapa geográfico por tribunal (melhoria futura)
- Export CSV/Excel (já existe via bulk actions, manter)
- Filtros salvos/presets (melhoria futura)
- Agrupamento por tribunal no grid (melhoria futura)
