# Audiencias Glass Briefing Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os 21 problemas identificados na auditoria do módulo audiências vs Glass Briefing Design System — dead code, componentes legados, tipografia, tokens, spacing e responsividade.

**Architecture:** 6 dimensões independentes de correção, executáveis em paralelo por agentes. Cada dimensão produz commits atômicos. A Dimensão 1 (Dead Code) deve rodar primeiro pois remove arquivos que outras dimensões referenciam.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Glass Briefing Design System

---

## Dimensão 1: Dead Code Cleanup

**Impacto:** Remove ~150KB de código morto, elimina última dependência de `Sheet` no módulo.

### Task 1.1: Deletar 12 arquivos mortos

**Files:**
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-content.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-list-wrapper.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-month-wrapper.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-year-wrapper.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-table-wrapper.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-calendar-compact.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-calendar-month-view.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-calendar-year-view.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-day-list.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencias-month-day-cell.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/audiencia-detail-sheet.tsx`
- Delete: `src/app/(authenticated)/audiencias/components/__tests__/audiencias-content.test.tsx`

- [ ] **Step 1: Delete all 12 dead files**

```bash
cd src/app/\(authenticated\)/audiencias/components
rm audiencias-content.tsx \
   audiencias-list-wrapper.tsx \
   audiencias-month-wrapper.tsx \
   audiencias-year-wrapper.tsx \
   audiencias-table-wrapper.tsx \
   audiencias-calendar-compact.tsx \
   audiencias-calendar-month-view.tsx \
   audiencias-calendar-year-view.tsx \
   audiencias-day-list.tsx \
   audiencias-month-day-cell.tsx \
   audiencia-detail-sheet.tsx \
   __tests__/audiencias-content.test.tsx
```

- [ ] **Step 2: Clean components barrel — remove dead exports**

Modify: `src/app/(authenticated)/audiencias/components/index.ts`

Replace the ENTIRE file with this content (removes all dead exports, keeps only live components):

```typescript
// Mission View components
export { AudienciasMissionView } from './audiencias-mission-view';
export { MissionCard } from './mission-card';
export { MissionKpiStrip } from './mission-kpi-strip';
export { HearingCountdown } from './hearing-countdown';
export { PrepScore, PrepScoreBadge, calcPrepItems, calcPrepScore } from './prep-score';
export { PostHearingFlow } from './post-hearing-flow';
export { ConflictAlert } from './conflict-alert';
export { LoadHeatmap } from './load-heatmap';
export { AudienciaListRow } from './audiencia-list-row';
export { RhythmStrip } from './rhythm-strip';

// Glass Briefing components
export { AudienciasGlassList } from './audiencias-glass-list';
export { AudienciasGlassMonth } from './audiencias-glass-month';
export { AudienciasYearHeatmap } from './audiencias-year-heatmap';

// Cards and badges
export { AudienciaCard } from './audiencia-card';
export { AudienciaStatusBadge } from './audiencia-status-badge';
export { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';

// Forms and dialogs
export { AudienciaForm } from './audiencia-form';
export { AudienciaDetailDialog } from './audiencia-detail-dialog';
export { AudienciaIndicadorBadges, AUDIENCIA_INDICADOR_SHOW_CONFIGS } from './audiencia-indicador-badges';
export { AudienciaTimeline } from './audiencia-timeline';
export { AudienciasDiaDialog } from './audiencias-dia-dialog';
export { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';
export { NovaAudienciaDialog } from './nova-audiencia-dialog';
export { EditarAudienciaDialog } from './editar-audiencia-dialog';

// List features
export { AudienciasListFilters } from './audiencias-list-filters';
export { getAudienciasColumns, ResponsavelCell, type AudienciaComResponsavel } from './audiencias-list-columns';

// Settings
export { TiposAudienciasList } from './tipos-audiencias-list';

// Filters
export {
  AUDIENCIAS_FILTER_CONFIGS,
  buildAudienciasFilterOptions,
  buildAudienciasFilterGroups,
  parseAudienciasFilters,
} from './audiencias-toolbar-filters';

// Views (Glass Briefing)
export {
  AudienciasSemanaView,
  AudienciasMesView,
  AudienciasAnoView,
  AudienciasListaView,
  AudienciasMissaoContent,
} from './views';
```

- [ ] **Step 3: Clean module-level barrel**

Modify: `src/app/(authenticated)/audiencias/index.ts`

Remove all re-exports of dead components. Specifically remove any lines referencing:
- `AudienciasContent`
- `AudienciasListWrapper`
- `AudienciasTableWrapper`
- `AudienciasMonthWrapper`
- `AudienciasYearWrapper`
- `AudienciasCalendarMonthView`
- `AudienciasCalendarYearView`
- `AudienciasCalendarCompact`
- `AudienciasDayList`
- `AudienciasMonthDayCell`

- [ ] **Step 4: Verify build**

```bash
npm run type-check
```

Expected: PASS with zero errors related to deleted files.

- [ ] **Step 5: Commit**

```bash
git add -A src/app/\(authenticated\)/audiencias/
git commit -m "refactor(audiencias): remove 12 dead code files from pre-Glass migration

Remove legacy orchestrator (audiencias-content), 4 wrapper components,
5 calendar components, detail-sheet, and associated test.
Clean barrel exports to only expose live Glass Briefing components.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Dimensão 2: Dialog & Popover Migration

**Impacto:** Elimina `Tabs` raw do shadcn e `Card/CardContent`, alinha dialogs de form ao Glass Briefing.

### Task 2.1: Migrar `audiencias-dia-dialog.tsx` — Tabs → TabPills + bg-card → GlassPanel

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx`

- [ ] **Step 1: Replace Tabs import with TabPills**

In the imports section, remove:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

Add:
```typescript
import { TabPills } from '@/components/dashboard/tab-pills';
import { GlassPanel } from '@/components/shared/glass-panel';
```

- [ ] **Step 2: Add tab state management**

The current code uses `<Tabs defaultValue="detalhes">` which manages its own state. TabPills requires external state. Add state at the top of the component function:

```typescript
const [activeTab, setActiveTab] = useState<string>('detalhes');
```

Make sure `useState` is imported from `react`.

- [ ] **Step 3: Replace the card wrapper and tab navigation**

Find the pattern (approximately lines 92-100):
```tsx
<div className="border rounded-lg p-4 bg-card">
  <Tabs defaultValue="detalhes" className="w-full">
    <TabsList className="grid w-full grid-cols-2 mb-4">
      <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
      <TabsTrigger value="historico">Histórico</TabsTrigger>
    </TabsList>
```

Replace with:
```tsx
<GlassPanel depth={1} className="p-4">
  <TabPills
    tabs={[
      { id: 'detalhes', label: 'Detalhes' },
      { id: 'historico', label: 'Histórico' },
    ]}
    active={activeTab}
    onChange={setActiveTab}
  />
  <div className="mt-4">
```

- [ ] **Step 4: Replace TabsContent with conditional rendering**

Find and replace:
```tsx
<TabsContent value="detalhes">
  {/* ... content ... */}
</TabsContent>
<TabsContent value="historico">
  {/* ... content ... */}
</TabsContent>
```

With:
```tsx
{activeTab === 'detalhes' && (
  <>
    {/* ... detalhes content unchanged ... */}
  </>
)}
{activeTab === 'historico' && (
  <>
    {/* ... historico content unchanged ... */}
  </>
)}
```

- [ ] **Step 5: Close the new wrapper divs**

Replace the closing `</Tabs></div>` with `</div></GlassPanel>`.

- [ ] **Step 6: Verify**

```bash
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(authenticated\)/audiencias/components/audiencias-dia-dialog.tsx
git commit -m "refactor(audiencias): migrate dia-dialog from Tabs+bg-card to TabPills+GlassPanel

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2.2: Migrar `audiencia-card.tsx` — Card → GlassPanel

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencia-card.tsx`

- [ ] **Step 1: Replace Card imports with GlassPanel**

Remove:
```typescript
import { Card, CardContent } from '@/components/ui/card';
```

Add:
```typescript
import { GlassPanel } from '@/components/shared/glass-panel';
```

- [ ] **Step 2: Replace Card+CardContent with GlassPanel**

Find:
```tsx
<Card className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} onClick={onClick}>
  <CardContent className="p-4">
```

Replace with:
```tsx
<GlassPanel depth={1} className={cn("cursor-pointer hover:shadow-sm transition-all", className)} onClick={onClick}>
  <div className="p-4">
```

And replace closing `</CardContent></Card>` with `</div></GlassPanel>`.

Note: GlassPanel renders a `<div>`, so adding `onClick` requires extending the component or wrapping. Since GlassPanel doesn't accept onClick natively, wrap it instead:

```tsx
<button onClick={onClick} className={cn("text-left w-full cursor-pointer", className)}>
  <GlassPanel depth={1} className="p-4 hover:shadow-sm transition-all">
    {/* ... card content ... */}
  </GlassPanel>
</button>
```

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencia-card.tsx
git commit -m "refactor(audiencias): migrate audiencia-card from Card to GlassPanel

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2.3: Migrar `tipos-audiencias-list.tsx` — Input → SearchInput

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/tipos-audiencias-list.tsx`

- [ ] **Step 1: Replace Input import with SearchInput**

Remove:
```typescript
import { Input } from '@/components/ui/input';
```

Add:
```typescript
import { SearchInput } from '@/components/dashboard/search-input';
```

- [ ] **Step 2: Replace Input usage**

Find (approximately line 93):
```tsx
<Input
  placeholder="Buscar tipo de audiência..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="max-w-sm"
/>
```

Replace with:
```tsx
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar tipo de audiência..."
  className="max-w-sm"
/>
```

Note: `SearchInput` takes `onChange: (value: string) => void` directly (not an event), so no `e.target.value` needed.

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/tipos-audiencias-list.tsx
git commit -m "refactor(audiencias): migrate tipos-audiencias-list from Input to SearchInput

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Dimensão 3: Glass Component Adoption

**Impacto:** Substitui composição manual de IconContainer, raw `<h2>` por `Heading`, e garante uso de `Button` do shadcn.

### Task 3.1: Fix `audiencia-detail-dialog.tsx` — raw `<h2>` → Heading + manual icon → IconContainer

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx`

- [ ] **Step 1: Add IconContainer import**

Add to imports:
```typescript
import { IconContainer } from '@/components/ui/icon-container';
import { Heading } from '@/components/ui/typography';
```

If `Heading` is already imported, skip that line.

- [ ] **Step 2: Replace manual icon container at ~line 158**

Find:
```tsx
<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
```

Replace with:
```tsx
<IconContainer size="md" className="bg-primary/10">
```

And replace its closing `</div>` with `</IconContainer>`.

- [ ] **Step 3: Replace raw h2 at ~line 163**

Find:
```tsx
<h2 className="text-lg font-semibold leading-tight truncate">
  {audiencia?.tipoDescricao || 'Audiencia'}
</h2>
```

Replace with:
```tsx
<Heading level="section" className="truncate">
  {audiencia?.tipoDescricao || 'Audiencia'}
</Heading>
```

- [ ] **Step 4: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencia-detail-dialog.tsx
git commit -m "refactor(audiencias): use Heading + IconContainer in detail dialog

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 3.2: Fix `audiencias-glass-list.tsx` — manual icon → IconContainer

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx`

- [ ] **Step 1: Add IconContainer import**

```typescript
import { IconContainer } from '@/components/ui/icon-container';
```

- [ ] **Step 2: Replace manual icon container at ~line 189**

Find:
```tsx
<div className="w-9 h-9 rounded-[0.625rem] bg-primary/[0.08] flex items-center justify-center shrink-0">
```

Replace with:
```tsx
<IconContainer size="md" className="bg-primary/[0.08] shrink-0">
```

And replace its closing `</div>` with `</IconContainer>`.

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-list.tsx
git commit -m "refactor(audiencias): use IconContainer in glass-list

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 3.3: Fix `audiencias-year-heatmap.tsx` — manual icon → IconContainer

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-year-heatmap.tsx`

- [ ] **Step 1: Add IconContainer import**

```typescript
import { IconContainer } from '@/components/ui/icon-container';
```

- [ ] **Step 2: Replace manual icon containers in stat cards at ~line 200**

Find pattern (repeated for each stat card):
```tsx
<div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconBg)}>
  <Icon className={cn('w-3.5 h-3.5', iconColor)} />
</div>
```

Replace with:
```tsx
<IconContainer size="md" className={iconBg}>
  <Icon className={cn('w-3.5 h-3.5', iconColor)} />
</IconContainer>
```

Note: `size="md"` = `size-8 rounded-lg` (32px). The original `w-7 h-7` (28px) is close but non-standard. Using `md` (32px) aligns with the design system scale. If the exact 28px is critical visually, this is an acceptable adjustment.

- [ ] **Step 3: Add `font-display` to KPI stat numbers at ~lines 321-346**

Find pattern:
```tsx
<span className="text-3xl font-bold ...">
```

Replace with:
```tsx
<span className="text-3xl font-display font-bold ...">
```

Apply to all stat number `<span>` elements in the sidebar section.

- [ ] **Step 4: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-year-heatmap.tsx
git commit -m "refactor(audiencias): use IconContainer + font-display in year-heatmap

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 3.4: Fix `audiencias-client.tsx` — raw `<button>` → `<Button>` component

**Files:**
- Modify: `src/app/(authenticated)/audiencias/audiencias-client.tsx`

- [ ] **Step 1: Add Button import**

```typescript
import { Button } from '@/components/ui/button';
```

- [ ] **Step 2: Replace raw button at ~lines 217-222**

Find the inline `<button>` with hardcoded Tailwind for "Nova Audiência":
```tsx
<button className="bg-primary text-primary-foreground rounded-xl text-xs font-medium ...">
  Nova Audiência
</button>
```

Replace with:
```tsx
<Button size="sm" className="rounded-xl">
  <Plus className="size-3.5" />
  Nova Audiência
</Button>
```

Make sure `Plus` is imported from `lucide-react` (or whatever icon is used — check the existing file).

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/audiencias-client.tsx
git commit -m "refactor(audiencias): replace raw button with Button component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Dimensão 4: Typography & Token Compliance

**Impacto:** Elimina rgba hardcoded, padroniza cores de status, unifica micro-text scale.

### Task 4.1: Fix `audiencias-glass-list.tsx` — rgba() → design tokens

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx`

- [ ] **Step 1: Replace rgba shadow values in status dot function (~lines 59-63)**

Find:
```typescript
return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]';
return 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]';
return 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]';
```

Replace with:
```typescript
return 'bg-success shadow-[0_0_6px_var(--success)]';
return 'bg-info shadow-[0_0_6px_var(--info)]';
return 'bg-destructive shadow-[0_0_6px_var(--destructive)]';
```

Note: Tailwind shadow with `var()` works in JIT mode. The glow effect uses the same hue as the dot.

- [ ] **Step 2: Replace SVG rgba stroke at ~line 128**

Find:
```tsx
stroke="rgba(255,255,255,0.06)"
```

Replace with:
```tsx
stroke="currentColor" className="text-border/15"
```

If the SVG element doesn't support `className`, use inline style:
```tsx
stroke="var(--border)" strokeOpacity="0.15"
```

- [ ] **Step 3: Replace hover shadow rgba at ~line 177**

Find:
```tsx
'hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
```

Replace with:
```tsx
'hover:shadow-lg'
```

- [ ] **Step 4: Standardize status color classes (~lines 83-85, 199, 205, 211)**

Replace all `emerald-400` → `success`, `blue-400` → `info`, `red-400` → `destructive` in status-related classes throughout the file.

Find patterns like:
```tsx
'text-emerald-400' → 'text-success'
'bg-emerald-400/15' → 'bg-success/15'
'text-blue-400' → 'text-info'
'bg-blue-400/15' → 'bg-info/15'
'text-red-400' → 'text-destructive'
'bg-red-400/15' → 'bg-destructive/15'
```

- [ ] **Step 5: Standardize micro-text sizes**

Replace inconsistent rem-based sizes with px equivalents:
```
text-[0.6rem] → text-[10px]
text-[0.625rem] → text-[10px]
text-[0.65rem] → text-[10px]
text-[0.7rem] → text-[11px]
```

- [ ] **Step 6: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-list.tsx
git commit -m "refactor(audiencias): replace rgba + hardcoded colors with design tokens in glass-list

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 4.2: Fix `audiencias-glass-month.tsx` — status colors + popover shadow + micro-text

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-month.tsx`

- [ ] **Step 1: Replace status color classes (~lines 55-57, 65-69, 284-286, 387, 392, 397)**

Apply the same mapping:
```
emerald-500/15 → success/15
emerald-400 → success
blue-400/15 → info/15
blue-300 → info
red-400/15 → destructive/15
red-300 → destructive
```

Match border variants similarly:
```
border-emerald-500/25 → border-success/25
border-blue-400/25 → border-info/25
border-red-400/25 → border-destructive/25
```

- [ ] **Step 2: Replace popover shadow rgba at ~line 330**

Find:
```tsx
shadow-[0_24px_48px_rgba(0,0,0,0.5)]
```

Replace with:
```tsx
shadow-2xl
```

- [ ] **Step 3: Standardize micro-text sizes**

Replace:
```
text-[0.625rem] → text-[10px]
text-[0.65rem] → text-[10px]
```

- [ ] **Step 4: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-month.tsx
git commit -m "refactor(audiencias): replace hardcoded colors with semantic tokens in glass-month

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 4.3: Fix `audiencias-year-heatmap.tsx` — status colors + micro-spacing

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-year-heatmap.tsx`

- [ ] **Step 1: Replace status palette colors in stat sidebar (~lines 325-350)**

Apply same semantic token mapping for status colors.

- [ ] **Step 2: Replace non-standard spacing in MonthGrid (~lines 163-167)**

Find:
```tsx
mb-[5px]
```
Replace with:
```tsx
mb-1
```

Find:
```tsx
mb-[3px]
```
Replace with:
```tsx
mb-0.5
```

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-year-heatmap.tsx
git commit -m "refactor(audiencias): semantic tokens + standard spacing in year-heatmap

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Dimensão 5: Layout, Spacing & Responsividade

**Impacto:** Corrige grid overflow em tablets, header duplicado, navegação SPA, double-padding, radius mismatch.

### Task 5.1: Fix `audiencias-glass-list.tsx` — grid responsive + radius mismatch

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx`

- [ ] **Step 1: Add responsive fallback to the grid template (~line 181 and ~line 360)**

The current fixed grid: `grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px]`

Strategy: Hide non-essential columns on smaller screens and show a simplified layout.

Find the column headers grid (~line 360):
```tsx
<div className="grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
```

Replace with:
```tsx
<div className="hidden lg:grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
```

Find the GlassRow grid (~line 181):
```tsx
<div className="grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
```

Replace with two layouts — one for desktop, one for mobile/tablet:
```tsx
{/* Desktop grid */}
<div className="hidden lg:grid grid-cols-[auto_1fr_140px_100px_80px_80px_90px_32px] gap-4 items-center">
  {/* ... existing desktop columns content ... */}
</div>
{/* Mobile/Tablet stack */}
<div className="flex lg:hidden items-center gap-3">
  {/* Status dot */}
  {/* Icon + Title + Processo */}
  {/* Date (compact) */}
  {/* Chevron */}
</div>
```

Note: The agent implementing this should read the full GlassRow component to extract which data goes in the mobile layout. At minimum show: status dot, title, processo number, date, and the click action.

- [ ] **Step 2: Fix radius mismatch — `rounded-[0.875rem]` → `rounded-2xl`**

Find all instances of:
```tsx
rounded-[0.875rem]
```

Replace with:
```tsx
rounded-2xl
```

This aligns with the skeleton loaders and `GlassPanel` default radius.

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-list.tsx
git commit -m "fix(audiencias): add responsive layout + fix radius mismatch in glass-list

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 5.2: Fix double header in Quadro view

**Files:**
- Modify: `src/app/(authenticated)/audiencias/audiencias-client.tsx`

- [ ] **Step 1: Conditionally hide client-level header when in Quadro/Missao view**

The problem: `audiencias-client.tsx` renders its header unconditionally (~lines 209-228), and `AudienciasMissionView` renders its own header internally (~line 248).

The cleanest fix is to NOT render the client-level header when `activeView === 'quadro'` since the mission view has its own header.

Find the header block in `audiencias-client.tsx` (starts around line 209). It should be wrapped:

```tsx
{activeView !== 'quadro' && (
  <div className="flex items-end justify-between gap-4">
    <div>
      <Heading level="page">Audiências</Heading>
      {/* ... subtitle ... */}
    </div>
    {/* ... Nova Audiência button ... */}
  </div>
)}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/audiencias-client.tsx
git commit -m "fix(audiencias): prevent double header in Quadro view

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 5.3: Fix `window.location.href` → `router.push()` in missao-content

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx`

- [ ] **Step 1: Add useRouter import**

```typescript
import { useRouter } from 'next/navigation';
```

- [ ] **Step 2: Add router at component top**

Inside `AudienciasMissaoContent` function, add:
```typescript
const router = useRouter();
```

- [ ] **Step 3: Replace window.location.href**

Find (~line 151):
```tsx
onOpenProcess={(id) => { window.location.href = `/app/processos/${id}`; }}
```

Replace with:
```tsx
onOpenProcess={(id) => { router.push(`/app/processos/${id}`); }}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/views/audiencias-missao-content.tsx
git commit -m "fix(audiencias): use router.push instead of window.location.href

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 5.4: Fix double-padding in `audiencias-glass-month.tsx`

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-month.tsx`

- [ ] **Step 1: Remove outer wrapper padding (~line 244)**

Find:
```tsx
<div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
  <GlassPanel depth={1} className="p-5 md:p-6 flex-1">
```

Replace with (match year-heatmap pattern):
```tsx
<div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
  <GlassPanel depth={1} className="p-6 flex-1 min-w-0">
```

This makes both month and year views use identical outer/inner padding patterns.

- [ ] **Step 2: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-month.tsx
git commit -m "fix(audiencias): normalize padding in glass-month to match year-heatmap

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 5.5: Fix border opacity inconsistency

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx`
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-month.tsx`
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-year-heatmap.tsx`

- [ ] **Step 1: Standardize glass surface borders**

Define a consistent scale:
- Glass card outer border: `border-white/[0.08]` (current most common)
- Glass surface inner border: `border-white/[0.06]`
- Interactive hover border: `border-white/[0.12]`

In each file, normalize:
- `border-white/[0.06]` on card surfaces → keep as-is (inner)
- `border-white/[0.07]` → `border-white/[0.08]` (align to outer scale)
- `border-white/[0.10]` → `border-white/[0.12]` (interactive)

- [ ] **Step 2: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/audiencias-glass-list.tsx \
        src/app/\(authenticated\)/audiencias/components/audiencias-glass-month.tsx \
        src/app/\(authenticated\)/audiencias/components/audiencias-year-heatmap.tsx
git commit -m "refactor(audiencias): normalize glass border opacity scale

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Dimensão 6: Props Dropped & Barrel Architecture

**Impacto:** Reconecta funcionalidade de detalhe/busca nas views; exporta GlassPanel no barrel compartilhado.

### Task 6.1: Fix dropped `search` prop in Lista view

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/views/audiencias-lista-view.tsx`
- Modify: `src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx` (if needed)

- [ ] **Step 1: Check if AudienciasGlassList accepts a search prop**

Read `audiencias-glass-list.tsx` and check the props interface. If it doesn't have `search` or `filterText`, it needs to be added.

- [ ] **Step 2: Forward search prop**

In `audiencias-lista-view.tsx`, the `search` prop is declared but not forwarded:

Find:
```tsx
export function AudienciasListaView({
  audiencias,
  onViewDetail,
}: AudienciasListaViewProps) {
```

Replace with:
```tsx
export function AudienciasListaView({
  audiencias,
  onViewDetail,
  search,
}: AudienciasListaViewProps) {
```

Then pass it to the child:
```tsx
<AudienciasGlassList
  audiencias={audiencias}
  isLoading={false}
  onView={onViewDetail}
  search={search}
/>
```

If `AudienciasGlassList` doesn't accept `search`, add filtering inside the view:
```tsx
const filtered = search
  ? audiencias.filter((a) =>
      [a.tipoDescricao, a.numeroProcesso, a.poloAtivoNome, a.poloPassivoNome]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(search.toLowerCase()))
    )
  : audiencias;

return (
  <AudienciasGlassList
    audiencias={filtered}
    isLoading={false}
    onView={onViewDetail}
  />
);
```

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/views/audiencias-lista-view.tsx
git commit -m "fix(audiencias): forward search prop in lista view

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 6.2: Fix dropped `onViewDetail` prop in Mes and Ano views

**Files:**
- Modify: `src/app/(authenticated)/audiencias/components/views/audiencias-mes-view.tsx`
- Modify: `src/app/(authenticated)/audiencias/components/views/audiencias-ano-view.tsx`

- [ ] **Step 1: Check if child components accept onViewDetail**

Read `audiencias-glass-month.tsx` and `audiencias-year-heatmap.tsx` to check if they accept an `onViewDetail` or `onView` prop. If they don't, the views can only remove the prop from their interface (it's not actionable without the child support).

- [ ] **Step 2a: If child supports onViewDetail — forward it**

In `audiencias-mes-view.tsx`:
```tsx
export function AudienciasMesView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  refetch,
}: AudienciasMesViewProps) {
  return (
    <AudienciasGlassMonth
      audiencias={audiencias}
      currentMonth={currentDate}
      onMonthChange={onDateChange}
      onViewDetail={onViewDetail}
      refetch={refetch}
    />
  );
}
```

Same pattern for `audiencias-ano-view.tsx`.

- [ ] **Step 2b: If child does NOT support onViewDetail — remove from interface**

Remove `onViewDetail` from the Props interface entirely since it cannot be forwarded.

In `audiencias-mes-view.tsx`:
```typescript
export interface AudienciasMesViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  // onViewDetail REMOVED — AudienciasGlassMonth handles details internally
  refetch: () => Promise<void>;
}
```

Same for `audiencias-ano-view.tsx`.

Also update `views/index.ts` and any parent that passes this prop to remove it from the call site.

- [ ] **Step 3: Verify and commit**

```bash
npm run type-check
git add src/app/\(authenticated\)/audiencias/components/views/
git commit -m "fix(audiencias): resolve dropped onViewDetail props in Mes and Ano views

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 6.3: Export GlassPanel from shared barrel

**Files:**
- Modify: `src/components/shared/index.ts`

- [ ] **Step 1: Add GlassPanel and WidgetContainer to shared barrel**

Add to `src/components/shared/index.ts`:

```typescript
// Glass Panels
export { GlassPanel, WidgetContainer } from './glass-panel';
export type { GlassPanelProps, WidgetContainerProps } from './glass-panel';
```

- [ ] **Step 2: Verify no circular deps and commit**

```bash
npm run type-check
git add src/components/shared/index.ts
git commit -m "feat(shared): export GlassPanel and WidgetContainer from shared barrel

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Execution Order

```
Dimensão 1 (Dead Code)      ──── FIRST (removes files others reference)
      │
      ├── Dimensão 2 (Dialogs) ─────┐
      ├── Dimensão 3 (Glass)  ──────┤── ALL IN PARALLEL
      ├── Dimensão 4 (Tokens) ──────┤
      ├── Dimensão 5 (Layout) ──────┤
      └── Dimensão 6 (Props)  ──────┘
```

**Total:** 6 dimensões, 15 tasks, ~45 steps, ~15 commits.
