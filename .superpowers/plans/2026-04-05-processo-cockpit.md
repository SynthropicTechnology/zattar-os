# Processo Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the processo detail view (`/processos/[id]`) into a 3-zone cockpit with compact identity bar, pulse timeline with AGORA marker, and proactive attention strip.

**Architecture:** Replace `ProcessoHeader` with compact `CaseIdentityBar`, replace `ProcessoDetailsTabs` with `AttentionStrip` + `AllDetailsSheet`, replace `TimelineSidebar` with `PulseTimeline` that groups by month, adds filter chips, NOW marker, phase markers, and "NOVO" badges. All new components live in `src/app/(authenticated)/processos/components/cockpit/`. Glass Briefing styling throughout.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide icons, date-fns, GlassPanel primitives

**Spec:** `docs/superpowers/specs/2026-04-05-processo-cockpit-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/(authenticated)/processos/components/cockpit/case-identity-bar.tsx` | Compact ~48px header bar |
| `src/app/(authenticated)/processos/components/cockpit/attention-strip.tsx` | Proactive urgency surface |
| `src/app/(authenticated)/processos/components/cockpit/all-details-sheet.tsx` | Full details lateral sheet |
| `src/app/(authenticated)/processos/components/cockpit/pulse-timeline.tsx` | Timeline orchestrator with AGORA |
| `src/app/(authenticated)/processos/components/cockpit/timeline-filter-chips.tsx` | Inline filter pills |
| `src/app/(authenticated)/processos/components/cockpit/timeline-month-group.tsx` | Monthly grouped items |
| `src/app/(authenticated)/processos/components/cockpit/timeline-now-marker.tsx` | Pulsing NOW separator |
| `src/app/(authenticated)/processos/components/cockpit/timeline-phase-marker.tsx` | Process phase landmarks |
| `src/app/(authenticated)/processos/components/cockpit/types.ts` | Shared types for cockpit |

### Modified Files
| File | Change |
|------|--------|
| `src/app/(authenticated)/processos/components/processo-visualizacao.tsx` | Rewrite layout to use cockpit components |
| `src/app/(authenticated)/processos/components/timeline/timeline-sidebar-item.tsx` | Add future/past styling + NOVO badge |
| `src/app/(authenticated)/processos/index.ts` | Export new cockpit components |

---

## Task 1: Cockpit Types

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/types.ts`

- [ ] **Step 1: Create the shared types file**

```typescript
// src/app/(authenticated)/processos/components/cockpit/types.ts

import type { GrauProcesso } from '@/app/(authenticated)/partes';

/**
 * Tipo de filtro aplicável à timeline.
 * Mapeia para os termos em constants.ts (getTimelineItemMeta).
 */
export type TimelineFilterType =
  | 'todos'
  | 'documentos'
  | 'decisoes'
  | 'recursos'
  | 'citacoes'
  | 'audiencias';

/**
 * Item futuro derivado de dados complementares (audiências, expedientes, perícias).
 * Renderizado acima do marcador AGORA na PulseTimeline.
 */
export interface FutureTimelineItem {
  /** Prefixo + id original: 'aud_123', 'exp_456', 'per_789' */
  id: string;
  tipo: 'audiencia' | 'expediente' | 'pericia';
  /** ISO date string */
  data: string;
  titulo: string;
  subtitulo?: string;
  /** Dados adicionais para renderização (ex: url da sala virtual) */
  meta?: Record<string, unknown>;
}

/**
 * Fase processual detectada por heurística nos títulos da timeline.
 */
export type ProcessoPhase = 'recurso' | 'sentenca' | 'instrucao' | 'conhecimento';

/**
 * Mapeamento de filtro para termos de busca nos títulos.
 * Usado por PulseTimeline para filtrar items.
 */
export const FILTER_TERMS: Record<Exclude<TimelineFilterType, 'todos'>, string[]> = {
  documentos: [], // filtro especial: item.documento === true
  decisoes: ['sentença', 'sentenca', 'decisão', 'decisao', 'acórdão', 'acordao', 'julgamento'],
  recursos: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
  citacoes: ['citação', 'citacao', 'intimação', 'intimacao', 'aviso', 'notificação', 'notificacao'],
  audiencias: ['audiência', 'audiencia'],
};

/**
 * Mapeamento de fase processual para termos de detecção.
 */
export const PHASE_TERMS: Record<ProcessoPhase, string[]> = {
  recurso: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
  sentenca: ['sentença', 'sentenca', 'acórdão', 'acordao', 'julgamento'],
  instrucao: ['audiência', 'audiencia', 'perícia', 'pericia', 'prova', 'testemunha', 'oitiva', 'inspeção', 'inspecao'],
  conhecimento: ['petição inicial', 'peticao inicial', 'distribuição', 'distribuicao', 'citação', 'citacao'],
};

/**
 * Configuração visual de cada fase processual.
 */
export const PHASE_CONFIG: Record<ProcessoPhase, { label: string; icon: string }> = {
  recurso: { label: 'Recurso', icon: 'ArrowUpRight' },
  sentenca: { label: 'Sentença', icon: 'Scale' },
  instrucao: { label: 'Instrução', icon: 'Users' },
  conhecimento: { label: 'Conhecimento', icon: 'FileText' },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/types.ts
git commit -m "feat(processos): add cockpit shared types for timeline filters, phases, and future items"
```

---

## Task 2: TimelineNowMarker

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/timeline-now-marker.tsx`

- [ ] **Step 1: Create the NOW marker component**

```typescript
// src/app/(authenticated)/processos/components/cockpit/timeline-now-marker.tsx

'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineNowMarkerProps {
  className?: string;
}

/**
 * Marcador "AGORA" pulsante que divide a timeline em futuro e passado.
 * Renderizado entre o item futuro mais próximo e o item passado mais recente.
 * O ref é usado para scroll automático ao abrir o processo.
 */
export const TimelineNowMarker = forwardRef<HTMLDivElement, TimelineNowMarkerProps>(
  function TimelineNowMarker({ className }, ref) {
    const hoje = format(new Date(), "dd MMM yyyy", { locale: ptBR });

    return (
      <div
        ref={ref}
        role="separator"
        aria-label="Momento atual"
        className={cn('py-3 px-2', className)}
      >
        <div className="flex items-center gap-3">
          {/* Linha esquerda com gradiente */}
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-primary/25" />

          {/* Badge central */}
          <div className="flex items-center gap-2 rounded-lg bg-primary/[0.06] border border-primary/15 px-3 py-1.5">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
              Hoje — {hoje}
            </span>
          </div>

          {/* Linha direita com gradiente */}
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/25 to-primary/25" />
        </div>
      </div>
    );
  }
);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/timeline-now-marker.tsx
git commit -m "feat(processos): add TimelineNowMarker with pulsing dot and gradient lines"
```

---

## Task 3: TimelinePhaseMarker

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/timeline-phase-marker.tsx`

- [ ] **Step 1: Create the phase marker component**

```typescript
// src/app/(authenticated)/processos/components/cockpit/timeline-phase-marker.tsx

'use client';

import { Scale, ArrowUpRight, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoPhase } from './types';
import { PHASE_CONFIG } from './types';

const PHASE_ICONS = {
  recurso: ArrowUpRight,
  sentenca: Scale,
  instrucao: Users,
  conhecimento: FileText,
} as const;

interface TimelinePhaseMarkerProps {
  phase: ProcessoPhase;
  className?: string;
}

/**
 * Marcador visual de fase processual na timeline.
 * Landmarks de orientação — não clicáveis.
 */
export function TimelinePhaseMarker({ phase, className }: TimelinePhaseMarkerProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = PHASE_ICONS[phase];

  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-2', className)}
      aria-label={`Fase: ${config.label}`}
    >
      <div className="h-px flex-1 bg-border/8" />
      <Icon className="size-3 text-muted-foreground/25 shrink-0" />
      <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/30 font-bold whitespace-nowrap shrink-0">
        Fase: {config.label}
      </span>
      <div className="h-px flex-1 bg-border/8" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/timeline-phase-marker.tsx
git commit -m "feat(processos): add TimelinePhaseMarker visual landmarks"
```

---

## Task 4: TimelineFilterChips

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/timeline-filter-chips.tsx`

- [ ] **Step 1: Create the filter chips component**

```typescript
// src/app/(authenticated)/processos/components/cockpit/timeline-filter-chips.tsx

'use client';

import { FileText, Scale, ArrowUpRight, Mail, Calendar, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineFilterType } from './types';
import type { GrauProcesso } from '@/app/(authenticated)/partes';

interface FilterChip {
  id: TimelineFilterType;
  label: string;
  icon: typeof FileText;
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'todos', label: 'Todos', icon: Layers },
  { id: 'documentos', label: 'Docs', icon: FileText },
  { id: 'decisoes', label: 'Decisões', icon: Scale },
  { id: 'recursos', label: 'Recursos', icon: ArrowUpRight },
  { id: 'citacoes', label: 'Citações', icon: Mail },
  { id: 'audiencias', label: 'Audiências', icon: Calendar },
];

interface TimelineFilterChipsProps {
  counts: { docs: number; movs: number; total: number };
  activeFilter: TimelineFilterType;
  onFilterChange: (filter: TimelineFilterType) => void;
  /** Graus ativos — só exibe filtro de grau se length > 1 */
  graus?: GrauProcesso[];
  activeGrau?: GrauProcesso | 'todos';
  onGrauChange?: (grau: GrauProcesso | 'todos') => void;
}

const GRAU_LABELS: Record<string, string> = {
  todos: 'Todos',
  primeiro_grau: '1º',
  segundo_grau: '2º',
  tribunal_superior: 'TST',
};

/**
 * Filtros inline da timeline no estilo TabPills.
 * Renderiza contagem de docs/movs + chips de tipo + filtro de grau.
 */
export function TimelineFilterChips({
  counts,
  activeFilter,
  onFilterChange,
  graus,
  activeGrau = 'todos',
  onGrauChange,
}: TimelineFilterChipsProps) {
  const showGrauFilter = graus && graus.length > 1;

  return (
    <div className="flex-none border-b px-3 py-2.5 space-y-2">
      {/* Linha 1: contagens + CMD+K */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" />
            {counts.docs} {counts.docs === 1 ? 'doc' : 'docs'}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span>{counts.movs} {counts.movs === 1 ? 'mov' : 'movs'}</span>
        </div>
        <kbd className="flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-[9px]">&#x2318;</span>K
        </kbd>
      </div>

      {/* Linha 2: filter chips */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-border/6 overflow-x-auto" role="tablist">
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-primary/12 text-primary shadow-sm'
                  : 'text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-white/4'
              )}
            >
              <Icon className="size-3" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Linha 3: filtro de grau (condicional) */}
      {showGrauFilter && onGrauChange && (
        <div className="flex gap-1 p-0.5 rounded-md bg-border/4 w-fit" role="tablist" aria-label="Filtro de grau">
          {(['todos', ...graus] as const).map((grau) => {
            const isActive = activeGrau === grau;
            return (
              <button
                key={grau}
                role="tab"
                aria-selected={isActive}
                onClick={() => onGrauChange(grau as GrauProcesso | 'todos')}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground/40 hover:text-muted-foreground/60'
                )}
              >
                {GRAU_LABELS[grau] || grau}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/timeline-filter-chips.tsx
git commit -m "feat(processos): add TimelineFilterChips with type and grau filters"
```

---

## Task 5: TimelineMonthGroup

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/timeline-month-group.tsx`

- [ ] **Step 1: Create the month group component**

```typescript
// src/app/(authenticated)/processos/components/cockpit/timeline-month-group.tsx

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineSidebarItem } from '../timeline/timeline-sidebar-item';
import type { TimelineItemUnificado } from '../timeline/types';

interface TimelineMonthGroupProps {
  /** Ex: "Abril 2026" */
  label: string;
  items: TimelineItemUnificado[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  defaultExpanded?: boolean;
  /** Se true, items são futuros (estilo visual diferenciado) */
  isFuture?: boolean;
}

/**
 * Grupo mensal de items da timeline com header sticky e collapse.
 */
export function TimelineMonthGroup({
  label,
  items,
  selectedItemId,
  onSelectItem,
  defaultExpanded = true,
  isFuture = false,
}: TimelineMonthGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div role="group" aria-label={`Mês: ${label}`}>
      {/* Sticky month header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="sticky top-0 z-10 flex items-center gap-2 w-full px-4 py-1.5 backdrop-blur-sm bg-background/80 cursor-pointer group"
      >
        <div className="h-px flex-1 bg-border/10" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-semibold whitespace-nowrap shrink-0">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'size-3 text-muted-foreground/30 transition-transform duration-200',
            !isExpanded && '-rotate-90'
          )}
        />
        <div className="h-px flex-1 bg-border/10" />
      </button>

      {/* Items */}
      {isExpanded && (
        <div className={cn(isFuture && 'opacity-70')}>
          {items.map((item, index) => (
            <TimelineSidebarItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedItemId}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onSelect={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/timeline-month-group.tsx
git commit -m "feat(processos): add TimelineMonthGroup with sticky headers and collapse"
```

---

## Task 6: Update TimelineSidebarItem for future/NOVO support

**Files:**
- Modify: `src/app/(authenticated)/processos/components/timeline/timeline-sidebar-item.tsx`

- [ ] **Step 1: Add `isFuture` and `isNew` props to TimelineSidebarItem**

Open `src/app/(authenticated)/processos/components/timeline/timeline-sidebar-item.tsx` and make these changes:

Add to the interface (after `onSelect`):
```typescript
  /** Se true, item é futuro — círculo vazado, texto com opacity */
  isFuture?: boolean;
  /** Se true, mostra badge "NOVO" inline */
  isNew?: boolean;
```

In the component signature, destructure the new props:
```typescript
export function TimelineSidebarItem({
  item,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  isFuture = false,
  isNew = false,
}: TimelineSidebarItemProps) {
```

Replace the icon circle div (the one with `size-6 rounded-full`) with:
```typescript
          <div
            className={cn(
              'flex items-center justify-center size-6 rounded-full',
              isFuture
                ? cn('border-2 bg-transparent', isSelected ? 'border-primary' : cn('border-border', meta.colorClass.replace('text-', 'border-')))
                : cn('bg-card border', isSelected ? 'border-primary text-primary' : cn('border-border', meta.colorClass))
            )}
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
```

In the badges line (after `TimelineTypeBadge`), add the NOVO badge:
```typescript
            {isNew && (
              <span className="text-[8px] font-bold uppercase bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full shrink-0">
                Novo
              </span>
            )}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/timeline/timeline-sidebar-item.tsx
git commit -m "feat(processos): add isFuture and isNew props to TimelineSidebarItem"
```

---

## Task 7: PulseTimeline (Orchestrator)

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/pulse-timeline.tsx`

- [ ] **Step 1: Create the PulseTimeline orchestrator**

```typescript
// src/app/(authenticated)/processos/components/cockpit/pulse-timeline.tsx

'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TimelineItemUnificado } from '../timeline/types';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { TimelineFilterChips } from './timeline-filter-chips';
import { TimelineMonthGroup } from './timeline-month-group';
import { TimelineNowMarker } from './timeline-now-marker';
import { TimelinePhaseMarker } from './timeline-phase-marker';
import {
  type TimelineFilterType,
  type FutureTimelineItem,
  type ProcessoPhase,
  FILTER_TERMS,
  PHASE_TERMS,
} from './types';

interface PulseTimelineProps {
  items: TimelineItemUnificado[];
  futureItems?: FutureTimelineItem[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  onSelectFutureItem?: (item: FutureTimelineItem) => void;
  processoId: number;
  graus?: GrauProcesso[];
  className?: string;
}

/** Agrupa items por mês/ano. Retorna Map ordenado. */
function groupByMonth(items: TimelineItemUnificado[]): Map<string, TimelineItemUnificado[]> {
  const groups = new Map<string, TimelineItemUnificado[]>();
  for (const item of items) {
    try {
      const key = format(new Date(item.data), 'MMMM yyyy', { locale: ptBR });
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      const existing = groups.get(capitalizedKey) ?? [];
      existing.push(item);
      groups.set(capitalizedKey, existing);
    } catch {
      // skip items with invalid dates
    }
  }
  return groups;
}

/** Detecta a fase processual do item baseado no título. */
function detectPhase(titulo: string): ProcessoPhase | null {
  const normalized = titulo.toLowerCase();
  // Verificar em ordem de precedência (recurso > sentença > instrução > conhecimento)
  const orderedPhases: ProcessoPhase[] = ['recurso', 'sentenca', 'instrucao', 'conhecimento'];
  for (const phase of orderedPhases) {
    if (PHASE_TERMS[phase].some((term) => normalized.includes(term))) {
      return phase;
    }
  }
  return null;
}

/** Filtra items pelo tipo selecionado. */
function filterItems(
  items: TimelineItemUnificado[],
  filter: TimelineFilterType,
  grau: GrauProcesso | 'todos'
): TimelineItemUnificado[] {
  let filtered = items;

  // Filtro de tipo
  if (filter !== 'todos') {
    if (filter === 'documentos') {
      filtered = filtered.filter((item) => item.documento);
    } else {
      const terms = FILTER_TERMS[filter];
      filtered = filtered.filter((item) =>
        terms.some((term) => item.titulo.toLowerCase().includes(term))
      );
    }
  }

  // Filtro de grau
  if (grau !== 'todos') {
    filtered = filtered.filter((item) => item.grauOrigem === grau);
  }

  return filtered;
}

/**
 * PulseTimeline — Timeline orquestradora com AGORA, filtros, agrupamento mensal e phase markers.
 */
export function PulseTimeline({
  items,
  futureItems = [],
  selectedItemId,
  onSelectItem,
  onSelectFutureItem,
  processoId,
  graus,
  className,
}: PulseTimelineProps) {
  const nowRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<TimelineFilterType>('todos');
  const [activeGrau, setActiveGrau] = useState<GrauProcesso | 'todos'>('todos');
  const [seenItems, setSeenItems] = useState<Set<number>>(new Set());

  // Last visit tracking
  const lastVisitKey = `processo_last_visit_${processoId}`;
  const lastVisitDate = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(lastVisitKey);
    return stored;
  }, [lastVisitKey]);

  // Salvar timestamp da visita atual
  useEffect(() => {
    localStorage.setItem(lastVisitKey, new Date().toISOString());
  }, [lastVisitKey]);

  // Contagens
  const counts = useMemo(() => {
    const docs = items.filter((i) => i.documento).length;
    return { docs, movs: items.length - docs, total: items.length };
  }, [items]);

  // Items filtrados
  const filteredItems = useMemo(
    () => filterItems(items, activeFilter, activeGrau),
    [items, activeFilter, activeGrau]
  );

  // Dividir em passado e futuro
  const now = new Date();
  const pastItems = useMemo(
    () =>
      filteredItems
        .filter((item) => new Date(item.data) <= now)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [filteredItems, now]
  );

  // Agrupar passados por mês
  const pastGroups = useMemo(() => groupByMonth(pastItems), [pastItems]);

  // Detectar fases nos items passados (primeira ocorrência de cada fase)
  const phasePositions = useMemo(() => {
    const phases = new Map<ProcessoPhase, number>();
    for (const item of pastItems) {
      const phase = detectPhase(item.titulo);
      if (phase && !phases.has(phase)) {
        phases.set(phase, item.id);
      }
    }
    return phases;
  }, [pastItems]);

  // Items novos (desde a última visita)
  const isItemNew = useCallback(
    (itemDate: string) => {
      if (!lastVisitDate) return false;
      if (seenItems.has(0)) return false; // placeholder
      return new Date(itemDate) > new Date(lastVisitDate);
    },
    [lastVisitDate, seenItems]
  );

  const handleMarkSeen = useCallback((itemId: number) => {
    setSeenItems((prev) => new Set([...prev, itemId]));
  }, []);

  // Auto-scroll para AGORA
  useEffect(() => {
    const timer = setTimeout(() => {
      nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-background', className)}>
      {/* Header com filtros */}
      <TimelineFilterChips
        counts={counts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        graus={graus}
        activeGrau={activeGrau}
        onGrauChange={setActiveGrau}
      />

      {/* Lista com scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        {/* Seção futura (se houver items futuros) */}
        {futureItems.length > 0 && (
          <div className="opacity-70 pt-2">
            <div className="px-4 py-1">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/30 font-semibold">
                Próximos eventos
              </span>
            </div>
            {/* Render future items as simple list */}
            {futureItems
              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .map((fi) => (
                <button
                  key={fi.id}
                  type="button"
                  onClick={() => onSelectFutureItem?.(fi)}
                  className="group flex w-full cursor-pointer hover:bg-white/4 px-4 py-2"
                >
                  <div className="grid grid-cols-[48px_1fr] w-full">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-px h-2 bg-border/30" />
                      <div className="size-5 rounded-full border-2 border-primary/30 flex items-center justify-center">
                        <div className="size-1.5 rounded-full bg-primary/30" />
                      </div>
                      <div className="w-px grow bg-border/30 mt-1" />
                    </div>
                    <div className="flex flex-col justify-center pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-primary/8 text-primary/50 border border-primary/10">
                          {fi.tipo === 'audiencia' ? 'Audiência' : fi.tipo === 'expediente' ? 'Prazo' : 'Perícia'}
                        </span>
                        <span className="text-xs text-muted-foreground/50 font-mono shrink-0">
                          {format(new Date(fi.data), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground/60">
                        {fi.titulo}
                      </p>
                      {fi.subtitulo && (
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">{fi.subtitulo}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Marcador AGORA */}
        <TimelineNowMarker ref={nowRef} />

        {/* Seção passada — agrupada por mês */}
        {Array.from(pastGroups.entries()).map(([monthLabel, monthItems]) => (
          <TimelineMonthGroup
            key={monthLabel}
            label={monthLabel}
            items={monthItems}
            selectedItemId={selectedItemId}
            onSelectItem={(item) => {
              handleMarkSeen(item.id);
              onSelectItem(item);
            }}
            defaultExpanded
          />
        ))}

        {/* Marcador de início */}
        {pastItems.length > 0 && (
          <div className="grid grid-cols-[48px_1fr] px-2 pb-6 pt-4 opacity-70">
            <div className="flex flex-col items-center gap-1">
              <div className="h-2 w-px bg-border" />
              <div className="size-3 rounded-full border border-border bg-muted" />
              <div className="h-8 w-px bg-transparent" />
            </div>
            <div className="flex items-center border-b border-dashed border-border/70 pb-4">
              <p className="text-xs font-medium italic text-muted-foreground">
                Início do processo
              </p>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {filteredItems.length === 0 && futureItems.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-xs text-muted-foreground italic">
              Nenhum item encontrado com os filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/pulse-timeline.tsx
git commit -m "feat(processos): add PulseTimeline orchestrator with AGORA, month groups, and filters"
```

---

## Task 8: CaseIdentityBar

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/case-identity-bar.tsx`

- [ ] **Step 1: Create the compact identity bar**

```typescript
// src/app/(authenticated)/processos/components/cockpit/case-identity-bar.tsx

'use client';

import { Lock, Layers, RefreshCw, ArrowLeft, Search } from 'lucide-react';
import type { ProcessoUnificado } from '@/app/(authenticated)/processos';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { CopyButton } from '@/app/(authenticated)/partes';
import { ProximaAudienciaPopover } from '../proxima-audiencia-popover';
import { GrauBadgesSimple } from '../grau-badges';
import { GRAU_LABELS } from '@/lib/design-system';
import { ProcessosAlterarResponsavelDialog } from '../processos-alterar-responsavel-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface InstanciaInfo {
  id: number;
  grau: GrauProcesso;
  trt: string;
  totalItensOriginal: number;
  totalMovimentosProprios?: number;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

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

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Case Identity Bar — barra compacta (~48px) com identidade do processo.
 * Substitui ProcessoHeader no contexto do cockpit.
 */
export function CaseIdentityBar({
  processo,
  instancias,
  isCapturing,
  isReadingFocused,
  usuarios,
  onVoltar,
  onAtualizarTimeline,
  onOpenSearch,
}: CaseIdentityBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const trt = processo.trtOrigem || processo.trt;
  const numeroProcesso = processo.numeroProcesso;
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = !!processo.grausAtivos?.length;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes =
    parteRe && parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const responsavel = usuarios.find((u) => u.id === processo.responsavelId);

  // Modo reading-focused: breadcrumb mínimo
  if (isReadingFocused) {
    return (
      <header
        role="banner"
        className="glass-widget bg-transparent border-b border-border/20 px-4 py-1.5 flex items-center gap-3 shrink-0"
      >
        <span className="font-mono text-xs text-muted-foreground">{numeroProcesso}</span>
        <span className="w-px h-4 bg-border/10" />
        <span className="text-xs text-muted-foreground/60 truncate">{tituloPartes}</span>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="glass-widget bg-transparent border-b border-border/20 px-4 py-2.5 flex items-center gap-3 shrink-0"
    >
      {/* Back */}
      <Button variant="ghost" size="icon-sm" onClick={onVoltar} title="Voltar">
        <ArrowLeft className="size-4" />
      </Button>

      {/* Partes */}
      <h1 className="text-base font-heading font-semibold tracking-tight truncate max-w-[35%] min-w-0">
        {tituloPartes}
      </h1>

      {segredoJustica && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="size-3.5 text-destructive shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Segredo de Justiça</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <span className="w-px h-5 bg-border/10 shrink-0" />

      {/* Número */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-sm text-foreground/80">{numeroProcesso}</span>
        <CopyButton text={numeroProcesso} label="Copiar número" />
      </div>

      {/* Badges */}
      <SemanticBadge category="tribunal" value={trt} className="text-[10px] shrink-0">
        {trt}
      </SemanticBadge>

      {isUnificado && processo.grausAtivos ? (
        <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
      ) : (
        processo.grauAtual && (
          <SemanticBadge category="grau" value={processo.grauAtual} className="text-[10px] shrink-0">
            {GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual}
          </SemanticBadge>
        )
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Próxima audiência */}
      {dataProximaAudiencia && (
        <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
      )}

      {/* Instâncias */}
      {instancias && instancias.length > 1 && (
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
          <Layers className="size-3" />
          {instancias.length}
        </span>
      )}

      {/* Responsável */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shrink-0"
              aria-label={responsavel ? `Responsável: ${responsavel.nomeExibicao}` : 'Atribuir responsável'}
            >
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={responsavel?.avatarUrl || undefined} alt={responsavel?.nomeExibicao || 'Não atribuído'} />
                <AvatarFallback className="text-[9px] font-medium">
                  {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {responsavel ? responsavel.nomeExibicao : 'Não atribuído'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Refresh */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onAtualizarTimeline} disabled={isCapturing}>
              <RefreshCw className={cn('size-3.5', isCapturing && 'animate-spin')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Atualizar timeline</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* CMD+K */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onOpenSearch}>
              <Search className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Buscar na timeline (⌘K)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Dialog */}
      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={processo}
        usuarios={usuarios}
        onSuccess={() => {}}
      />
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/case-identity-bar.tsx
git commit -m "feat(processos): add CaseIdentityBar compact header for cockpit"
```

---

## Task 9: AttentionStrip

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/attention-strip.tsx`

- [ ] **Step 1: Create the attention strip**

```typescript
// src/app/(authenticated)/processos/components/cockpit/attention-strip.tsx

'use client';

import { useMemo } from 'react';
import { Calendar, FileText, Microscope, ChevronRight, Clock, AlertTriangle, Video } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';

interface AttentionStripProps {
  audiencias: Audiencia[];
  expedientes: Expediente[];
  pericias: Pericia[];
  onOpenAllDetails: () => void;
  onOpenAudiencia?: (audiencia: Audiencia) => void;
}

function formatCountdown(dataInicio: string): { label: string; urgency: 'low' | 'medium' | 'high' } {
  const target = new Date(dataInicio);
  const now = new Date();
  if (isPast(target)) return { label: 'Em andamento', urgency: 'high' };

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;

  if (days > 3) return { label: `em ${days}d`, urgency: 'low' };
  if (days > 0) return { label: `em ${days}d ${hours}h`, urgency: 'medium' };
  return { label: `em ${hours}h`, urgency: 'high' };
}

const URGENCY_STYLES = {
  low: 'text-primary/70',
  medium: 'text-warning',
  high: 'text-destructive',
};

/**
 * AttentionStrip — superfície proativa que mostra apenas itens urgentes.
 * Renderiza condicionalmente: se não há urgência, retorna null.
 */
export function AttentionStrip({
  audiencias,
  expedientes,
  pericias,
  onOpenAllDetails,
  onOpenAudiencia,
}: AttentionStripProps) {
  // Próxima audiência (marcada, no futuro ou em andamento)
  const proximaAudiencia = useMemo(() => {
    const now = new Date();
    const futuras = audiencias
      .filter((a) => a.status === 'MARCADA' || a.status === 'marcada')
      .filter((a) => new Date(a.dataFim || a.dataInicio) >= now)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
    return futuras[0] || null;
  }, [audiencias]);

  // Expedientes urgentes
  const expedientesUrgentes = useMemo(() => {
    const vencidos = expedientes.filter((e) => e.prazoVencido && !e.baixadoEm);
    const vencendo = expedientes.filter(
      (e) => !e.prazoVencido && !e.baixadoEm && e.dataPrazoLegalParte && differenceInDays(new Date(e.dataPrazoLegalParte), new Date()) <= 5
    );
    return { vencidos, vencendo, total: vencidos.length + vencendo.length };
  }, [expedientes]);

  // Perícias pendentes
  const periciasPendentes = useMemo(
    () => pericias.filter((p) => !p.laudoJuntado),
    [pericias]
  );

  // Se nada urgente, não renderiza
  const hasUrgency = proximaAudiencia || expedientesUrgentes.total > 0 || periciasPendentes.length > 0;
  if (!hasUrgency) return null;

  return (
    <GlassPanel depth={2} className="mx-4 mt-2 shrink-0">
      <div className="flex items-stretch overflow-x-auto">
        {/* Próxima audiência */}
        {proximaAudiencia && (() => {
          const countdown = formatCountdown(proximaAudiencia.dataInicio);
          return (
            <div className="flex-1 min-w-[200px] px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="size-3.5 text-primary/40" />
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Próxima Audiência
                </span>
                <span className={cn('text-[10px] font-bold tabular-nums ml-auto', URGENCY_STYLES[countdown.urgency])}>
                  {countdown.label}
                </span>
              </div>
              <p className="text-xs font-medium truncate">
                {proximaAudiencia.tipoDescricao || 'Audiência'}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {format(new Date(proximaAudiencia.dataInicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
              {onOpenAudiencia && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5 h-6 px-2 text-[10px]"
                  onClick={() => onOpenAudiencia(proximaAudiencia)}
                >
                  Ver detalhes <ChevronRight className="size-3 ml-0.5" />
                </Button>
              )}
            </div>
          );
        })()}

        {/* Divider */}
        {proximaAudiencia && expedientesUrgentes.total > 0 && (
          <div className="w-px bg-border/10 shrink-0" />
        )}

        {/* Expedientes urgentes */}
        {expedientesUrgentes.total > 0 && (
          <div className="flex-1 min-w-[180px] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="size-3.5 text-warning/40" />
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Prazos
              </span>
            </div>
            {expedientesUrgentes.vencidos.length > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="size-3 text-destructive/70" />
                <span className="text-[10px] font-medium text-destructive/70">
                  {expedientesUrgentes.vencidos.length} vencido{expedientesUrgentes.vencidos.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {expedientesUrgentes.vencendo.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-warning/70" />
                <span className="text-[10px] font-medium text-warning/70">
                  {expedientesUrgentes.vencendo.length} vencendo
                </span>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {(proximaAudiencia || expedientesUrgentes.total > 0) && periciasPendentes.length > 0 && (
          <div className="w-px bg-border/10 shrink-0" />
        )}

        {/* Perícias pendentes */}
        {periciasPendentes.length > 0 && (
          <div className="flex-1 min-w-[160px] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Microscope className="size-3.5 text-info/40" />
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Perícias
              </span>
            </div>
            <span className="text-[10px] font-medium text-info/70">
              {periciasPendentes.length} pendente{periciasPendentes.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Ver todos */}
        <div className="flex items-center px-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[10px] text-muted-foreground/50"
            onClick={onOpenAllDetails}
          >
            Ver todos <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/attention-strip.tsx
git commit -m "feat(processos): add AttentionStrip proactive urgency surface"
```

---

## Task 10: AllDetailsSheet

**Files:**
- Create: `src/app/(authenticated)/processos/components/cockpit/all-details-sheet.tsx`

- [ ] **Step 1: Create the all details sheet**

```typescript
// src/app/(authenticated)/processos/components/cockpit/all-details-sheet.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileText, Calendar, Microscope } from 'lucide-react';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetContent,
  DetailSheetFooter,
} from '@/components/shared/detail-sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { actionObterDetalhesComplementaresProcesso } from '../../actions';
import { actionListarTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';

interface UsuarioInfo {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface AllDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: number;
  numeroProcesso: string;
  usuariosMap: Map<number, UsuarioInfo>;
}

/**
 * AllDetailsSheet — Sheet lateral com todos os detalhes complementares.
 * Substitui ProcessoDetailsTabs no cockpit, mas como sheet lateral.
 * Reutiliza as mesmas server actions para buscar dados.
 */
export function AllDetailsSheet({
  open,
  onOpenChange,
  processoId,
  numeroProcesso,
  usuariosMap,
}: AllDetailsSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      })
      .catch((err) => console.error('Erro ao carregar detalhes:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} side="right">
      <DetailSheetHeader>
        <DetailSheetTitle>Detalhes Complementares</DetailSheetTitle>
      </DetailSheetHeader>

      <DetailSheetContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="expedientes">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="expedientes" className="gap-1.5 text-sm">
                <FileText className="size-3.5" />
                Expedientes
                {totalExpedientes > 0 && (
                  <SemanticBadge category="status" value={totalExpedientes} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalExpedientes}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audiencias" className="gap-1.5 text-sm">
                <Calendar className="size-3.5" />
                Audiências
                {totalAudiencias > 0 && (
                  <SemanticBadge category="status" value={totalAudiencias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalAudiencias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pericias" className="gap-1.5 text-sm">
                <Microscope className="size-3.5" />
                Perícias
                {totalPericias > 0 && (
                  <SemanticBadge category="status" value={totalPericias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalPericias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expedientes" className="mt-3">
              {totalExpedientes === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum expediente.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {expedientes.map((exp) => (
                    <div key={exp.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">{exp.tipoExpediente || 'Expediente'}</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {exp.dataCriacaoExpediente ? new Date(exp.dataCriacaoExpediente).toLocaleDateString('pt-BR') : '--'}
                        {exp.dataPrazoLegalParte && ` · Prazo: ${new Date(exp.dataPrazoLegalParte).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audiencias" className="mt-3">
              {totalAudiencias === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma audiência.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {audiencias.map((aud) => (
                    <div key={aud.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">{aud.tipoDescricao || 'Audiência'}</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {new Date(aud.dataInicio).toLocaleDateString('pt-BR')}
                        {aud.salaAudienciaNome && ` · Sala ${aud.salaAudienciaNome}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pericias" className="mt-3">
              {totalPericias === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma perícia.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {pericias.map((per) => (
                    <div key={per.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">{per.especialidade?.descricao || 'Perícia'}</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {per.perito?.nome && `Perito: ${per.perito.nome} · `}
                        Prazo: {per.prazoEntrega ? new Date(per.prazoEntrega).toLocaleDateString('pt-BR') : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/cockpit/all-details-sheet.tsx
git commit -m "feat(processos): add AllDetailsSheet for complementary details"
```

---

## Task 11: Rewrite ProcessoVisualizacao

**Files:**
- Modify: `src/app/(authenticated)/processos/components/processo-visualizacao.tsx`

- [ ] **Step 1: Rewrite the layout orchestrator**

Replace the entire content of `processo-visualizacao.tsx` with the new cockpit layout. Key changes:

1. Replace `ProcessoHeader` import with `CaseIdentityBar` from `./cockpit/case-identity-bar`
2. Replace `ProcessoDetailsTabs` import with `AttentionStrip` from `./cockpit/attention-strip` and `AllDetailsSheet` from `./cockpit/all-details-sheet`
3. Replace `TimelineSidebar` import with `PulseTimeline` from `./cockpit/pulse-timeline`
4. Add imports for `FutureTimelineItem` from `./cockpit/types`
5. Add new state: `isAllDetailsOpen`, fetch complementary data for AttentionStrip
6. Build `futureItems` from complementary data (audiências futuras, expedientes com prazo)
7. Replace the `<section className="overflow-hidden rounded-2xl border bg-card shadow-sm ...">` wrapper with a flat glass layout
8. Layout structure becomes:
   - `CaseIdentityBar` (always visible, shrink-0)
   - `AttentionStrip` (conditional, shrink-0)
   - `ResizablePanelGroup` with `PulseTimeline` and `DocumentViewer`

The full code is large. The implementor should follow the layout from spec section 7 ("Layout Orquestrador"), replacing each section with the cockpit equivalents. Key structural changes:

- Remove the outer `<section className="overflow-hidden rounded-2xl border bg-card shadow-sm">` — use flat layout
- `CaseIdentityBar` receives `isReadingFocused` prop
- Add `useEffect` to fetch complementary data via `actionObterDetalhesComplementaresProcesso` for the AttentionStrip
- Build `futureItems: FutureTimelineItem[]` from audiências (status MARCADA, dataInicio > now) and expedientes (dataPrazoLegalParte > now, !baixadoEm)
- Pass `futureItems` and `graus` (from processo.grausAtivos) to PulseTimeline
- `isAllDetailsOpen` state controls AllDetailsSheet
- Add `onOpenSearch` prop to CaseIdentityBar connected to `setIsSearchOpen(true)`

- [ ] **Step 2: Verify the app compiles**

Run: `npm run type-check`
Expected: No TypeScript errors in the cockpit components

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/processos/components/processo-visualizacao.tsx
git commit -m "feat(processos): rewrite ProcessoVisualizacao with cockpit layout"
```

---

## Task 12: Update Barrel Exports

**Files:**
- Modify: `src/app/(authenticated)/processos/index.ts`

- [ ] **Step 1: Add cockpit exports to barrel**

Add these exports to the processos barrel file:

```typescript
// Cockpit components
export { CaseIdentityBar } from './components/cockpit/case-identity-bar';
export { AttentionStrip } from './components/cockpit/attention-strip';
export { AllDetailsSheet } from './components/cockpit/all-details-sheet';
export { PulseTimeline } from './components/cockpit/pulse-timeline';
export { TimelineFilterChips } from './components/cockpit/timeline-filter-chips';
export { TimelineMonthGroup } from './components/cockpit/timeline-month-group';
export { TimelineNowMarker } from './components/cockpit/timeline-now-marker';
export { TimelinePhaseMarker } from './components/cockpit/timeline-phase-marker';
export type { TimelineFilterType, FutureTimelineItem, ProcessoPhase } from './components/cockpit/types';
```

- [ ] **Step 2: Run type-check and dev server**

Run: `npm run type-check`
Then: `npm run dev` — navigate to `/processos/[id]` to verify the cockpit renders

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/processos/index.ts
git commit -m "feat(processos): export cockpit components from barrel"
```

---

## Task 13: Visual QA & Glass Styling for Viewer

**Files:**
- Modify: `src/app/(authenticated)/processos/components/viewer/viewer-toolbar.tsx`

- [ ] **Step 1: Migrate viewer toolbar to glass styling**

In `viewer-toolbar.tsx`, update the toolbar container div classes:
- Replace any `bg-background border` with `backdrop-blur-sm bg-background/80 border-border/20 rounded-xl`
- This gives the toolbar the glass effect consistent with the cockpit design

- [ ] **Step 2: Visual QA check**

Navigate to `/processos/[id]` in the dev server and verify:
- CaseIdentityBar is compact (~48px) with all info visible
- AttentionStrip shows urgency info (or is hidden if no urgency)
- PulseTimeline shows AGORA marker with correct date
- Timeline items are grouped by month
- Filter chips work (clicking "Docs" shows only documents)
- Reading focus mode collapses the identity bar
- Mobile tabs still work

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(processos): complete cockpit visual QA and glass styling for viewer"
```
