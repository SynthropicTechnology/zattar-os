# Typed Typography Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CSS class strings with typed React components (`<Heading>`, `<Text>`) that enforce the design system typography scale at compile time.

**Architecture:** Create two new components in the existing `typography.tsx` — `Heading` (5 semantic levels) and `Text` (8 semantic variants). These wrap the CSS utility classes already defined in `globals.css` (`.text-page-title`, `.text-widget-title`, etc.). Then migrate PageShell + the 37 files that use `text-page-title` to use `<Heading level="page">` instead. The existing `Typography.H1`–`H4` components remain untouched (backwards compatible).

**Tech Stack:** React 19, TypeScript 5 strict, Tailwind CSS 4, existing `globals.css` utility classes

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/ui/typography.tsx` | Modify | Add `Heading` and `Text` components alongside existing `Typography.*` |
| `src/components/shared/page-shell.tsx` | Modify | Use `<Heading level="page">` internally |
| `src/app/(authenticated)/*` (37 files) | Modify | Replace `className="text-page-title"` with `<Heading level="page">` |
| `src/app/(authenticated)/dashboard/components/widgets/*` | Modify | Replace `text-widget-title` with `<Heading level="widget">` |
| `src/lib/design-system/tokens.ts` | Modify | Remove `TEXT_PATTERNS` (replaced by typed components) |

---

### Task 1: Create `Heading` and `Text` typed components

**Files:**
- Modify: `src/components/ui/typography.tsx`

- [ ] **Step 1: Add Heading component to typography.tsx**

Add after the existing `createTypographyComponent` exports (line 117), before the final export:

```tsx
// =============================================================================
// DESIGN SYSTEM: Typed Typography Components
// =============================================================================

/**
 * Heading levels mapped to CSS utility classes from globals.css.
 * Each level enforces a specific visual treatment from the design system.
 */
const HEADING_LEVELS = {
  /** 24px, font-heading bold — PageShell title, main page heading */
  page: { className: 'text-page-title', tag: 'h1' as const },
  /** 20px, font-heading semibold — Main section within a page */
  section: { className: 'text-section-title', tag: 'h2' as const },
  /** 18px, font-heading semibold — Card or detail panel title */
  card: { className: 'text-card-title', tag: 'h3' as const },
  /** 16px, font-heading semibold — Subsection, accordion, field group */
  subsection: { className: 'text-subsection-title', tag: 'h4' as const },
  /** 14px, font-heading semibold — Widget/compact card header */
  widget: { className: 'text-widget-title', tag: 'h3' as const },
} as const;

type HeadingLevel = keyof typeof HEADING_LEVELS;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level that determines size, weight, and HTML tag */
  level: HeadingLevel;
  /** Override the HTML tag (e.g., render h2 visually as page-level) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

/**
 * Heading — Typed heading component that enforces design system typography.
 *
 * @ai-context ALWAYS use this component for headings. NEVER compose
 * font-heading + text-2xl manually. The `level` prop determines the
 * visual treatment AND the default HTML tag.
 *
 * @example
 * <Heading level="page">Processos</Heading>
 * <Heading level="section">Audiencias Pendentes</Heading>
 * <Heading level="widget">Briefing do Dia</Heading>
 * <Heading level="card" as="h2">Detalhes do Contrato</Heading>
 */
function Heading({ level, as: asTag, className: userClassName, children, ...props }: HeadingProps) {
  const config = HEADING_LEVELS[level];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
      {children}
    </Tag>
  );
}
Heading.displayName = 'Heading';
```

- [ ] **Step 2: Add Text component to typography.tsx**

Add immediately after the `Heading` component:

```tsx
/**
 * Text variants mapped to CSS utility classes from globals.css.
 * Each variant enforces a specific visual treatment.
 */
const TEXT_VARIANTS = {
  /** 24px, font-heading bold tabular-nums — KPI/metric large numbers */
  'kpi-value': { className: 'text-kpi-value', tag: 'span' as const },
  /** 14px, font-medium — Form field labels */
  label: { className: 'text-label', tag: 'span' as const },
  /** 13px, text-muted-foreground — Helper text, descriptions */
  caption: { className: 'text-caption', tag: 'p' as const },
  /** 12px, text-muted-foreground/60 — Widget subtitle */
  'widget-sub': { className: 'text-widget-sub', tag: 'p' as const },
  /** 11px, uppercase semibold tracking-wide — RESPONSAVEL, TRIBUNAL */
  'meta-label': { className: 'text-meta-label', tag: 'span' as const },
  /** 10px, font-mono tabular-nums — Process numbers, dates */
  'mono-num': { className: 'text-mono-num', tag: 'span' as const },
  /** 10px, text-muted-foreground/50 — Tertiary timestamps */
  'micro-caption': { className: 'text-micro-caption', tag: 'span' as const },
  /** 9px, font-medium — Badge text */
  'micro-badge': { className: 'text-micro-badge', tag: 'span' as const },
  /** 11px, uppercase semibold — Generic ALL-CAPS label */
  overline: { className: 'text-overline', tag: 'span' as const },
} as const;

type TextVariant = keyof typeof TEXT_VARIANTS;

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Semantic variant that determines size, weight, and default tag */
  variant: TextVariant;
  /** Override the HTML tag */
  as?: React.ElementType;
  children: React.ReactNode;
}

/**
 * Text — Typed text component for design system micro-typography.
 *
 * @ai-context Use for specialized text treatments (KPI values, meta labels,
 * mono numbers, captions). For body text, use standard Tailwind classes
 * (text-sm, text-base). For headings, use <Heading>.
 *
 * @example
 * <Text variant="kpi-value">R$ 45.230</Text>
 * <Text variant="meta-label">TRIBUNAL</Text>
 * <Text variant="mono-num">0001234-56.2023.5.01.0001</Text>
 * <Text variant="widget-sub">Visao geral — administrador</Text>
 */
function Text({ variant, as: asTag, className: userClassName, children, ...props }: TextProps) {
  const config = TEXT_VARIANTS[variant];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
      {children}
    </Tag>
  );
}
Text.displayName = 'Text';
```

- [ ] **Step 3: Export the new components**

Update the exports at the bottom of the file:

```tsx
// Design System typed typography
export { Heading, Text };
export type { HeadingLevel, TextVariant, HeadingProps, TextProps };
export { HEADING_LEVELS, TEXT_VARIANTS };
```

- [ ] **Step 4: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep "typography" | head -5`
Expected: No errors related to typography.tsx

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/typography.tsx
git commit -m "feat(design-system): add typed Heading and Text components

Heading: 5 levels (page, section, card, subsection, widget)
Text: 9 variants (kpi-value, meta-label, mono-num, caption, etc.)

Both enforce design system typography via CSS utility classes
from globals.css. Type-safe — invalid levels/variants are
compile-time errors."
```

---

### Task 2: Migrate PageShell to use `<Heading>`

**Files:**
- Modify: `src/components/shared/page-shell.tsx`

- [ ] **Step 1: Update PageShell imports and title rendering**

```tsx
// Add import at top:
import { Heading } from '@/components/ui/typography';

// Replace the title h1 (line 61-64):
// BEFORE:
//   {title && (
//     <h1 className="text-page-title">
//       {title}
//     </h1>
//   )}

// AFTER:
{title && (
  <Heading level="page">{title}</Heading>
)}
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Same 3 pre-existing errors, no new ones

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/page-shell.tsx
git commit -m "refactor(page-shell): use typed Heading component for page title"
```

---

### Task 3: Migrate 37 page client files from `text-page-title` to `<Heading level="page">`

**Files:**
- Modify: All 37 files listed below

These files currently use `<h1 className="text-page-title">`. Replace with `<Heading level="page">`.

The full list (grouped by module):

**Dashboard (5):**
- `src/app/(authenticated)/dashboard/components/widget-dashboard.tsx`
- `src/app/(authenticated)/dashboard/components/dashboard-unificada.tsx` (3 instances)
- `src/app/(authenticated)/dashboard/processos/page.tsx`
- `src/app/(authenticated)/dashboard/audiencias/page.tsx`
- `src/app/(authenticated)/dashboard/expedientes/page.tsx`
- `src/app/(authenticated)/dashboard/financeiro/page.tsx`

**Processos (2):**
- `src/app/(authenticated)/processos/processos-client.tsx`
- `src/app/(authenticated)/processos/components/processos-table-wrapper.tsx`

**Partes (1):**
- `src/app/(authenticated)/partes/partes-client.tsx`

**Audiencias (2):**
- `src/app/(authenticated)/audiencias/audiencias-client.tsx`
- `src/app/(authenticated)/audiencias/components/audiencias-mission-view.tsx`

**Contratos (2):**
- `src/app/(authenticated)/contratos/contratos-client.tsx`
- `src/app/(authenticated)/contratos/[id]/components/contrato-detalhes-header.tsx`

**Assinatura Digital (4):**
- `src/app/(authenticated)/assinatura-digital/documentos/lista/client-page.tsx`
- `src/app/(authenticated)/assinatura-digital/documentos/lista/command-center.tsx`
- `src/app/(authenticated)/assinatura-digital/documentos/[uuid]/client-page.tsx`
- `src/app/(authenticated)/assinatura-digital/documentos/revisar/[uuid]/client-page.tsx`

**Financeiro (1):**
- `src/app/(authenticated)/financeiro/conciliacao-bancaria/page-client.tsx`

**Expedientes (1):**
- `src/app/(authenticated)/expedientes/components/expedientes-content.tsx`

**Obrigacoes (1):**
- `src/app/(authenticated)/obrigacoes/obrigacoes-client.tsx`

**Calendar (1):**
- `src/app/(authenticated)/calendar/components/event-calendar-app.tsx`

**Pericias (1):**
- `src/app/(authenticated)/pericias/components/pericias-client.tsx`

**Documentos (1):**
- `src/app/(authenticated)/documentos/components/file-manager.tsx`

**Agenda (1):**
- `src/app/(authenticated)/agenda/components/toolbar.tsx`

**Usuarios (1):**
- `src/app/(authenticated)/usuarios/components/usuarios-page-content.tsx`

**Project Management (1):**
- `src/app/(authenticated)/project-management/projects/project-list-view.tsx`

**RH (4):**
- `src/app/(authenticated)/rh/components/folhas-pagamento/folha-detalhes.tsx`
- `src/app/(authenticated)/rh/components/shared/historico-salarios.tsx`
- `src/app/(authenticated)/rh/folhas-pagamento/relatorios/mensal/page.tsx`
- `src/app/(authenticated)/rh/salarios/relatorios/custo-pessoal/page.tsx`

**Acordos (2):**
- `src/app/(authenticated)/acordos-condenacoes/novo/page-client.tsx`
- `src/app/(authenticated)/acordos-condenacoes/[id]/editar/page.tsx`

**Tarefas (1):**
- `src/app/(authenticated)/tarefas/quadro/[boardSlug]/system-board-client.tsx`

**Configuracoes (1):**
- `src/app/(authenticated)/configuracoes/components/configuracoes-settings-layout.tsx`

**Captura (1):**
- `src/app/(authenticated)/captura/components/comunica-cnj/tabs-content.tsx`

**Ajuda (1):**
- `src/app/(authenticated)/ajuda/[...slug]/page.tsx`

**Obrigacoes edit (1):**
- `src/app/(authenticated)/obrigacoes/[id]/editar/page.tsx`

- [ ] **Step 1: Run migration**

For each file:
1. Add `import { Heading } from '@/components/ui/typography';`
2. Replace `<h1 className="text-page-title">X</h1>` with `<Heading level="page">X</Heading>`
3. If the h1 has additional classes (like `truncate`, `flex`, `sm:text-3xl`), keep them via className: `<Heading level="page" className="truncate">X</Heading>`

Pattern for search-and-replace:
```tsx
// BEFORE:
<h1 className="text-page-title">Title</h1>

// AFTER:
<Heading level="page">Title</Heading>

// BEFORE (with extra classes):
<h1 className="text-page-title truncate lg:text-[2rem]">Title</h1>

// AFTER:
<Heading level="page" className="truncate lg:text-[2rem]">Title</Heading>
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Same 3 pre-existing errors

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: migrate 37 page titles from text-page-title CSS to <Heading level='page'>

Type-safe enforcement — invalid heading levels now produce
compile-time errors instead of silently rendering wrong styles."
```

---

### Task 4: Migrate dashboard widget titles to `<Heading level="widget">`

**Files:**
- Modify: Dashboard widget files that use `text-widget-title` class

Widget files to migrate:
- `src/app/(authenticated)/dashboard/components/widgets/widget-wrapper.tsx` (3 instances)
- `src/app/(authenticated)/dashboard/components/shared/metric-card.tsx` (1 instance)
- `src/app/(authenticated)/dashboard/components/widgets/stat-card.tsx` (1 instance)
- `src/app/(authenticated)/dashboard/components/widgets/widget-fluxo-caixa.tsx` (1 instance)
- `src/app/(authenticated)/dashboard/components/widgets/widget-despesas-categoria.tsx` (1 instance)
- `src/app/(authenticated)/contratos/components/pipeline-funnel.tsx` (1 instance)
- `src/app/(authenticated)/assinatura-digital/feature/components/signature-pipeline.tsx` (1 instance)
- `src/app/(authenticated)/configuracoes/components/settings-section-header.tsx` (1 instance)

- [ ] **Step 1: Migrate widget title classes to Heading component**

For each file:
1. Add `import { Heading } from '@/components/ui/typography';`
2. Replace `<h2 className="text-widget-title ...">X</h2>` (or h3, p, span) with `<Heading level="widget" className="...">X</Heading>`
3. Keep any additional classes (flex, items-center, gap-2, etc.)

```tsx
// BEFORE:
<h3 className="text-widget-title flex items-center gap-2">
  <Icon /> Briefing
</h3>

// AFTER:
<Heading level="widget" className="flex items-center gap-2">
  <Icon /> Briefing
</Heading>
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Same 3 pre-existing errors

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: migrate widget titles to <Heading level='widget'>"
```

---

### Task 5: Migrate KPI values and meta-labels to `<Text>`

**Files:**
- Modify: Dashboard and process files using `text-kpi-value` and `text-meta-label`

KPI value files:
- `src/app/(authenticated)/dashboard/widgets/pessoal/score-pessoal.tsx` (1 instance)

Meta-label files:
- `src/app/(authenticated)/processos/components/processo-details-tabs.tsx` (1 instance)
- `src/app/(authenticated)/processos/components/processo-header.tsx` (1 instance)

- [ ] **Step 1: Migrate text-kpi-value to Text component**

```tsx
// BEFORE:
<span className="text-kpi-value">{value}</span>

// AFTER:
import { Text } from '@/components/ui/typography';
<Text variant="kpi-value">{value}</Text>
```

- [ ] **Step 2: Migrate text-meta-label to Text component**

```tsx
// BEFORE:
<span className="text-meta-label">RESPONSAVEL</span>

// AFTER:
import { Text } from '@/components/ui/typography';
<Text variant="meta-label">RESPONSAVEL</Text>
```

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Same 3 pre-existing errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate KPI values and meta-labels to <Text> component"
```

---

### Task 6: Clean up deprecated TEXT_PATTERNS from tokens.ts

**Files:**
- Modify: `src/lib/design-system/tokens.ts`
- Modify: `src/lib/design-system/index.ts`

- [ ] **Step 1: Add deprecation notice to TEXT_PATTERNS**

In `tokens.ts`, update the TEXT_PATTERNS docstring:

```tsx
/**
 * @deprecated Use typed components instead:
 *   <Heading level="page"> instead of TEXT_PATTERNS.pageTitle
 *   <Heading level="widget"> instead of TEXT_PATTERNS.widgetTitle
 *   <Text variant="kpi-value"> instead of TEXT_PATTERNS.kpiValue
 *   <Text variant="meta-label"> instead of TEXT_PATTERNS.metaLabel
 *   <Text variant="mono-num"> instead of TEXT_PATTERNS.monoNum
 *
 * Kept for backwards compatibility. Will be removed in a future version.
 */
export const TEXT_PATTERNS = { ... }
```

- [ ] **Step 2: Update MASTER.md typography section**

Add a note to `design-system/MASTER.md` section 3.2 about the new components:

```markdown
### 3.2 Componentes Tipados (Enforcement)

Usar os componentes tipados `<Heading>` e `<Text>` de `@/components/ui/typography`:

| Componente | Uso | CSS Class |
|-----------|-----|-----------|
| `<Heading level="page">` | Titulo de pagina | `.text-page-title` |
| `<Heading level="section">` | Secao principal | `.text-section-title` |
| `<Heading level="card">` | Card grande, painel | `.text-card-title` |
| `<Heading level="subsection">` | Subsecao, accordion | `.text-subsection-title` |
| `<Heading level="widget">` | Widget header | `.text-widget-title` |
| `<Text variant="kpi-value">` | Metricas de destaque | `.text-kpi-value` |
| `<Text variant="meta-label">` | Labels uppercase | `.text-meta-label` |
| `<Text variant="mono-num">` | Numeros de processo | `.text-mono-num` |
| `<Text variant="widget-sub">` | Subtitulo de widget | `.text-widget-sub` |
| `<Text variant="caption">` | Texto auxiliar | `.text-caption` |
| `<Text variant="micro-badge">` | Texto de badge | `.text-micro-badge` |
| `<Text variant="overline">` | Label ALL-CAPS | `.text-overline` |

> **Regra**: NUNCA compor `font-heading text-2xl font-bold` manualmente.
> Usar `<Heading level="page">` que resolve para a CSS class correta.
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/design-system/tokens.ts src/lib/design-system/index.ts design-system/MASTER.md
git commit -m "docs: deprecate TEXT_PATTERNS in favor of typed Heading/Text components"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | 1 | Create `Heading` + `Text` components in typography.tsx |
| 2 | 1 | PageShell uses `<Heading level="page">` |
| 3 | 37 | All page titles migrate to `<Heading level="page">` |
| 4 | 8 | Widget titles migrate to `<Heading level="widget">` |
| 5 | 3 | KPI values + meta-labels migrate to `<Text>` |
| 6 | 3 | Deprecate TEXT_PATTERNS, update MASTER.md |
| **Total** | **53** | |
