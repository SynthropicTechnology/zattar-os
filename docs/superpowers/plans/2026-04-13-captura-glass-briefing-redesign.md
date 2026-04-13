# Captura Module Glass Briefing Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire captura module UI to align with the Glass Briefing design system, matching the visual patterns already implemented in audiencias, expedientes, processos, and agenda modules.

**Architecture:** Replace the current DataShell/DataTable flat UI with the Glass Briefing composition pattern: PageHeader + PulseStrip KPIs + FilterBar + ViewToggle + conditional glass views. Backend services (18,600 lines) remain untouched. Only UI components and page-client files change.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Glass Briefing design system (GlassPanel, PulseStrip, ViewToggle, SearchInput, SemanticBadge, Heading/Text)

**POC Reference:** `.superpowers/brainstorm/captura-redesign/01-historico.html` through `05-comunica-cnj.html`

---

## File Map

### New Files to Create

| File | Responsibility |
|------|---------------|
| `src/app/(authenticated)/captura/captura-client.tsx` | Main orchestrator — header, KPIs, tabs, view routing |
| `src/app/(authenticated)/captura/components/captura-kpi-strip.tsx` | KPI metrics strip for captura dashboard |
| `src/app/(authenticated)/captura/components/captura-filter-bar.tsx` | Glass filter bar with chips (tipo, status, tribunal) |
| `src/app/(authenticated)/captura/components/captura-glass-list.tsx` | Glass row list view for capture history |
| `src/app/(authenticated)/captura/components/captura-glass-cards.tsx` | Card grid view for capture history |
| `src/app/(authenticated)/captura/components/credenciais-glass-view.tsx` | Refactored credenciais with glass cards + table |
| `src/app/(authenticated)/captura/components/tribunais-glass-view.tsx` | Refactored tribunais with glass cards |
| `src/app/(authenticated)/captura/components/agendamentos-glass-view.tsx` | Refactored agendamentos with glass table |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/(authenticated)/captura/page.tsx` | Remove redirect, render captura-client directly |
| `src/app/(authenticated)/captura/historico/page.tsx` | Redirect to `/captura` (consolidate into main client) |
| `src/app/(authenticated)/captura/credenciais/page-client.tsx` | Slim down — delegate to credenciais-glass-view |
| `src/app/(authenticated)/captura/tribunais/page-client.tsx` | Slim down — delegate to tribunais-glass-view |
| `src/app/(authenticated)/captura/advogados/page-client.tsx` | Add glass card layout, breadcrumb |
| `src/app/(authenticated)/captura/index.ts` | Export new components |

### Files to Deprecate (keep but no longer primary)

| File | Reason |
|------|--------|
| `src/app/(authenticated)/captura/components/captura-tabs-content.tsx` | Replaced by captura-client.tsx |
| `src/app/(authenticated)/captura/components/captura-list.tsx` | Replaced by captura-glass-list.tsx (keep as fallback) |

---

## Task 1: Create Captura KPI Strip

**Files:**
- Create: `src/app/(authenticated)/captura/components/captura-kpi-strip.tsx`

- [ ] **Step 1: Create the KPI strip component**

```tsx
'use client';

import { useMemo } from 'react';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { Database, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export interface CapturaKpiData {
  total: number;
  sucesso: number;
  emAndamento: number;
  falhas: number;
  taxaSucesso: number;
}

interface CapturaKpiStripProps {
  data: CapturaKpiData;
  isLoading?: boolean;
}

export function CapturaKpiStrip({ data, isLoading }: CapturaKpiStripProps) {
  const items = useMemo<PulseItem[]>(() => [
    {
      label: 'Total Capturas',
      total: data.total,
      delta: undefined,
      icon: Database,
      color: 'text-primary',
    },
    {
      label: 'Sucesso',
      total: data.taxaSucesso,
      delta: `${data.sucesso} ok`,
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      label: 'Em Andamento',
      total: data.emAndamento,
      delta: undefined,
      icon: Loader2,
      color: 'text-info',
    },
    {
      label: 'Falhas (7d)',
      total: data.falhas,
      delta: undefined,
      icon: AlertTriangle,
      color: 'text-destructive',
    },
  ], [data]);

  return <PulseStrip items={items} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/captura/components/captura-kpi-strip.tsx
git commit -m "feat(captura): add Glass Briefing KPI strip component"
```

---

## Task 2: Create Captura Filter Bar

**Files:**
- Create: `src/app/(authenticated)/captura/components/captura-filter-bar.tsx`

- [ ] **Step 1: Create the filter bar component**

```tsx
'use client';

import { useState, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

export interface CapturaFilters {
  tipo: string | null;
  status: string | null;
  tribunal: string | null;
}

interface CapturaFilterBarProps {
  filters: CapturaFilters;
  onChange: (filters: CapturaFilters) => void;
  counts?: {
    tipo?: Record<string, number>;
    status?: Record<string, number>;
    tribunal?: Record<string, number>;
  };
}

// --- Constants ---

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

const TIPO_OPTIONS = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'audiencias', label: 'Audiencias' },
  { value: 'combinada', label: 'Combinada' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'pericias', label: 'Pericias' },
  { value: 'partes', label: 'Partes' },
  { value: 'pendentes', label: 'Expedientes' },
  { value: 'arquivados', label: 'Arquivados' },
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Concluida' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'failed', label: 'Falha' },
  { value: 'pending', label: 'Pendente' },
];

// --- Sub-components ---

function FilterDropdownTrigger({
  label,
  active,
  onClear,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30'
      )}
    >
      <span>{label}</span>
      {active ? (
        <X
          className="size-2.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
          }}
        />
      ) : (
        <ChevronDown className="size-2.5 opacity-50" />
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  counts,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  counts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={selected ? options.find((o) => o.value === selected)?.label ?? label : label}
            active={!!selected}
            onClear={() => { onSelect(null); setOpen(false); }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className="p-2 space-y-0.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value === selected ? null : opt.value); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>{opt.label}</span>
              {counts?.[opt.value] != null && (
                <span className="text-[9px] ml-auto tabular-nums opacity-50">{counts[opt.value]}</span>
              )}
              {selected === opt.value && <Check className="size-3" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Main Component ---

export function CapturaFilterBar({ filters, onChange, counts }: CapturaFilterBarProps) {
  const handleChange = useCallback(
    (key: keyof CapturaFilters) => (value: string | null) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterDropdown
        label="Tipo"
        options={TIPO_OPTIONS}
        selected={filters.tipo}
        onSelect={handleChange('tipo')}
        counts={counts?.tipo}
      />
      <FilterDropdown
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onSelect={handleChange('status')}
        counts={counts?.status}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(authenticated\)/captura/components/captura-filter-bar.tsx
git commit -m "feat(captura): add Glass Briefing filter bar with popover chips"
```

---

## Task 3: Create Captura Glass List View

**Files:**
- Create: `src/app/(authenticated)/captura/components/captura-glass-list.tsx`

- [ ] **Step 1: Create the glass list component**

This replaces the DataTable in captura-list.tsx with the Glass Briefing row pattern from audiencias-glass-list.tsx. Each capture log becomes a glass row with:
- Status dot (color by status)
- Icon container with tipo icon
- Tipo label + tribunal badge
- Advogado name
- Status badge (SemanticBadge category="captura_status")
- Timestamp
- Duration
- Row actions (eye, delete)

Follow the EXACT grid pattern from audiencias-glass-list.tsx:
```
grid-cols-[10px_1fr_100px_80px_140px_80px_80px_32px]
```

Key imports:
```tsx
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge, CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { Heading, Text } from '@/components/ui/typography';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/app/(authenticated)/captura/types';
```

Column headers pattern:
```tsx
<div className="grid grid-cols-[10px_1fr_100px_80px_140px_80px_80px_32px] gap-4 items-center px-4 mb-2">
  <div /> {/* dot */}
  <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Captura</span>
  <span className="...">Tribunal</span>
  <span className="...">Grau</span>
  <span className="...">Status</span>
  <span className="... text-right">Inicio</span>
  <span className="... text-right">Duracao</span>
  <div /> {/* actions */}
</div>
```

Glass row pattern:
```tsx
<button
  type="button"
  onClick={() => onView?.(captura)}
  className={cn(
    'w-full text-left rounded-2xl border border-white/6 p-4 cursor-pointer',
    'transition-all duration-180 ease-out',
    'hover:bg-white/5.5er:border-white/[0.12] hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
    isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
  )}
>
  <div className="grid grid-cols-[10px_1fr_100px_80px_140px_80px_80px_32px] gap-4 items-center">
    {/* Status dot */}
    <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(captura.status))} />
    
    {/* Tipo + Advogado info */}
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn('w-9 h-9 rounded-[0.625rem] flex items-center justify-center shrink-0', getTipoIconBg(captura.tipo_captura))}>
        <TipoIcon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <span className="text-sm font-semibold truncate">{formatarTipo(captura.tipo_captura)}</span>
        <div className="text-xs text-muted-foreground/55 mt-0.5">{advogadoNome}</div>
      </div>
    </div>
    
    {/* Tribunal badge */}
    <SemanticBadge category="tribunal" value={captura.tribunal_codigo}>
      {captura.tribunal_codigo}
    </SemanticBadge>
    
    {/* Grau */}
    <Text variant="caption">{formatarGrau(captura.grau)}</Text>
    
    {/* Status */}
    <CapturaStatusSemanticBadge value={captura.status} />
    
    {/* Timestamp */}
    <Text variant="caption" className="text-right tabular-nums">{formatarDataHora(captura.created_at)}</Text>
    
    {/* Duration */}
    <Text variant="caption" className="text-right tabular-nums">{calcularDuracao(captura)}</Text>
    
    {/* Chevron */}
    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
  </div>
</button>
```

Include: skeleton loader, empty state, pagination.

Reuse `useCapturasLog` hook for data fetching. Reuse `useAdvogadosMap` for name resolution.

- [ ] **Step 2: Test rendering with mock data, verify glass rows appear correctly**

Run: `npm run dev` and navigate to `/captura`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/captura/components/captura-glass-list.tsx
git commit -m "feat(captura): add glass list view for capture history"
```

---

## Task 4: Create Main Captura Client

**Files:**
- Create: `src/app/(authenticated)/captura/captura-client.tsx`
- Modify: `src/app/(authenticated)/captura/page.tsx`

- [ ] **Step 1: Create the main client orchestrator**

This is the core component — follows the EXACT pattern from `audiencias-client.tsx`:

```tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Plus, History, CalendarClock, KeyRound, Landmark, List, LayoutGrid } from 'lucide-react';

import { CapturaKpiStrip } from './components/captura-kpi-strip';
import type { CapturaKpiData } from './components/captura-kpi-strip';
import { CapturaFilterBar } from './components/captura-filter-bar';
import type { CapturaFilters } from './components/captura-filter-bar';
import { CapturaGlassList } from './components/captura-glass-list';
import { CapturaDialog } from './components/captura-dialog';

// Lazy imports for sub-tabs
import CredenciaisClient from './credenciais/page-client';
import TribunaisClient from './tribunais/page-client';
import AgendamentosClient from './agendamentos/page-client';

// --- Constants ---

type CapturaTab = 'historico' | 'agendamentos' | 'credenciais' | 'tribunais';

const TABS = [
  { value: 'historico', label: 'Historico', icon: <History className="size-4" /> },
  { value: 'agendamentos', label: 'Agendamentos', icon: <CalendarClock className="size-4" /> },
  { value: 'credenciais', label: 'Credenciais', icon: <KeyRound className="size-4" /> },
  { value: 'tribunais', label: 'Tribunais', icon: <Landmark className="size-4" /> },
];

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
];

// --- Component ---

export function CapturaClient() {
  // Tab state (from URL query param)
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<CapturaTab>('historico');
  
  // View mode for historico
  const [viewMode, setViewMode] = useState('lista');
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CapturaFilters>({ tipo: null, status: null, tribunal: null });
  
  // Dialog state
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // KPI data (computed from capturas hook in glass-list)
  const [kpiData, setKpiData] = useState<CapturaKpiData>({
    total: 0, sucesso: 0, emAndamento: 0, falhas: 0, taxaSucesso: 0,
  });

  // Tab change handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as CapturaTab);
  }, []);

  // Capture success handler
  const handleCapturaSuccess = useCallback(() => {
    setCapturaDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Captura</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            Automacao de captura judicial — PJE/TRT
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setCapturaDialogOpen(true)}
        >
          <Plus className="size-3.5" />
          Nova Captura
        </Button>
      </div>

      {/* Tab Pills */}
      <AnimatedIconTabs
        tabs={TABS}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-fit"
      />

      {/* Historico View */}
      {activeTab === 'historico' && (
        <>
          {/* KPI Strip */}
          <CapturaKpiStrip data={kpiData} />

          {/* Filter Bar + Search + View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CapturaFilterBar filters={filters} onChange={setFilters} />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar capturas..." />
              <ViewToggle mode={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
            </div>
          </div>

          {/* Content */}
          <CapturaGlassList
            key={refreshKey}
            search={search}
            filters={filters}
            onKpiUpdate={setKpiData}
          />
        </>
      )}

      {/* Other tabs */}
      {activeTab === 'agendamentos' && <AgendamentosClient />}
      {activeTab === 'credenciais' && <CredenciaisClient />}
      {activeTab === 'tribunais' && <TribunaisClient />}

      {/* New Capture Dialog */}
      <CapturaDialog
        open={capturaDialogOpen}
        onOpenChange={setCapturaDialogOpen}
        onSuccess={handleCapturaSuccess}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update page.tsx to render CapturaClient**

Replace the redirect in `src/app/(authenticated)/captura/page.tsx`:

```tsx
import { CapturaClient } from './captura-client';

export default function CapturaPage() {
  return <CapturaClient />;
}
```

- [ ] **Step 3: Verify the page renders correctly**

Run: `npm run dev` and navigate to `/captura`
Expected: Glass Briefing layout with header, tabs, KPIs, filters, glass list

- [ ] **Step 4: Run type-check**

Run: `npm run type-check`
Expected: No new type errors

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/captura/captura-client.tsx src/app/\(authenticated\)/captura/page.tsx
git commit -m "feat(captura): add main Glass Briefing client with KPIs, filters, and tab navigation"
```

---

## Task 5: Refactor Credenciais to Glass View

**Files:**
- Create: `src/app/(authenticated)/captura/components/credenciais-glass-view.tsx`
- Modify: `src/app/(authenticated)/captura/credenciais/page-client.tsx`

- [ ] **Step 1: Create glass card + table hybrid for credenciais**

The credenciais view needs:
- KPI strip (total, ativas, inativas, tribunais cobertos) using PulseStrip
- Filter bar (advogado, tribunal, grau, status)
- Dual view: table (default) + card grid via ViewToggle
- Bulk actions bar (ativar/desativar em lote)

Wrap the existing `DataTable` usage inside a `GlassPanel depth={1}` and add the glass header above.

Card view: each credencial as a `GlassPanel depth={2}` card with:
- Icon container (tribunal code)
- Grau badge
- Advogado name + OAB
- Login monospace
- Status toggle (ativa/inativa dot)
- Last capture date
- Action buttons

Reuse existing hooks (`useAdvogados`), columns (`criarColunasCredenciais`), and actions (`actionAtualizarCredencial`). Only change the visual wrapper.

- [ ] **Step 2: Update credenciais page-client to use the new glass view**

Keep all existing state management and data fetching. Replace `DataShell` wrapper with `GlassPanel` and add KPI strip + filter bar above.

- [ ] **Step 3: Verify rendering**

Run: `npm run dev`, navigate to `/captura`, click "Credenciais" tab
Expected: Glass panels, KPIs, filter chips, card/table toggle

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/captura/components/credenciais-glass-view.tsx src/app/\(authenticated\)/captura/credenciais/page-client.tsx
git commit -m "feat(captura): refactor credenciais to Glass Briefing with KPIs and dual view"
```

---

## Task 6: Refactor Tribunais to Glass Cards

**Files:**
- Modify: `src/app/(authenticated)/captura/tribunais/page-client.tsx`

- [ ] **Step 1: Replace DataShell with glass card grid**

Transform each tribunal from a table row into a `GlassPanel depth={2}` card:
```
+---------------------------+
| TRT1                      |
| Rio de Janeiro            |
| -----------------------   |
| 1o Grau    ● Ativo        |
| Credenciais: 4            |
| Ultima captura:           |
| 12/04/2026 14:30          |
| -----------------------   |
| [Configurar]              |
+---------------------------+
```

Layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`

Add PulseStrip with: Configurados, Com Credenciais, Sem Cobertura.

Keep existing `useTribunais` hook and `TribunaisDialog`. Only change the presentation.

- [ ] **Step 2: Verify rendering**

Run: `npm run dev`, navigate to `/captura`, click "Tribunais" tab

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/captura/tribunais/page-client.tsx
git commit -m "feat(captura): refactor tribunais to Glass Briefing card grid"
```

---

## Task 7: Refactor Agendamentos to Glass View

**Files:**
- Modify: `src/app/(authenticated)/captura/agendamentos/page-client.tsx`

- [ ] **Step 1: Add glass wrapper with KPIs and glass table rows**

Current agendamentos page is minimal (29 lines). Expand it to include:
- PulseStrip: Ativos, Execucoes Hoje, Proxima Execucao, Taxa Sucesso
- Glass list rows (same pattern as captura-glass-list but for schedules)
- Each row: status dot, schedule name, tipo badge, tribunal badge, frequencia, proxima execucao, actions

If the agendamentos data model is too minimal, wrap existing content in glass panels and add the KPI strip.

- [ ] **Step 2: Verify rendering**

Run: `npm run dev`, navigate to `/captura`, click "Agendamentos" tab

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/captura/agendamentos/page-client.tsx
git commit -m "feat(captura): refactor agendamentos to Glass Briefing layout"
```

---

## Task 8: Refactor Advogados Sub-page

**Files:**
- Modify: `src/app/(authenticated)/captura/advogados/page-client.tsx`

- [ ] **Step 1: Add glass card layout with breadcrumb**

Transform from DataTable to card grid:
- Add breadcrumb: Captura > Credenciais > Advogados
- PulseStrip: Total Advogados, Com Credenciais, Sem Credenciais
- Card grid (3 columns): each advogado as GlassPanel depth={2}
  - Avatar initials circle (bg-primary/10, text-primary)
  - Nome + OAB/UF
  - Email + Telefone
  - Credential count
  - "Ver Credenciais" link + edit button

Keep existing `useAdvogados` hook, `AdvogadoDialog`, and action handlers.

- [ ] **Step 2: Verify rendering**

Run: `npm run dev`, navigate to `/captura/advogados`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/captura/advogados/page-client.tsx
git commit -m "feat(captura): refactor advogados to Glass Briefing card grid"
```

---

## Task 9: Update Barrel Export

**Files:**
- Modify: `src/app/(authenticated)/captura/index.ts`

- [ ] **Step 1: Add new component exports**

Add to the existing barrel:
```tsx
export { CapturaClient } from './captura-client';
export { CapturaKpiStrip } from './components/captura-kpi-strip';
export type { CapturaKpiData } from './components/captura-kpi-strip';
export { CapturaFilterBar } from './components/captura-filter-bar';
export type { CapturaFilters } from './components/captura-filter-bar';
export { CapturaGlassList } from './components/captura-glass-list';
```

- [ ] **Step 2: Run type-check and architecture validation**

```bash
npm run type-check
npm run check:architecture
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/captura/index.ts
git commit -m "feat(captura): update barrel exports with new Glass Briefing components"
```

---

## Task 10: Visual Verification and Cleanup

- [ ] **Step 1: Visual test all views**

Navigate through ALL tabs and verify Glass Briefing alignment:
1. `/captura` (Historico tab) — KPIs, filter bar, glass list
2. `/captura` (Credenciais tab) — KPIs, dual view, bulk actions
3. `/captura` (Tribunais tab) — card grid
4. `/captura` (Agendamentos tab) — glass table
5. `/captura/advogados` — breadcrumb, card grid

- [ ] **Step 2: Run full test suite**

```bash
npm run type-check
npm test -- --passWithNoTests
npm run check:architecture
```

- [ ] **Step 3: Remove deprecated import of captura-tabs-content if no longer referenced**

Check if `captura-tabs-content.tsx` is still imported anywhere:
```bash
grep -r "captura-tabs-content" src/ --include="*.tsx" --include="*.ts"
```

If no references, the file can stay but add a deprecation comment.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(captura): complete Glass Briefing redesign — all views refactored"
```
