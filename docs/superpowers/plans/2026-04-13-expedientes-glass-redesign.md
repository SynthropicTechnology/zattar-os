# Expedientes Glass Briefing Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar as views Lista, Mes e Ano do modulo de expedientes para o design system Glass Briefing, alinhando-as ao padrao ja implementado em Audiencias.

**Architecture:** Tres views independentes que compartilham o mesmo orchestrator (`expedientes-content.tsx`) e dados (`useExpedientes` hook). Cada view sera refatorada isoladamente: Lista ganha glass rows com urgency system; Mes ganha Glass panels com calendario rico e day panel com urgency sections; Ano ganha heatmap estilo GitHub com sidebar de KPIs. Nenhuma mudanca na camada de dados/actions.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, date-fns, lucide-react, GlassPanel/Heading/Text/SemanticBadge/IconContainer do design system.

**POC Reference:** `.superpowers/brainstorm/expedientes-redesign/` (01-lista.html, 02-mes.html, 03-ano.html)

**Pattern Reference:** Audiencias module (`src/app/(authenticated)/audiencias/components/`)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `expedientes/components/expedientes-glass-list.tsx` | Glass row rendering for lista view (replaces DataTable rows) |
| `expedientes/components/expedientes-year-heatmap.tsx` | Year heatmap + sidebar KPIs (replaces YearCalendarGrid) |

### Modified Files
| File | Changes |
|------|---------|
| `expedientes/components/expedientes-list-wrapper.tsx` | Add glass row mode, keep DataTable for bulk ops |
| `expedientes/components/expedientes-month-wrapper.tsx` | Wrap in GlassPanel, add urgency sections to layout |
| `expedientes/components/expedientes-day-list.tsx` | Add urgency grouping, glass cards, CTAs |
| `expedientes/components/expedientes-calendar-compact.tsx` | Add urgency-colored items in day cells |
| `expedientes/components/expedientes-year-wrapper.tsx` | Use new heatmap component |

### Unchanged (data layer)
- `domain.ts`, `repository.ts`, `service.ts`, `actions/`, `hooks/` — zero changes
- `expedientes-content.tsx` — zero changes (orchestrator already passes correct props)

---

## Task 1: Create `expedientes-glass-list.tsx`

**Files:**
- Create: `src/app/(authenticated)/expedientes/components/expedientes-glass-list.tsx`

This is the core new component — a glass row list following the pattern from `audiencias-glass-list.tsx`.

- [ ] **Step 1: Create the glass list component file**

Create `expedientes-glass-list.tsx` with the following structure:

```typescript
'use client';

// Imports needed:
// - React, useMemo, useCallback
// - date-fns: format, parseISO, differenceInDays, isToday, isPast
// - date-fns/locale: ptBR
// - lucide-react: FileText, ChevronRight, AlertTriangle, Clock, CalendarDays, Users2, Check
// - cn from @/lib/utils
// - GlassPanel from @/components/shared/glass-panel
// - Text from @/components/ui/typography
// - SemanticBadge from @/components/ui/semantic-badge
// - Skeleton from @/components/ui/skeleton
// - Tooltip, TooltipContent, TooltipTrigger, TooltipProvider from @/components/ui/tooltip
// - Expediente, getExpedientePartyNames from ../domain
// - UsuarioData type from @/app/(authenticated)/usuarios

interface ExpedientesGlassListProps {
  expedientes: Expediente[];
  isLoading: boolean;
  onViewDetail: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: UsuarioData[];
}
```

**Column Headers sub-component:**
- Grid: `grid grid-cols-[32px_2.5fr_1fr_0.8fr_0.8fr_80px_80px_40px] gap-3 px-4 pb-2`
- Cells: `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50`
- Columns: checkbox, Processo/Partes, Prazo, Tribunal, Responsavel, Origem, Contagem, Actions

**GlassRow sub-component:**
- Button element with grid matching columns
- Background: alternating `bg-white/[0.018]` / `bg-white/[0.028]`
- Hover: `hover:bg-white/[0.055] hover:border-white/[0.12] hover:scale-[1.003] hover:-translate-y-px hover:shadow-lg`
- Left border: 3px urgency-colored (use `getUrgencyLevel()` helper)
- Transition: `transition-all duration-[180ms] ease-out`

**Urgency helper:**
```typescript
function getUrgencyLevel(exp: Expediente): 'critico' | 'alto' | 'medio' | 'baixo' | 'ok' {
  if (exp.baixadoEm) return 'ok';
  const prazo = exp.dataPrazoLegalParte;
  if (!prazo) return 'ok';
  const dias = differenceInDays(parseISO(prazo), new Date());
  if (dias < 0 || exp.prazoVencido) return 'critico';
  if (dias === 0) return 'alto';
  if (dias <= 3) return 'medio';
  return 'baixo';
}
```

**Urgency border classes:**
```typescript
const URGENCY_BORDER: Record<string, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
};
```

**Row cells content:**
1. UrgencyDot (8x8 rounded-full with glow shadow)
2. Main cell: processo number (tabular-nums) + urgency badge + party names below
3. Prazo date + ciencia date below
4. TRT SemanticBadge + Grau badge
5. Responsavel avatar circle + name, or "Sem responsavel" in destructive italic
6. Origem badge (Captura/Manual)
7. Countdown badge with urgency color (-5d, 0d, 2d, 9d, --)
8. ChevronRight on hover (row-actions pattern)

**Countdown component (inline):**
```typescript
function CountdownBadge({ dias, urgency }: { dias: number | null; urgency: string }) {
  if (dias === null) return <span className="text-[11px] text-muted-foreground/40">--</span>;
  const label = dias === 0 ? '0d' : dias > 0 ? `${dias}d` : `${dias}d`;
  const colorClass = {
    critico: 'bg-destructive/8 text-destructive',
    alto: 'bg-warning/8 text-warning',
    medio: 'bg-info/8 text-info',
    baixo: 'bg-success/6 text-success',
    ok: 'bg-muted text-muted-foreground/50',
  }[urgency] || '';
  return (
    <span className={cn('text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg text-center', colorClass)}>
      {label}
    </span>
  );
}
```

**Loading state:** `ListSkeleton` — 6 skeleton rows matching the grid structure.

**Empty state:** Centered FileSearch icon + "Nenhum expediente encontrado" text.

- [ ] **Step 2: Verify component renders in isolation**

Temporarily import in `expedientes-list-wrapper.tsx` alongside DataTable. Test:
```bash
npm run dev
```
Navigate to `/app/expedientes/lista`, confirm component renders.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-glass-list.tsx
git commit -m "feat(expedientes): add glass row list component for Lista view"
```

---

## Task 2: Integrate glass list into `expedientes-list-wrapper.tsx`

**Files:**
- Modify: `src/app/(authenticated)/expedientes/components/expedientes-list-wrapper.tsx`

The wrapper keeps ALL its current state (pagination, filters, hooks). We add a view mode toggle: "glass" (default) vs "table" (for bulk operations that need checkboxes).

- [ ] **Step 1: Add view mode state and glass list import**

Add to imports:
```typescript
import { ExpedientesGlassList } from './expedientes-glass-list';
```

Add state:
```typescript
const [listMode, setListMode] = useState<'glass' | 'table'>('glass');
```

- [ ] **Step 2: Add mode toggle in toolbar area**

After the density toggle in the DataTableToolbar, add a small toggle:
```tsx
<div className="flex gap-1 rounded-lg bg-muted/30 p-0.5">
  <button
    onClick={() => setListMode('glass')}
    className={cn('px-2 py-1 rounded-md text-[10px] font-medium transition-colors',
      listMode === 'glass' ? 'bg-primary/12 text-primary' : 'text-muted-foreground'
    )}
  >Rows</button>
  <button
    onClick={() => setListMode('table')}
    className={cn('px-2 py-1 rounded-md text-[10px] font-medium transition-colors',
      listMode === 'table' ? 'bg-primary/12 text-primary' : 'text-muted-foreground'
    )}
  >Tabela</button>
</div>
```

- [ ] **Step 3: Conditionally render glass list or DataTable**

Replace the DataTable usage with:
```tsx
{listMode === 'glass' ? (
  <ExpedientesGlassList
    expedientes={expedientes}
    isLoading={isLoading}
    onViewDetail={handleViewDetail}
    onBaixar={handleBaixar}
    usuariosData={usuarios}
  />
) : (
  <DataTable columns={columns} data={expedientes} ... />
)}
```

Need to wire `handleViewDetail` and `handleBaixar` — these need to bubble up to `expedientes-content.tsx`. Since the list wrapper already receives `refreshCounter`, we add callbacks via the existing pattern. Add props:
```typescript
export interface ExpedientesListWrapperProps {
  search?: string;
  activeTab?: 'todos' | 'pendentes' | 'baixados';
  refreshCounter?: number;
  onViewDetail?: (expediente: Expediente) => void;  // NEW
  onBaixar?: (expediente: Expediente) => void;       // NEW
}
```

- [ ] **Step 4: Update `expedientes-content.tsx` to pass callbacks**

In `expedientes-content.tsx`, update the lista rendering:
```tsx
{viewMode === 'lista' && (
  <ExpedientesListWrapper
    search={search}
    activeTab={activeTab}
    refreshCounter={refreshCounter}
    onViewDetail={handleViewDetail}
    onBaixar={handleBaixar}
  />
)}
```

- [ ] **Step 5: Test and commit**

```bash
npm run dev
npm run type-check
```

Navigate to `/app/expedientes/lista`:
- Verify glass rows render by default
- Verify mode toggle switches between glass and table
- Verify clicking a row opens detail dialog
- Verify urgency borders show correctly

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-glass-list.tsx \
        src/app/\(authenticated\)/expedientes/components/expedientes-list-wrapper.tsx \
        src/app/\(authenticated\)/expedientes/components/expedientes-content.tsx
git commit -m "feat(expedientes): integrate glass rows into Lista view with mode toggle"
```

---

## Task 3: Enhance `expedientes-day-list.tsx` with urgency sections

**Files:**
- Modify: `src/app/(authenticated)/expedientes/components/expedientes-day-list.tsx`

The day list needs urgency-grouped sections (like the POC 02-mes.html) instead of a flat list.

- [ ] **Step 1: Add urgency grouping logic**

Add helper to group expedientes by urgency:
```typescript
import { differenceInDays, parseISO } from 'date-fns';

function groupByUrgency(expedientes: Expediente[]) {
  const groups = {
    critico: [] as Expediente[],
    alto: [] as Expediente[],
    medio: [] as Expediente[],
    baixo: [] as Expediente[],
    ok: [] as Expediente[],
  };
  for (const exp of expedientes) {
    const prazo = exp.dataPrazoLegalParte;
    if (exp.baixadoEm) { groups.ok.push(exp); continue; }
    if (!prazo) { groups.ok.push(exp); continue; }
    const dias = differenceInDays(parseISO(prazo), new Date());
    if (dias < 0 || exp.prazoVencido) groups.critico.push(exp);
    else if (dias === 0) groups.alto.push(exp);
    else if (dias <= 3) groups.medio.push(exp);
    else groups.baixo.push(exp);
  }
  return groups;
}

const URGENCY_SECTIONS = [
  { key: 'critico', label: 'Vencidos', color: 'destructive', icon: AlertTriangle },
  { key: 'alto', label: 'Vence Hoje', color: 'warning', icon: Clock },
  { key: 'medio', label: 'Proximos Dias', color: 'info', icon: CalendarDays },
  { key: 'baixo', label: 'No Prazo', color: 'success', icon: Check },
  { key: 'ok', label: 'Outros', color: 'muted-foreground', icon: FileText },
] as const;
```

- [ ] **Step 2: Add UrgencySection divider component**

```tsx
function UrgencySection({ label, color, icon: Icon, count }: {
  label: string; color: string; icon: LucideIcon; count: number;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1">
      <div className={cn('size-1.5 rounded-full', `bg-${color}`)} />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
      <span className="text-[9px] tabular-nums text-muted-foreground/40">{count}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}
```

- [ ] **Step 3: Replace flat list with grouped rendering**

Update the `expedientesDoDia` section to use groups:
```tsx
const groups = useMemo(() => groupByUrgency(expedientesDoDia), [expedientesDoDia]);

// In JSX, replace flat map with:
{URGENCY_SECTIONS.map(({ key, label, color, icon }) => {
  const items = groups[key as keyof typeof groups];
  if (items.length === 0) return null;
  return (
    <div key={key}>
      <UrgencySection label={label} color={color} icon={icon} count={items.length} />
      {items.map((expediente) => (
        <GlassPanel key={expediente.id} depth={1} className="...">
          {/* existing card content + urgency left border */}
        </GlassPanel>
      ))}
    </div>
  );
})}
```

- [ ] **Step 4: Add urgency left border to cards and CTA buttons**

Each card gets urgency border:
```tsx
const urgencyBorder = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: '',
}[urgencyKey] || '';
```

Add action buttons in card footer:
```tsx
<div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
  <button className="px-2 py-0.5 rounded-md bg-primary/6 text-primary text-[10px] font-medium hover:bg-primary/12 transition-colors">
    Detalhes
  </button>
  {onBaixar && !exp.baixadoEm && (
    <button className="px-2 py-0.5 rounded-md bg-success/6 text-success text-[10px] font-medium hover:bg-success/12 transition-colors">
      Baixar
    </button>
  )}
</div>
```

- [ ] **Step 5: Update header with styled date display**

Replace plain header with Glass Briefing styled version:
```tsx
<div className="px-4 py-3 border-b border-border/30">
  <Text variant="overline" className="text-primary/70">{weekday}</Text>
  <Heading level="card" className="mt-0.5">{dayFormatted}</Heading>
  <Text variant="caption">{expedientesDoDia.length} expedientes</Text>
</div>
```

- [ ] **Step 6: Test and commit**

```bash
npm run dev
npm run type-check
```

Navigate to `/app/expedientes/mes`, select a day with expedientes, verify urgency sections appear.

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-day-list.tsx
git commit -m "feat(expedientes): add urgency grouping to day list panel"
```

---

## Task 4: Enhance `expedientes-month-wrapper.tsx` and `expedientes-calendar-compact.tsx`

**Files:**
- Modify: `src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx`
- Modify: `src/app/(authenticated)/expedientes/components/expedientes-calendar-compact.tsx`

- [ ] **Step 1: Wrap month layout in GlassPanel containers**

In `expedientes-month-wrapper.tsx`, wrap the two columns:
```tsx
import { GlassPanel } from '@/components/shared/glass-panel';

// Calendar side:
<GlassPanel className="flex flex-col gap-4 h-175 p-5">
  <ExpedientesCalendarCompact ... />
</GlassPanel>

// Day list side:
<GlassPanel depth={2} className="flex flex-col h-175 overflow-hidden">
  <ExpedientesDayList ... />
</GlassPanel>
```

- [ ] **Step 2: Add urgency-colored mini items in calendar cells**

In `expedientes-calendar-compact.tsx`, enhance the day cell rendering. After the count display, add mini urgency items:

```tsx
// Add urgency classification for each day's expedientes
const dayUrgencyCounts = useMemo(() => {
  // For each day, compute { critico, alto, medio, baixo } counts
  // Return Map<dateString, { critico: number, alto: number, medio: number, baixo: number }>
}, [expedientesByDay]);

// In the cell, add colored dots:
{count > 0 && cell.currentMonth && (
  <div className="flex gap-0.5 mt-0.5">
    {urgency.critico > 0 && <div className="size-1.5 rounded-full bg-destructive" />}
    {urgency.alto > 0 && <div className="size-1.5 rounded-full bg-warning" />}
    {urgency.medio > 0 && <div className="size-1.5 rounded-full bg-info" />}
    {urgency.baixo > 0 && <div className="size-1.5 rounded-full bg-success" />}
  </div>
)}
```

- [ ] **Step 3: Add legend below calendar**

```tsx
<div className="flex items-center gap-3 pt-2 px-1">
  {[
    { color: 'bg-destructive', label: 'Vencido' },
    { color: 'bg-warning', label: 'Hoje' },
    { color: 'bg-info', label: 'Proximo' },
    { color: 'bg-success', label: 'No prazo' },
  ].map(({ color, label }) => (
    <div key={label} className="flex items-center gap-1">
      <div className={cn('size-1.5 rounded-full', color)} />
      <span className="text-[9px] text-muted-foreground/50">{label}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Test and commit**

```bash
npm run dev
npm run type-check
```

Navigate to `/app/expedientes/mes`:
- Calendar cells should show urgency-colored dots
- Day panel should show urgency sections (from Task 3)
- Both panels wrapped in GlassPanel

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-month-wrapper.tsx \
        src/app/\(authenticated\)/expedientes/components/expedientes-calendar-compact.tsx
git commit -m "feat(expedientes): add Glass panels and urgency dots to Mes view"
```

---

## Task 5: Create `expedientes-year-heatmap.tsx`

**Files:**
- Create: `src/app/(authenticated)/expedientes/components/expedientes-year-heatmap.tsx`

Follow the pattern from `audiencias-year-heatmap.tsx` but with expedientes domain.

- [ ] **Step 1: Create the year heatmap component**

Structure (following audiencias pattern exactly):

```typescript
'use client';

// Imports:
// - React, useState, useMemo
// - date-fns: getYear, getMonth, getDate, format, parseISO, differenceInDays, startOfYear, endOfYear, eachDayOfInterval, getDay, getDaysInMonth, startOfMonth
// - date-fns/locale: ptBR
// - lucide-react: CalendarDays, Flame, BarChart2, CheckCircle2, Clock, ChevronLeft, ChevronRight, AlertTriangle
// - cn from @/lib/utils
// - GlassPanel from @/components/shared/glass-panel
// - IconContainer from @/components/ui/icon-container
// - Text from @/components/ui/typography
// - Button from @/components/ui/button
// - Tooltip, TooltipContent, TooltipTrigger, TooltipProvider from @/components/ui/tooltip
// - Expediente from ../domain

interface ExpedientesYearHeatmapProps {
  expedientes: Expediente[];
  currentDate?: Date;
}
```

**Layout structure:**
```
TooltipProvider
  flex flex-col gap-5
    ├─ Year Navigator (flex gap-2: ChevronLeft, year, ChevronRight, "Hoje" button)
    ├─ flex gap-5 flex-wrap xl:flex-nowrap
    │   ├─ GlassPanel depth={2} (sidebar, w-full xl:w-64 shrink-0)
    │   │   ├─ StatCard: Total no Ano
    │   │   ├─ StatCard: Baixados (+ progress bar)
    │   │   ├─ StatCard: Pendentes (+ breakdown dots)
    │   │   ├─ StatCard: Media Semanal
    │   │   └─ Top Months Ranking (bar chart)
    │   └─ GlassPanel depth={1} (heatmap, flex-1)
    │       ├─ MonthGrid x12 (grid-cols-4 gap-x-6 gap-y-8)
    │       └─ Legend (Menos → Mais squares)
```

**MonthGrid sub-component (React.memo):**
```tsx
const MonthGrid = React.memo(function MonthGrid({
  monthIndex, year, dayMap, onDayClick
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, Expediente[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const monthName = format(new Date(year, monthIndex, 1), 'MMMM', { locale: ptBR });
  const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, monthIndex)));
  // Adjust for Monday-start: (firstDayOfWeek + 6) % 7
  const offset = (firstDayOfWeek + 6) % 7;

  const monthTotal = /* sum of dayMap counts for this month */;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Text variant="overline" className="text-muted-foreground/70 capitalize">{monthName}</Text>
        <Text variant="micro-caption">{monthTotal}</Text>
      </div>
      <div className="grid grid-cols-7 gap-[2px] mb-0.5">
        {['S','T','Q','Q','S','S','D'].map(d => (
          <span key={d} className="text-[7px] font-semibold text-center text-muted-foreground/30 uppercase">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {/* offset empty cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {/* day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${monthIndex}-${day}`;
          const exps = dayMap.get(key) || [];
          const count = exps.length;
          const isCurrentDay = /* check */;

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => count > 0 && onDayClick(monthIndex, day)}
                  className={cn(
                    'aspect-square rounded-[2px] transition-all duration-100',
                    count === 0 && 'bg-white/[0.05]',
                    count >= 1 && count <= 2 && 'bg-primary/[0.15]',
                    count >= 3 && count <= 5 && 'bg-primary/[0.35]',
                    count >= 6 && count <= 10 && 'bg-primary/[0.55]',
                    count > 10 && 'bg-primary/[0.80]',
                    count > 0 && 'cursor-pointer hover:scale-[1.3] hover:opacity-80',
                    isCurrentDay && 'ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {format(new Date(year, monthIndex, day), "d 'de' MMMM", { locale: ptBR })} &middot; {count} exp.
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});
```

**Stats computation:**
```typescript
const stats = useMemo(() => {
  const yearExps = expedientes.filter(e => {
    const prazo = e.dataPrazoLegalParte;
    if (!prazo) return false;
    return getYear(parseISO(prazo)) === year;
  });
  const baixados = yearExps.filter(e => e.baixadoEm);
  const pendentes = yearExps.filter(e => !e.baixadoEm);
  const vencidos = pendentes.filter(e => e.prazoVencido || (e.dataPrazoLegalParte && differenceInDays(parseISO(e.dataPrazoLegalParte), new Date()) < 0));
  const hoje = pendentes.filter(e => e.dataPrazoLegalParte && differenceInDays(parseISO(e.dataPrazoLegalParte), new Date()) === 0);
  const proximos = pendentes.filter(e => {
    if (!e.dataPrazoLegalParte) return false;
    const d = differenceInDays(parseISO(e.dataPrazoLegalParte), new Date());
    return d > 0 && d <= 3;
  });

  // Monthly counts for ranking
  const monthCounts = Array.from({ length: 12 }, (_, m) =>
    yearExps.filter(e => e.dataPrazoLegalParte && getMonth(parseISO(e.dataPrazoLegalParte)) === m).length
  );
  const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
  const maxMonthCount = monthCounts[maxMonth] || 0;

  // Weeks in year so far
  const weeksElapsed = Math.max(1, Math.ceil(differenceInDays(new Date(), startOfYear(new Date(year, 0, 1))) / 7));
  const weekAvg = Math.round(yearExps.length / weeksElapsed);

  return {
    total: yearExps.length,
    baixados: baixados.length,
    pendentes: pendentes.length,
    vencidos: vencidos.length,
    hoje: hoje.length,
    proximos: proximos.length,
    taxa: yearExps.length > 0 ? Math.round((baixados.length / yearExps.length) * 100) : 0,
    monthCounts,
    maxMonth,
    maxMonthCount,
    weekAvg,
  };
}, [expedientes, year]);
```

**Day click handler:**
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [expedientesDia, setExpedientesDia] = useState<Expediente[]>([]);

const handleDayClick = useCallback((monthIndex: number, day: number) => {
  const dayExps = dayMap.get(`${monthIndex}-${day}`) || [];
  setExpedientesDia(dayExps);
  setDialogOpen(true);
}, [dayMap]);
```

- [ ] **Step 2: Test heatmap renders**

```bash
npm run dev
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-year-heatmap.tsx
git commit -m "feat(expedientes): add year heatmap with sidebar KPIs"
```

---

## Task 6: Update `expedientes-year-wrapper.tsx` to use heatmap

**Files:**
- Modify: `src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx`

- [ ] **Step 1: Replace YearCalendarGrid with ExpedientesYearHeatmap**

```typescript
import { ExpedientesYearHeatmap } from './expedientes-year-heatmap';

export function ExpedientesYearWrapper({
  expedientes,
  currentDate = new Date(),
}: ExpedientesYearWrapperProps) {
  return (
    <div className="flex flex-col gap-4">
      <ExpedientesYearHeatmap
        expedientes={expedientes}
        currentDate={currentDate}
      />
    </div>
  );
}
```

Remove the old `ExpedientesCalendarYear` import.

- [ ] **Step 2: Test and commit**

```bash
npm run dev
npm run type-check
```

Navigate to `/app/expedientes/ano`:
- Heatmap grid shows 12 months in 4x3
- Sidebar shows stats
- Today cell highlighted
- Day cells with data show intensity colors

```bash
git add src/app/\(authenticated\)/expedientes/components/expedientes-year-wrapper.tsx
git commit -m "feat(expedientes): use year heatmap in Ano view"
```

---

## Task 7: Type check and visual verification

**Files:** All modified files

- [ ] **Step 1: Run type check**

```bash
npm run type-check
```

Fix any TypeScript errors found.

- [ ] **Step 2: Test all 5 views work**

```bash
npm run dev
```

Navigate through all views:
- `/app/expedientes` (Quadro) — unchanged, should work
- `/app/expedientes/semana` (Semana) — unchanged, should work
- `/app/expedientes/lista` (Lista) — new glass rows
- `/app/expedientes/mes` (Mes) — Glass panels + urgency
- `/app/expedientes/ano` (Ano) — heatmap + sidebar

Verify:
- Dark mode toggle works on all views
- View switcher navigates correctly
- Tab pills filter data
- Search works
- No console errors

- [ ] **Step 3: Run existing tests**

```bash
npm test -- --testPathPattern=expedientes
```

Fix any broken tests (should be none since we didn't change data layer).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(expedientes): complete Glass Briefing redesign for Lista, Mes and Ano views"
```
