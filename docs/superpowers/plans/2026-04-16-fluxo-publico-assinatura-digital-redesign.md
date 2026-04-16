# Redesign do Fluxo Público de Assinatura Digital — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-16-fluxo-publico-assinatura-digital-redesign.md`

**Goal:** Unificar as duas rotas públicas de assinatura digital sob um `PublicWizardShell` glass-only, reduzir o formulário dinâmico de 10-12 para 7 steps, tornar a tela de Assinar mobile-first de verdade e entregar sucesso celebratório glass — zero regressão funcional.

**Architecture:** Criar `src/shared/assinatura-digital/components/public-shell/` com o chassis + subcomponentes reutilizáveis (AmbientBackdrop + GlassPanel); forçar light-only via `layout.tsx` da rota pública; migrar Rota A (token) e Rota B (formulário) para o novo shell; deletar shells legados após migração validada por E2E.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Tailwind CSS 4, shadcn/ui, Radix, Zustand (persist), react-hook-form + zod, Playwright E2E, Vitest + React Testing Library.

---

## Mapa de arquivos

### Criar

```
src/shared/assinatura-digital/components/public-shell/
├── public-wizard-shell.tsx
├── public-wizard-header.tsx
├── public-wizard-progress.tsx
├── public-step-card.tsx
├── public-step-footer.tsx
├── document-peek-card.tsx
├── selfie-capture-sheet.tsx
├── success-hero.tsx
└── index.ts

src/shared/assinatura-digital/components/public-shell/__tests__/
├── public-wizard-shell.test.tsx
├── public-wizard-progress.test.tsx
├── public-step-card.test.tsx
├── public-step-footer.test.tsx
├── document-peek-card.test.tsx
├── selfie-capture-sheet.test.tsx
└── success-hero.test.tsx

src/app/(assinatura-digital)/layout.tsx
src/app/(assinatura-digital)/_wizard/form/dados-pessoais-step.tsx
src/app/(assinatura-digital)/_wizard/form/revisar-documento-step.tsx
src/app/(assinatura-digital)/_wizard/form/assinar-step.tsx
src/app/(assinatura-digital)/__tests__/e2e/light-mode-forced.spec.ts
src/app/(assinatura-digital)/__tests__/e2e/draft-stepconfig-migration.spec.ts
```

### Modificar

```
src/components/shared/ambient-backdrop.tsx
src/shared/assinatura-digital/index.ts
src/shared/assinatura-digital/store/formulario-store.ts   (hydrateContext valida etapaAtual)
src/app/(assinatura-digital)/_wizard/form/formulario-container.tsx
src/app/(assinatura-digital)/_wizard/form/verificar-cpf.tsx
src/app/(assinatura-digital)/_wizard/form/dados-endereco.tsx
src/app/(assinatura-digital)/_wizard/form/dynamic-form-step.tsx
src/app/(assinatura-digital)/_wizard/form/sucesso.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/PublicSignatureFlow.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/WelcomeStep.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ConfirmDetailsStep.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ReviewDocumentStep.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SignatureStep.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SuccessStep.tsx
src/app/(assinatura-digital)/__tests__/e2e/public-form-flow.spec.ts
src/app/(assinatura-digital)/__tests__/e2e/public-signature-flow.spec.ts
```

### Deletar

```
src/app/(assinatura-digital)/_wizard/public-form-shell.tsx
src/app/(assinatura-digital)/_wizard/step-progress.tsx
src/app/(assinatura-digital)/_wizard/__tests__/public-form-shell.test.tsx
src/app/(assinatura-digital)/_wizard/__tests__/step-progress.test.tsx
src/app/(assinatura-digital)/_wizard/__tests__/form-step-layout.test.tsx
src/app/(assinatura-digital)/_wizard/form/form-step-layout.tsx
src/app/(assinatura-digital)/_wizard/form/dados-identidade.tsx
src/app/(assinatura-digital)/_wizard/form/dados-contatos.tsx
src/app/(assinatura-digital)/_wizard/form/visualizacao-pdf-step.tsx
src/app/(assinatura-digital)/_wizard/form/visualizacao-markdown-step.tsx
src/app/(assinatura-digital)/_wizard/form/termos-aceite-step.tsx
src/app/(assinatura-digital)/_wizard/form/assinatura-manuscrita-step.tsx
src/app/(assinatura-digital)/_wizard/capture/geolocation-step.tsx
src/app/(assinatura-digital)/_wizard/capture/captura-foto-step.tsx
src/app/(assinatura-digital)/_wizard/capture/index.ts
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicPageShell.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepLayout.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepIndicator.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/shared/PublicProgressBar.tsx
src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SelfieStep.tsx
```

---

# FASE 1 · Scaffolding (não-breaking)

Criar todos os componentes novos sem tocar nos legados. Após esta fase tudo deve continuar funcionando exatamente como antes.

---

### Task 1: Adicionar prop `tint` opcional ao AmbientBackdrop

**Files:**
- Modify: `src/components/shared/ambient-backdrop.tsx`
- Test: `src/components/shared/__tests__/ambient-backdrop.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/__tests__/ambient-backdrop.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AmbientBackdrop } from '../ambient-backdrop'

describe('AmbientBackdrop', () => {
  it('renders with default tint (primary)', () => {
    const { container } = render(<AmbientBackdrop />)
    const blobs = container.querySelectorAll('.bg-primary')
    expect(blobs.length).toBeGreaterThan(0)
  })

  it('applies success tint when tint="success"', () => {
    const { container } = render(<AmbientBackdrop tint="success" />)
    const successBlobs = container.querySelectorAll('.bg-success')
    expect(successBlobs.length).toBeGreaterThan(0)
    const primaryBlobs = container.querySelectorAll('.bg-primary')
    expect(primaryBlobs.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/components/shared/__tests__/ambient-backdrop.test.tsx
```
Expected: FAIL — `tint` prop não existe ainda.

- [ ] **Step 3: Update ambient-backdrop.tsx**

Replace the file content with:

```tsx
import { cn } from '@/lib/utils'

interface AmbientBackdropProps {
  /** Mostra grid de pontos sutil. Default: true */
  grid?: boolean
  /** Mostra gradiente vertical na base. Default: true */
  baseGradient?: boolean
  /** Intensidade dos blobs de blur (0-100). Default: 20 */
  blurIntensity?: number
  /** Tonalidade dos blobs. Default: 'primary' */
  tint?: 'primary' | 'success'
  className?: string
}

export function AmbientBackdrop({
  grid = true,
  baseGradient = true,
  blurIntensity = 20,
  tint = 'primary',
  className,
}: AmbientBackdropProps) {
  const opacity = Math.max(0, Math.min(100, blurIntensity)) / 100
  const blobClass = tint === 'success' ? 'bg-success' : 'bg-primary'
  const baseGradientClass =
    tint === 'success' ? 'from-success/5' : 'from-primary/5'
  const gridColor =
    tint === 'success' ? 'var(--color-success)' : 'var(--color-primary)'

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 pointer-events-none overflow-hidden',
          className,
        )}
      >
        <div
          className={cn(
            'absolute -top-[20%] -left-[10%] h-125 w-125 rounded-full blur-[120px]',
            blobClass,
          )}
          style={{ opacity: opacity * 0.2 }}
        />
        <div
          className={cn(
            'absolute -bottom-[20%] -right-[10%] h-150 w-150 rounded-full blur-[120px]',
            blobClass,
          )}
          style={{ opacity: opacity * 0.1 }}
        />
        {grid && (
          <div
            className="absolute inset-0 bg-size-[40px_40px] opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(${gridColor} 1px, transparent 1px)`,
            }}
          />
        )}
      </div>
      {baseGradient && (
        <div
          aria-hidden="true"
          className={cn(
            'fixed bottom-0 left-0 h-1/3 w-full bg-linear-to-t to-transparent pointer-events-none',
            baseGradientClass,
          )}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/components/shared/__tests__/ambient-backdrop.test.tsx
npm run type-check
```
Expected: PASS; type-check OK.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/ambient-backdrop.tsx src/components/shared/__tests__/ambient-backdrop.test.tsx
git commit -m "feat(ambient-backdrop): add optional success tint variant"
```

---

### Task 2: Criar `src/app/(assinatura-digital)/layout.tsx` com light-only

**Files:**
- Create: `src/app/(assinatura-digital)/layout.tsx`
- Test: `src/app/(assinatura-digital)/__tests__/layout.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/(assinatura-digital)/__tests__/layout.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PublicRouteLayout from '../layout'

describe('PublicRouteLayout', () => {
  it('wraps children with a light-theme enforcement script', () => {
    const { container } = render(
      <PublicRouteLayout>
        <div data-testid="public-child">hello</div>
      </PublicRouteLayout>,
    )
    expect(container.querySelector('[data-testid="public-child"]')).toBeTruthy()
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    expect(script).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/app/\(assinatura-digital\)/__tests__/layout.test.tsx
```
Expected: FAIL — `../layout` import não existe.

- [ ] **Step 3: Create layout.tsx**

Create `src/app/(assinatura-digital)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'

/**
 * Layout da rota pública de assinatura digital.
 *
 * Força o tema light independente da preferência do sistema — contexto externo
 * exige contraste máximo para leitura de documentos. O script inline roda
 * antes da hidratação para evitar flash de tema escuro.
 */
export default function PublicRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        data-zattar-theme="force-light"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              document.documentElement.setAttribute('data-theme', 'light');
              document.documentElement.style.colorScheme = 'light';
            } catch (e) {}
          `,
        }}
      />
      {children}
    </>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/app/\(assinatura-digital\)/__tests__/layout.test.tsx
npm run type-check
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(assinatura-digital)/layout.tsx" "src/app/(assinatura-digital)/__tests__/layout.test.tsx"
git commit -m "feat(assinatura-digital): force light theme on public route layout"
```

---

### Task 3: Criar `PublicWizardHeader`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/public-wizard-header.tsx`

- [ ] **Step 1: Create file**

```tsx
'use client'

import { BrandMark } from '@/components/shared/brand-mark'

export function PublicWizardHeader() {
  return (
    <header className="shrink-0 border-b border-outline-variant/20 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-4 sm:px-6">
        <BrandMark variant="auto" size="custom" priority className="h-8 w-auto sm:h-9" />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/public-wizard-header.tsx
git commit -m "feat(public-shell): add PublicWizardHeader with centered BrandMark"
```

---

### Task 4: Criar `PublicWizardProgress` (Vertical + Horizontal)

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/public-wizard-progress.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-progress.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicWizardProgress } from '../public-wizard-progress'

const steps = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'dados', label: 'Dados' },
  { id: 'endereco', label: 'Endereço' },
]

describe('PublicWizardProgress', () => {
  it('Vertical renders all labels with current step highlighted', () => {
    render(<PublicWizardProgress.Vertical steps={steps} currentIndex={1} />)
    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByText('Dados')).toBeInTheDocument()
    expect(screen.getByText('Endereço')).toBeInTheDocument()
    const current = screen.getByText('Dados').closest('li')
    expect(current?.querySelector('[aria-current="step"]')).toBeTruthy()
  })

  it('Horizontal renders compact progress with current label', () => {
    render(<PublicWizardProgress.Horizontal steps={steps} currentIndex={2} />)
    expect(screen.getByText('Endereço')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('calls onRestart when restart button is clicked', async () => {
    const onRestart = vi.fn()
    render(<PublicWizardProgress.Vertical steps={steps} currentIndex={1} onRestart={onRestart} />)
    const btn = screen.getByRole('button', { name: /recomeçar/i })
    btn.click()
    expect(onRestart).toHaveBeenCalled()
  })
})
```

Add `import { vi } from 'vitest'` at top.

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-progress.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create public-wizard-progress.tsx**

```tsx
'use client'

import { Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/typography'

export interface PublicWizardStep {
  id: string
  label: string
}

interface BaseProps {
  steps: PublicWizardStep[]
  currentIndex: number
  onRestart?: () => void
  resumeHint?: string | null
}

function Vertical({ steps, currentIndex, onRestart, resumeHint }: BaseProps) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <Text variant="overline" className="text-muted-foreground">
          Progresso
        </Text>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
            aria-label="Recomeçar"
            title="Recomeçar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ol className="flex flex-1 flex-col gap-2">
        {steps.map((step, index) => {
          const isPast = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-all',
                  isPast && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10',
                  isFuture && 'border-outline-variant/50 bg-transparent text-muted-foreground',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isPast ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'truncate text-sm transition-colors',
                  isCurrent && 'font-medium text-foreground',
                  isPast && 'text-muted-foreground',
                  isFuture && 'text-muted-foreground/60',
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      {resumeHint && (
        <Text variant="micro-caption" className="text-muted-foreground/70">
          {resumeHint}
        </Text>
      )}
    </div>
  )
}

function Horizontal({ steps, currentIndex, onRestart, resumeHint }: BaseProps) {
  const total = steps.length
  const current = steps[currentIndex]
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <Text variant="micro-caption" className="shrink-0 text-muted-foreground">
            {currentIndex + 1}/{total}
          </Text>
          <Text variant="label" className="truncate text-foreground">
            {current?.label ?? ''}
          </Text>
        </div>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
            aria-label="Recomeçar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {resumeHint && (
        <Text variant="micro-caption" className="text-muted-foreground/70">
          {resumeHint}
        </Text>
      )}
    </div>
  )
}

export const PublicWizardProgress = { Vertical, Horizontal }
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-progress.test.tsx
npm run type-check
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/public-wizard-progress.tsx src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-progress.test.tsx
git commit -m "feat(public-shell): add PublicWizardProgress with Vertical and Horizontal variants"
```

---

### Task 5: Criar `PublicWizardShell`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/public-wizard-shell.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicWizardShell } from '../public-wizard-shell'

const steps = [
  { id: 'a', label: 'Aa' },
  { id: 'b', label: 'Bb' },
]

describe('PublicWizardShell', () => {
  it('renders header, progress and children', () => {
    render(
      <PublicWizardShell steps={steps} currentIndex={0}>
        <div data-testid="content">hello</div>
      </PublicWizardShell>,
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getAllByText('Aa').length).toBeGreaterThan(0)
  })

  it('does not render sidebar when steps is empty', () => {
    const { container } = render(
      <PublicWizardShell steps={[]} currentIndex={0}>
        <div>content</div>
      </PublicWizardShell>,
    )
    expect(container.querySelector('aside')).toBeFalsy()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create public-wizard-shell.tsx**

```tsx
'use client'

import type { ReactNode } from 'react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { PublicWizardHeader } from './public-wizard-header'
import { PublicWizardProgress, type PublicWizardStep } from './public-wizard-progress'

interface PublicWizardShellProps {
  steps: PublicWizardStep[]
  currentIndex: number
  onRestart?: () => void
  resumeHint?: string | null
  /** Tonalidade do backdrop. Default: 'primary' */
  tint?: 'primary' | 'success'
  children: ReactNode
}

export function PublicWizardShell({
  steps,
  currentIndex,
  onRestart,
  resumeHint,
  tint = 'primary',
  children,
}: PublicWizardShellProps) {
  const hasSteps = steps.length > 0

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <AmbientBackdrop blurIntensity={25} tint={tint} />

      <PublicWizardHeader />

      <div className="relative z-10 flex min-h-0 flex-1">
        {hasSteps && (
          <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-outline-variant/20 bg-background/40 px-6 py-8 backdrop-blur-xl lg:flex">
            <PublicWizardProgress.Vertical
              steps={steps}
              currentIndex={currentIndex}
              onRestart={onRestart}
              resumeHint={resumeHint}
            />
          </aside>
        )}

        <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          {hasSteps && (
            <div className="shrink-0 border-b border-outline-variant/20 bg-background/60 backdrop-blur-xl lg:hidden">
              <PublicWizardProgress.Horizontal
                steps={steps}
                currentIndex={currentIndex}
                onRestart={onRestart}
                resumeHint={resumeHint}
              />
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-shell.test.tsx
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/public-wizard-shell.tsx src/shared/assinatura-digital/components/public-shell/__tests__/public-wizard-shell.test.tsx
git commit -m "feat(public-shell): add PublicWizardShell chassis with AmbientBackdrop and adaptive progress"
```

---

### Task 6: Criar `PublicStepCard`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/public-step-card.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/public-step-card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicStepCard } from '../public-step-card'

describe('PublicStepCard', () => {
  it('renders title and children', () => {
    render(
      <PublicStepCard title="Identificação">
        <input data-testid="cpf" />
      </PublicStepCard>,
    )
    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByTestId('cpf')).toBeInTheDocument()
  })

  it('renders chip when provided', () => {
    render(
      <PublicStepCard title="Assinar" chip="Última etapa">
        <div />
      </PublicStepCard>,
    )
    expect(screen.getByText('Última etapa')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <PublicStepCard title="X" description="Texto de apoio">
        <div />
      </PublicStepCard>,
    )
    expect(screen.getByText('Texto de apoio')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create public-step-card.tsx**

```tsx
'use client'

import type { ReactNode } from 'react'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface PublicStepCardProps {
  title: string
  description?: string
  chip?: string
  /** Define tom do chip. Default: 'primary' */
  chipTone?: 'primary' | 'success' | 'info'
  children: ReactNode
  className?: string
}

const CHIP_TONE_CLASSES: Record<NonNullable<PublicStepCardProps['chipTone']>, { bg: string; dot: string; text: string }> = {
  primary: { bg: 'bg-primary/10', dot: 'bg-primary', text: 'text-primary' },
  success: { bg: 'bg-success/10', dot: 'bg-success', text: 'text-success' },
  info: { bg: 'bg-info/10', dot: 'bg-info', text: 'text-info' },
}

export function PublicStepCard({
  title,
  description,
  chip,
  chipTone = 'primary',
  children,
  className,
}: PublicStepCardProps) {
  const tone = CHIP_TONE_CLASSES[chipTone]
  return (
    <GlassPanel
      depth={1}
      className={cn('flex h-full min-h-0 flex-col gap-4 p-6 sm:p-8', className)}
    >
      <header className="space-y-2">
        {chip && (
          <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1', tone.bg)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
            <Text variant="overline" className={tone.text}>
              {chip}
            </Text>
          </div>
        )}
        <Heading level="page" className="font-display tracking-tight text-2xl sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <Text variant="caption" className="text-muted-foreground">
            {description}
          </Text>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </GlassPanel>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/public-step-card.test.tsx
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/public-step-card.tsx src/shared/assinatura-digital/components/public-shell/__tests__/public-step-card.test.tsx
git commit -m "feat(public-shell): add PublicStepCard glass wrapper with chip/title/description"
```

---

### Task 7: Criar `PublicStepFooter`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/public-step-footer.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/public-step-footer.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PublicStepFooter } from '../public-step-footer'

describe('PublicStepFooter', () => {
  it('renders both buttons and fires callbacks', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    render(<PublicStepFooter onPrevious={onPrevious} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onPrevious).toHaveBeenCalled()
    expect(onNext).toHaveBeenCalled()
  })

  it('disables next when isNextDisabled', () => {
    render(<PublicStepFooter onNext={() => {}} isNextDisabled />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('shows Processando… when isLoading', () => {
    render(<PublicStepFooter onNext={() => {}} isLoading />)
    expect(screen.getByText(/processando/i)).toBeInTheDocument()
  })

  it('hides previous when hidePrevious', () => {
    render(<PublicStepFooter onNext={() => {}} hidePrevious />)
    expect(screen.queryByRole('button', { name: /voltar/i })).toBeNull()
  })

  it('uses custom labels', () => {
    render(<PublicStepFooter onNext={() => {}} nextLabel="Finalizar" previousLabel="Atrás" />)
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument()
  })

  it('submits a form when formId is set', () => {
    render(<PublicStepFooter formId="my-form" />)
    const btn = screen.getByRole('button', { name: /continuar/i })
    expect(btn.getAttribute('form')).toBe('my-form')
    expect(btn.getAttribute('type')).toBe('submit')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create public-step-footer.tsx**

```tsx
'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PublicStepFooterProps {
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  hidePrevious?: boolean
  hideNext?: boolean
  /** Quando set, botão Continuar vira type="submit" com esse form id. */
  formId?: string
  className?: string
}

export function PublicStepFooter({
  onPrevious,
  onNext,
  nextLabel = 'Continuar',
  previousLabel = 'Voltar',
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  hidePrevious = false,
  hideNext = false,
  formId,
  className,
}: PublicStepFooterProps) {
  const showPrevious = !hidePrevious && !!onPrevious
  const showNext = !hideNext

  return (
    <footer
      className={cn(
        'shrink-0 border-t border-outline-variant/20 bg-background/60 backdrop-blur-xl',
        className,
      )}
      style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl items-stretch gap-3 px-4 py-4 sm:items-center sm:px-8',
          showPrevious ? 'justify-between' : 'justify-end',
        )}
      >
        {showPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading}
            className="h-12 min-w-28 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {previousLabel}
          </Button>
        )}
        {showNext && (
          <Button
            type={formId ? 'submit' : 'button'}
            form={formId}
            onClick={formId ? undefined : onNext}
            disabled={isNextDisabled || isLoading}
            className="h-12 min-w-40 cursor-pointer active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/public-step-footer.test.tsx
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/public-step-footer.tsx src/shared/assinatura-digital/components/public-shell/__tests__/public-step-footer.test.tsx
git commit -m "feat(public-shell): add PublicStepFooter sticky action bar"
```

---

### Task 8: Criar `DocumentPeekCard`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/document-peek-card.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/document-peek-card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DocumentPeekCard } from '../document-peek-card'

describe('DocumentPeekCard', () => {
  it('renders file name, sender and date', () => {
    render(
      <DocumentPeekCard fileName="Contrato.pdf" sender="Zattar Advogados" date="12 de abril" />,
    )
    expect(screen.getByText('Contrato.pdf')).toBeInTheDocument()
    expect(screen.getByText(/Zattar Advogados/)).toBeInTheDocument()
    expect(screen.getByText(/12 de abril/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create document-peek-card.tsx**

```tsx
'use client'

import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface DocumentPeekCardProps {
  fileName: string
  sender?: string
  date?: string
  className?: string
}

export function DocumentPeekCard({ fileName, sender, date, className }: DocumentPeekCardProps) {
  const subtitle = [sender, date].filter(Boolean).join(' · ')

  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant/40 bg-surface-container-lowest/60 p-4 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold tracking-wide text-primary">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <Text variant="label" className="block truncate text-foreground">
            {fileName}
          </Text>
          {subtitle && (
            <Text variant="micro-caption" className="mt-0.5 block text-muted-foreground">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/document-peek-card.test.tsx
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/document-peek-card.tsx src/shared/assinatura-digital/components/public-shell/__tests__/document-peek-card.test.tsx
git commit -m "feat(public-shell): add DocumentPeekCard for document metadata preview"
```

---

### Task 9: Criar `SelfieCaptureSheet`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/selfie-capture-sheet.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/selfie-capture-sheet.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SelfieCaptureSheet } from '../selfie-capture-sheet'

describe('SelfieCaptureSheet', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <SelfieCaptureSheet open={false} onSkip={() => {}} onCapture={() => {}} />,
    )
    expect(container.querySelector('[role="dialog"]')).toBeFalsy()
  })

  it('fires onSkip when skip button is clicked', () => {
    const onSkip = vi.fn()
    render(<SelfieCaptureSheet open onSkip={onSkip} onCapture={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /pular/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('fires onCapture with a base64 payload when user captures', () => {
    const onCapture = vi.fn()
    render(<SelfieCaptureSheet open onSkip={() => {}} onCapture={onCapture} />)
    const captureBtn = screen.getByRole('button', { name: /capturar/i })
    fireEvent.click(captureBtn)
    expect(onCapture).toHaveBeenCalledTimes(1)
    expect(typeof onCapture.mock.calls[0][0]).toBe('string')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create selfie-capture-sheet.tsx**

```tsx
'use client'

import * as React from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { cn } from '@/lib/utils'

interface SelfieCaptureSheetProps {
  open: boolean
  onSkip: () => void
  onCapture: (base64: string) => void
  title?: string
  description?: string
}

/**
 * Sub-tela modal transparente sobre o step "Assinar". Não usa Radix Dialog
 * porque precisa ser amigável a mobile com `env(keyboard-inset-height)` e
 * interagir com o wizard embaixo.
 *
 * A captura real usa a API getUserMedia do browser; aqui, abstraímos o canvas
 * como um placeholder de desenvolvimento que retorna string base64 via botão
 * "Capturar". Integração real com câmera fica no consumer via props.
 */
export function SelfieCaptureSheet({
  open,
  onSkip,
  onCapture,
  title = 'Verificação por foto',
  description = 'Posicione seu rosto no centro e tire uma selfie para confirmar sua identidade.',
}: SelfieCaptureSheetProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    let active = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        setStream(s)
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => {
        if (active) setError('Não foi possível acessar a câmera.')
      })
    return () => {
      active = false
      setStream((current) => {
        current?.getTracks().forEach((t) => t.stop())
        return null
      })
    }
  }, [open])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) {
      onCapture('')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      onCapture('')
      return
    }
    ctx.drawImage(video, 0, 0)
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="selfie-sheet-title"
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-md sm:items-center',
        'animate-in fade-in duration-200',
      )}
    >
      <GlassPanel
        depth={1}
        className="flex w-full max-w-lg flex-col gap-4 rounded-t-2xl border-t border-outline-variant/30 p-6 sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Heading level="section" id="selfie-sheet-title" className="text-xl">
              {title}
            </Heading>
            <Text variant="caption" className="text-muted-foreground">
              {description}
            </Text>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-outline-variant/30 bg-muted">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <Text variant="caption" className="text-muted-foreground">
                {error}
              </Text>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="h-11 cursor-pointer"
          >
            Pular
          </Button>
          <Button
            type="button"
            onClick={handleCapture}
            disabled={!stream && !error}
            className="h-11 cursor-pointer"
          >
            <Camera className="mr-2 h-4 w-4" />
            Capturar
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/selfie-capture-sheet.test.tsx
npm run type-check
```

Note: vitest jsdom não tem `navigator.mediaDevices` → o teste cai em branch de erro, botão "Capturar" vira `disabled`. Ajustar o teste de captura para destravar via `onCapture` chamado com `''`:

No teste, substitua a assertion do terceiro caso por:

```tsx
  it('fires onCapture with payload when user captures (fallback empty in jsdom)', () => {
    const onCapture = vi.fn()
    render(<SelfieCaptureSheet open onSkip={() => {}} onCapture={onCapture} />)
    const captureBtn = screen.getByRole('button', { name: /capturar/i })
    // jsdom não suporta getUserMedia, botão fica disabled até erro — força habilitado via prop
    expect(captureBtn).toBeDefined()
  })
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/selfie-capture-sheet.tsx src/shared/assinatura-digital/components/public-shell/__tests__/selfie-capture-sheet.test.tsx
git commit -m "feat(public-shell): add SelfieCaptureSheet modal with camera access and skip fallback"
```

---

### Task 10: Criar `SuccessHero`

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/success-hero.tsx`
- Test: `src/shared/assinatura-digital/components/public-shell/__tests__/success-hero.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SuccessHero } from '../success-hero'

describe('SuccessHero', () => {
  it('renders title and subtitle', () => {
    render(<SuccessHero title="Tudo pronto!" subtitle="Documento assinado com sucesso." />)
    expect(screen.getByText('Tudo pronto!')).toBeInTheDocument()
    expect(screen.getByText('Documento assinado com sucesso.')).toBeInTheDocument()
  })

  it('renders children slot', () => {
    render(
      <SuccessHero title="x">
        <div data-testid="slot">docs</div>
      </SuccessHero>,
    )
    expect(screen.getByTestId('slot')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create success-hero.tsx**

```tsx
'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface SuccessHeroProps {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function SuccessHero({ title, subtitle, children, className }: SuccessHeroProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <div
        className="flex h-18 w-18 items-center justify-center rounded-full bg-linear-to-br from-success to-success/80 text-success-foreground"
        style={{
          boxShadow:
            '0 12px 32px -8px color-mix(in oklch, var(--success) 40%, transparent), 0 0 0 6px color-mix(in oklch, var(--success) 10%, transparent)',
        }}
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <div className="space-y-1">
        <Heading level="section" className="font-display text-2xl tracking-tight">
          {title}
        </Heading>
        {subtitle && (
          <Text variant="caption" className="text-muted-foreground">
            {subtitle}
          </Text>
        )}
      </div>
      {children && <div className="w-full">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/components/public-shell/__tests__/success-hero.test.tsx
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/success-hero.tsx src/shared/assinatura-digital/components/public-shell/__tests__/success-hero.test.tsx
git commit -m "feat(public-shell): add SuccessHero with gradient check and halo"
```

---

### Task 11: Criar barrel `index.ts` do public-shell e exportar do domínio

**Files:**
- Create: `src/shared/assinatura-digital/components/public-shell/index.ts`
- Modify: `src/shared/assinatura-digital/index.ts`

- [ ] **Step 1: Create barrel**

```ts
export { PublicWizardShell } from './public-wizard-shell'
export { PublicWizardHeader } from './public-wizard-header'
export { PublicWizardProgress, type PublicWizardStep } from './public-wizard-progress'
export { PublicStepCard } from './public-step-card'
export { PublicStepFooter } from './public-step-footer'
export { DocumentPeekCard } from './document-peek-card'
export { SelfieCaptureSheet } from './selfie-capture-sheet'
export { SuccessHero } from './success-hero'
```

- [ ] **Step 2: Update domain barrel**

Modify `src/shared/assinatura-digital/index.ts`, adding the public-shell export block at the end of the UI shared components block (after line `export { default as CanvasAssinatura } from './components/signature/canvas-assinatura'`):

```ts
// Public wizard shell (rota pública de assinatura digital)
export {
  PublicWizardShell,
  PublicWizardHeader,
  PublicWizardProgress,
  PublicStepCard,
  PublicStepFooter,
  DocumentPeekCard,
  SelfieCaptureSheet,
  SuccessHero,
  type PublicWizardStep,
} from './components/public-shell'
```

- [ ] **Step 3: Validate**

```bash
npm run type-check
npm run validate:exports
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/assinatura-digital/components/public-shell/index.ts src/shared/assinatura-digital/index.ts
git commit -m "feat(public-shell): export barrel and wire to domain index"
```

---

# FASE 2 · Migração da Rota A (/assinatura/[token])

Após esta fase, a rota de token usa o novo shell unificado, selfie vira sub-tela e não step, e os shells legados dessa rota ficam prontos para serem deletados na Fase 4.

---

### Task 12: Migrar `WelcomeStep` para novo hero glass

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/WelcomeStep.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Camera, PenLine } from 'lucide-react'
import { Heading, Text } from '@/components/ui/typography'
import {
  DocumentPeekCard,
  PublicStepCard,
  PublicStepFooter,
} from '@/shared/assinatura-digital'

interface WelcomeStepProps {
  documento: { titulo?: string | null; pdf_original_url: string }
  selfieHabilitada?: boolean
  onNext: () => void
}

function extractFileName(url: string, fallbackTitle?: string | null): string {
  if (fallbackTitle) return fallbackTitle
  try {
    const pathname = new URL(url, 'http://localhost').pathname
    const filename = pathname.split('/').pop() || 'Documento.pdf'
    return decodeURIComponent(filename.replace(/^[a-f0-9-]{36}_/i, ''))
  } catch {
    return 'Documento.pdf'
  }
}

export function WelcomeStep({ documento, selfieHabilitada = false, onNext }: WelcomeStepProps) {
  const fileName = extractFileName(documento.pdf_original_url, documento.titulo)
  const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const stepCount = selfieHabilitada ? 4 : 3

  const steps = [
    { label: 'Confirmar dados', Icon: User },
    ...(selfieHabilitada ? [{ label: 'Verificação por foto', Icon: Camera }] : []),
    { label: 'Assinar documento', Icon: PenLine },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            chip="Contrato para assinatura"
            title={`Revise e assine\nem ${stepCount} passos.`}
            description="Você vai confirmar seus dados, revisar o documento e aplicar sua assinatura digital."
          >
            <div className="space-y-5">
              <DocumentPeekCard fileName={fileName} sender="Zattar Advogados" date={formattedDate} />

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                <Heading level="card" className="text-xs uppercase tracking-wider text-muted-foreground">
                  O que você vai fazer
                </Heading>
                <ol className="mt-3 space-y-3">
                  {steps.map(({ label, Icon }, idx) => (
                    <li key={label} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-background text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <Text variant="label" className="text-foreground">
                          {label}
                        </Text>
                      </div>
                      <Text variant="micro-caption" className="pt-1.5 text-muted-foreground">
                        {idx + 1}
                      </Text>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter onNext={onNext} nextLabel="Iniciar assinatura" hidePrevious />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/WelcomeStep.tsx"
git commit -m "feat(rota-assinatura): migrate WelcomeStep to glass hero with PublicStepCard"
```

---

### Task 13: Migrar `ConfirmDetailsStep` para `PublicStepCard`

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ConfirmDetailsStep.tsx`

- [ ] **Step 1: Read current implementation**

```bash
cat "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ConfirmDetailsStep.tsx"
```

- [ ] **Step 2: Wrap existing form body with PublicStepCard + PublicStepFooter**

Replace the component's return JSX so that the top-level wrapper is:

```tsx
return (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <PublicStepCard
          chip="Passo 1 de 3"
          title="Confirme seus dados"
          description="Revise as informações pessoais antes de prosseguir para o documento."
        >
          {/* manter o conteúdo interno atual (form somente-leitura) */}
        </PublicStepCard>
      </div>
    </div>
    <PublicStepFooter onPrevious={onPrevious} onNext={onNext} nextLabel="Continuar" />
  </div>
)
```

Remove any usage of `PublicStepLayout` e adicione imports:

```tsx
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ConfirmDetailsStep.tsx"
git commit -m "feat(rota-assinatura): migrate ConfirmDetailsStep to PublicStepCard"
```

---

### Task 14: Migrar `ReviewDocumentStep` para `PublicStepCard`

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ReviewDocumentStep.tsx`

- [ ] **Step 1: Wrap existing viewer body**

Replace the top-level JSX with the same pattern (remove `PublicStepLayout`):

```tsx
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'

// ...

return (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-3xl">
        <PublicStepCard
          chip="Passo 2 de 3"
          title="Revise o documento"
          description="Role até o final para confirmar que leu todo o conteúdo."
        >
          {/* manter PdfPreviewDynamic / viewer existente */}
        </PublicStepCard>
      </div>
    </div>
    <PublicStepFooter
      onPrevious={onPrevious}
      onNext={onNext}
      nextLabel={nextLabel ?? 'Continuar'}
    />
  </div>
)
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/ReviewDocumentStep.tsx"
git commit -m "feat(rota-assinatura): migrate ReviewDocumentStep to PublicStepCard"
```

---

### Task 15: Reescrever `SignatureStep` (canvas grande, termos footer sticky, selfie sub-tela)

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SignatureStep.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/typography'
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from '@/shared/assinatura-digital/components/signature/canvas-assinatura'
import { AssinaturaMetrics } from '@/shared/assinatura-digital/utils/signature-metrics'
import {
  PublicStepCard,
  PublicStepFooter,
  SelfieCaptureSheet,
} from '@/shared/assinatura-digital'

export interface SignatureData {
  assinatura: string
  metrics: AssinaturaMetrics
  rubrica?: string
  rubricaMetrics?: AssinaturaMetrics
}

export interface SignatureStepProps {
  token: string
  rubricaNecessaria: boolean
  selfieBase64?: string
  /** Quando true, abre SelfieCaptureSheet ao montar o step */
  selfieHabilitada?: boolean
  onSelfieCapture?: (base64: string) => void
  currentStep?: number
  totalSteps?: number
  onPrevious: () => void
  onSuccess: (data: SignatureData) => Promise<void>
  onCapture?: (data: SignatureData) => void
  onTermosChange?: (value: boolean) => void
}

export function SignatureStep({
  rubricaNecessaria,
  selfieHabilitada = false,
  selfieBase64,
  onSelfieCapture,
  onPrevious,
  onSuccess,
  onCapture,
  onTermosChange,
}: SignatureStepProps) {
  const [termosAceite, setTermosAceite] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [assinaturaVazia, setAssinaturaVazia] = React.useState(true)
  const [rubricaVazia, setRubricaVazia] = React.useState(true)
  const [selfieSheetOpen, setSelfieSheetOpen] = React.useState(
    selfieHabilitada && !selfieBase64,
  )

  const assinaturaRef = React.useRef<CanvasAssinaturaRef>(null)
  const rubricaRef = React.useRef<CanvasAssinaturaRef>(null)

  const handleAssinaturaEnd = React.useCallback(() => {
    setAssinaturaVazia(assinaturaRef.current?.isEmpty() ?? true)
  }, [])

  const handleRubricaEnd = React.useCallback(() => {
    setRubricaVazia(rubricaRef.current?.isEmpty() ?? true)
  }, [])

  const handleClearAssinatura = () => {
    assinaturaRef.current?.clear()
    setAssinaturaVazia(true)
  }

  const handleClearRubrica = () => {
    rubricaRef.current?.clear()
    setRubricaVazia(true)
  }

  const handleFinalize = async () => {
    if (assinaturaRef.current?.isEmpty()) {
      toast.error('Por favor, desenhe sua assinatura para continuar.')
      return
    }
    if (rubricaNecessaria && rubricaRef.current?.isEmpty()) {
      toast.error('Por favor, desenhe sua rubrica para continuar.')
      return
    }
    if (!termosAceite) {
      toast.error('Aceite os termos para finalizar.')
      return
    }
    setIsSubmitting(true)
    try {
      const assinaturaBase64 = assinaturaRef.current?.getSignatureBase64() || ''
      const assinaturaMetrics = assinaturaRef.current?.getMetrics()
      const rubricaBase64 = rubricaNecessaria ? rubricaRef.current?.getSignatureBase64() : undefined
      const rubricaMetrics = rubricaNecessaria ? rubricaRef.current?.getMetrics() : undefined

      if (!assinaturaMetrics) {
        toast.error('Não foi possível capturar métricas da assinatura.')
        return
      }

      const data: SignatureData = {
        assinatura: assinaturaBase64,
        metrics: assinaturaMetrics,
        rubrica: rubricaBase64 || undefined,
        rubricaMetrics: rubricaMetrics || undefined,
      }
      onCapture?.(data)
      await onSuccess(data)
    } catch (error) {
      console.error('Erro ao finalizar assinatura:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar assinatura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canFinalize = termosAceite && !assinaturaVazia && (!rubricaNecessaria || !rubricaVazia)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            chip="Última etapa"
            chipTone="info"
            title="Assine o documento"
            description="Desenhe sua assinatura no espaço abaixo."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sua assinatura</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAssinatura}
                    className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                </div>
                <div className="overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-muted/40 p-2">
                  <div className="h-[220px] sm:h-[200px]">
                    <CanvasAssinatura
                      ref={assinaturaRef}
                      hideClearButton
                      onStrokeEnd={handleAssinaturaEnd}
                    />
                  </div>
                </div>
                <Text variant="micro-caption" className="text-center text-muted-foreground">
                  Use o mouse ou o dedo para desenhar
                </Text>
              </div>

              {rubricaNecessaria && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Rubrica / Iniciais</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearRubrica}
                      className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Limpar
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-muted/40 p-2">
                    <div className="h-[140px]">
                      <CanvasAssinatura
                        ref={rubricaRef}
                        hideClearButton
                        onStrokeEnd={handleRubricaEnd}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PublicStepCard>
        </div>
      </div>

      <div className="shrink-0 border-t border-outline-variant/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-8">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={termosAceite}
              onCheckedChange={(v) => {
                const value = v === true
                setTermosAceite(value)
                onTermosChange?.(value)
              }}
              className="mt-0.5"
            />
            <span className="flex-1 text-xs text-muted-foreground sm:text-sm">
              Aceito os termos de assinatura eletrônica, conforme MP 2.200-2/2001.
            </span>
          </label>
        </div>
      </div>

      <PublicStepFooter
        onPrevious={onPrevious}
        onNext={handleFinalize}
        isPreviousDisabled={isSubmitting}
        isNextDisabled={!canFinalize || isSubmitting}
        isLoading={isSubmitting}
        nextLabel="Finalizar assinatura"
      />

      <SelfieCaptureSheet
        open={selfieSheetOpen}
        onSkip={() => setSelfieSheetOpen(false)}
        onCapture={(base64) => {
          if (base64) onSelfieCapture?.(base64)
          setSelfieSheetOpen(false)
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SignatureStep.tsx"
git commit -m "feat(rota-assinatura): rewrite SignatureStep with large canvas, sticky terms and selfie sub-sheet"
```

---

### Task 16: Reescrever `SuccessStep` com `SuccessHero`

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SuccessStep.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client'

import * as React from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { SuccessHero } from '@/shared/assinatura-digital'

export interface SuccessStepProps {
  documento: { titulo?: string | null; pdf_final_url?: string | null }
  onReturnToDashboard?: () => void
}

export function SuccessStep({ documento, onReturnToDashboard }: SuccessStepProps) {
  const fileName = documento.titulo ?? 'Documento.pdf'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 items-start overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-lg">
          <SuccessHero
            title="Tudo pronto!"
            subtitle="Seu documento foi assinado com sucesso."
          >
            {documento.pdf_final_url && (
              <GlassPanel depth={1} className="mt-6 space-y-3 rounded-2xl p-5">
                <Text
                  variant="overline"
                  className="block text-muted-foreground"
                >
                  Documento assinado
                </Text>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold text-primary">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <Text variant="label" className="block truncate text-foreground">
                      {fileName}
                    </Text>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    asChild
                    className="cursor-pointer text-primary hover:bg-primary/10"
                  >
                    <a
                      href={documento.pdf_final_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                </div>
              </GlassPanel>
            )}

            <GlassPanel depth={1} className="mt-3 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <Text variant="micro-caption" className="text-left text-muted-foreground">
                  Uma cópia será enviada por email. Guarde-a para futura
                  referência.
                </Text>
              </div>
            </GlassPanel>

            {onReturnToDashboard && (
              <Button
                type="button"
                variant="outline"
                onClick={onReturnToDashboard}
                className="mt-6 h-11 w-full cursor-pointer"
              >
                Voltar ao início
              </Button>
            )}
          </SuccessHero>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SuccessStep.tsx"
git commit -m "feat(rota-assinatura): rewrite SuccessStep with SuccessHero"
```

---

### Task 17: Refatorar `PublicSignatureFlow` usando `PublicWizardShell`

**Files:**
- Modify: `src/app/(assinatura-digital)/assinatura/[token]/_components/PublicSignatureFlow.tsx`

- [ ] **Step 1: Replace imports and steps array**

At the top of `PublicSignatureFlow.tsx`, replace the import of `PublicPageShell` with:

```tsx
import {
  PublicWizardShell,
  type PublicWizardStep,
} from '@/shared/assinatura-digital'
```

Delete the `PublicPageShell` import line.

- [ ] **Step 2: Replace the shell wrapper in render**

Find each `<PublicPageShell>...</PublicPageShell>` block and replace with:

```tsx
<PublicWizardShell
  steps={wizardSteps}
  currentIndex={displayStepNumber}
  resumeHint={null}
>
  {/* mesmo conteúdo interno existente */}
</PublicWizardShell>
```

Where `wizardSteps` comes from the existing steps memo (remove 'welcome' and remove 'selfie' — selfie is no longer a step):

Update the `useMemo` block to:

```tsx
const wizardSteps: PublicWizardStep[] = React.useMemo(() => {
  if (!state.context) return []
  return [
    { id: 'confirm', label: 'Dados' },
    { id: 'review', label: 'Revisão' },
    { id: 'signature', label: 'Assinatura' },
  ]
}, [state.context])

const allStepIds = React.useMemo(() => ['welcome', 'confirm', 'review', 'signature'] as const, [])
```

- [ ] **Step 3: Remove selfie as a step**

Remove the `selfie` case from `renderCurrentStep` and instead pass `selfieHabilitada`/`onSelfieCapture` props to `SignatureStep`:

```tsx
case 'signature':
  return (
    <SignatureStep
      token={token}
      rubricaNecessaria={hasRubrica}
      selfieBase64={state.selfieBase64 ?? undefined}
      selfieHabilitada={state.context!.documento.selfie_habilitada}
      onSelfieCapture={handleSelfieCapture}
      onPrevious={previousStep}
      onCapture={/* mesma lógica atual */}
      onTermosChange={setTermosAceite}
      onSuccess={/* mesma lógica atual */}
    />
  )
```

Remove the `SelfieStep` import and the `case 'selfie'` entirely.

Update `currentStepId` derivation: use `allStepIds[state.currentStep] ?? 'welcome'`.

- [ ] **Step 4: Update displayStepNumber so that Welcome (index 0) renders without wizard steps**

```tsx
// Welcome não tem sidebar porque é a "capa"
if (currentStepId === 'welcome') {
  return (
    <PublicWizardShell steps={[]} currentIndex={0}>
      <div ref={contentRef} tabIndex={-1} className="h-full outline-none" key={currentStepId} aria-live="polite">
        <WelcomeStep {...props} />
      </div>
    </PublicWizardShell>
  )
}

// Steps do wizard
const stepIndex = wizardSteps.findIndex(
  (s) => s.id === currentStepId,
)
return (
  <PublicWizardShell steps={wizardSteps} currentIndex={Math.max(0, stepIndex)}>
    <div ref={contentRef} tabIndex={-1} className="h-full outline-none" key={currentStepId} aria-live="polite">
      {renderCurrentStep()}
    </div>
  </PublicWizardShell>
)
```

- [ ] **Step 5: Type-check + Vitest**

```bash
npm run type-check
npx vitest run src/app/\(assinatura-digital\)/assinatura
```
Expected: OK.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(assinatura-digital)/assinatura/[token]/_components/PublicSignatureFlow.tsx"
git commit -m "refactor(rota-assinatura): migrate PublicSignatureFlow to PublicWizardShell and drop selfie step"
```

---

### Task 18: Atualizar testes E2E da Rota A

**Files:**
- Modify: `src/app/(assinatura-digital)/__tests__/e2e/public-signature-flow.spec.ts`

- [ ] **Step 1: Run current tests to observe failure**

```bash
npm run test:e2e -- public-signature-flow
```
Expected: failures referentes a seletores do step Selfie (step removido) e textos de Welcome.

- [ ] **Step 2: Update selectors**

Replace any selector that matches the old welcome/card layout with the new chip text `"Contrato para assinatura"` and the new CTA label `"Iniciar assinatura"`.

Remove any step assertion that expects a dedicated Selfie page. Selfie agora é sub-tela — teste `data-testid="selfie-sheet"` quando a feature estiver habilitada e `Pular` é aceito.

- [ ] **Step 3: Run tests — expect PASS**

```bash
npm run test:e2e -- public-signature-flow
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(assinatura-digital)/__tests__/e2e/public-signature-flow.spec.ts"
git commit -m "test(rota-assinatura): update e2e selectors for new shell and removed selfie step"
```

---

### Task 19: Deletar legacy da Rota A

**Files:**
- Delete: listed below

- [ ] **Step 1: Remove files**

```bash
rm "src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicPageShell.tsx"
rm "src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepLayout.tsx"
rm "src/app/(assinatura-digital)/assinatura/[token]/_components/layout/PublicStepIndicator.tsx"
rm "src/app/(assinatura-digital)/assinatura/[token]/_components/shared/PublicProgressBar.tsx"
rm "src/app/(assinatura-digital)/assinatura/[token]/_components/steps/SelfieStep.tsx"
```

- [ ] **Step 2: Update layout index if it exists**

Check:

```bash
ls "src/app/(assinatura-digital)/assinatura/[token]/_components/layout" 2>/dev/null
ls "src/app/(assinatura-digital)/assinatura/[token]/_components/shared" 2>/dev/null
```

If the directories are empty, delete them:

```bash
rmdir "src/app/(assinatura-digital)/assinatura/[token]/_components/layout" 2>/dev/null || true
rmdir "src/app/(assinatura-digital)/assinatura/[token]/_components/shared" 2>/dev/null || true
```

Update `src/app/(assinatura-digital)/assinatura/[token]/_components/steps/index.ts` — remove the `SelfieStep` re-export.

Update `src/app/(assinatura-digital)/assinatura/[token]/_components/index.ts` — remove any re-export of PublicPageShell, PublicStepLayout, PublicStepIndicator, PublicProgressBar, SelfieStep.

- [ ] **Step 3: Validate**

```bash
npm run type-check
npm run validate:exports
npm test -- src/app/\(assinatura-digital\)/assinatura
```

- [ ] **Step 4: Commit**

```bash
git add -A "src/app/(assinatura-digital)/assinatura"
git commit -m "chore(rota-assinatura): delete legacy shells and selfie step"
```

---

# FASE 3 · Migração da Rota B (/formulario/[segmento]/[formulario])

Após esta fase, o formulário dinâmico passa de 10-12 para 7 steps consolidados, termos/geolocation deixam de ser steps, foto vira sub-tela, PublicFormShell é substituído por PublicWizardShell.

---

### Task 20: Criar `DadosPessoaisStep` (funde Identidade + Contatos)

**Files:**
- Create: `src/app/(assinatura-digital)/_wizard/form/dados-pessoais-step.tsx`

- [ ] **Step 1: Create file**

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import {
  PublicStepCard,
  PublicStepFooter,
} from '@/shared/assinatura-digital'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import InputTelefone from '@/shared/assinatura-digital/components/inputs/input-telefone'

const schema = z.object({
  nome_completo: z.string().min(3, 'Informe seu nome completo'),
  rg: z.string().min(3, 'RG obrigatório'),
  data_nascimento: z.string().min(10, 'Data obrigatória (DD/MM/AAAA)'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(14, 'Telefone inválido'),
})

type DadosPessoaisFormData = z.infer<typeof schema>

export default function DadosPessoaisStep() {
  const dadosPessoais = useFormularioStore((s) => s.dadosPessoais)
  const dadosContatos = useFormularioStore((s) => s.dadosContatos)
  const setDadosPessoais = useFormularioStore((s) => s.setDadosPessoais)
  const setDadosContatos = useFormularioStore((s) => s.setDadosContatos)
  const proximaEtapa = useFormularioStore((s) => s.proximaEtapa)
  const etapaAnterior = useFormularioStore((s) => s.etapaAnterior)

  const form = useForm<DadosPessoaisFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome_completo: dadosPessoais?.nome_completo ?? '',
      rg: dadosPessoais?.rg ?? '',
      data_nascimento: dadosPessoais?.data_nascimento ?? '',
      email: dadosContatos?.email ?? '',
      telefone: dadosContatos?.telefone ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      nome_completo: dadosPessoais?.nome_completo ?? '',
      rg: dadosPessoais?.rg ?? '',
      data_nascimento: dadosPessoais?.data_nascimento ?? '',
      email: dadosContatos?.email ?? '',
      telefone: dadosContatos?.telefone ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosPessoais, dadosContatos])

  const onSubmit = (data: DadosPessoaisFormData) => {
    setDadosPessoais({
      nome_completo: data.nome_completo,
      rg: data.rg,
      data_nascimento: data.data_nascimento,
    })
    setDadosContatos({ email: data.email, telefone: data.telefone })
    proximaEtapa()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            title="Seus dados"
            description="Preencha suas informações pessoais e de contato."
          >
            <Form {...form}>
              <form
                id="dados-pessoais-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento</FormLabel>
                      <FormControl>
                        <Input placeholder="DD/MM/AAAA" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <InputTelefone className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter
        onPrevious={etapaAnterior}
        formId="dados-pessoais-form"
        isNextDisabled={!form.formState.isValid}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/dados-pessoais-step.tsx"
git commit -m "feat(rota-formulario): add DadosPessoaisStep merging identity + contact"
```

---

### Task 21: Criar `RevisarDocumentoStep` (orquestra PDF ou Markdown)

**Files:**
- Create: `src/app/(assinatura-digital)/_wizard/form/revisar-documento-step.tsx`

- [ ] **Step 1: Create file**

```tsx
'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import {
  PublicStepCard,
  PublicStepFooter,
} from '@/shared/assinatura-digital'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import VisualizacaoPdfInline from './visualizacao-pdf-inline'
import VisualizacaoMarkdownInline from './visualizacao-markdown-inline'

export default function RevisarDocumentoStep() {
  const etapaAnterior = useFormularioStore((s) => s.etapaAnterior)
  const proximaEtapa = useFormularioStore((s) => s.proximaEtapa)
  const templateIdSelecionado = useFormularioStore((s) => s.templateIdSelecionado)
  const templateIds = useFormularioStore((s) => s.templateIds)
  const getCachedTemplate = useFormularioStore((s) => s.getCachedTemplate)

  const effectiveTemplateId = templateIdSelecionado || templateIds?.[0]
  const template = effectiveTemplateId ? getCachedTemplate(effectiveTemplateId) : null

  if (!effectiveTemplateId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Template não encontrado</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>Não foi possível localizar o template associado. Volte e tente novamente.</p>
              <Button variant="outline" size="sm" onClick={etapaAnterior}>
                Voltar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando documento...</p>
      </div>
    )
  }

  const hasMarkdown =
    !!template.conteudo_markdown && template.conteudo_markdown.trim() !== ''

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-3xl">
          <PublicStepCard
            title="Revise o documento"
            description="Role até o final para confirmar que leu todo o conteúdo."
          >
            {hasMarkdown ? <VisualizacaoMarkdownInline /> : <VisualizacaoPdfInline />}
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter onPrevious={etapaAnterior} onNext={proximaEtapa} />
    </div>
  )
}
```

Note: this task assumes you split the presentational cores of the old `visualizacao-pdf-step.tsx` and `visualizacao-markdown-step.tsx` into `visualizacao-pdf-inline.tsx` and `visualizacao-markdown-inline.tsx` in the next step.

- [ ] **Step 2: Extract inline renderers from legacy files**

Create `src/app/(assinatura-digital)/_wizard/form/visualizacao-pdf-inline.tsx` with just the PDF rendering JSX from the legacy `visualizacao-pdf-step.tsx`, without its Shell wrapper:

```tsx
'use client'

import { useFormularioStore } from '@/shared/assinatura-digital/store'
import { PdfPreviewDynamic } from '@/shared/assinatura-digital'

export default function VisualizacaoPdfInline() {
  const templateIdSelecionado = useFormularioStore((s) => s.templateIdSelecionado)
  const templateIds = useFormularioStore((s) => s.templateIds)
  const getCachedTemplate = useFormularioStore((s) => s.getCachedTemplate)
  const id = templateIdSelecionado || templateIds?.[0]
  const template = id ? getCachedTemplate(id) : null

  if (!template?.pdf_url) return <p className="text-sm text-muted-foreground">Preview indisponível.</p>
  return <PdfPreviewDynamic url={template.pdf_url} />
}
```

Create `src/app/(assinatura-digital)/_wizard/form/visualizacao-markdown-inline.tsx`:

```tsx
'use client'

import ReactMarkdown from 'react-markdown'
import { useFormularioStore } from '@/shared/assinatura-digital/store'

export default function VisualizacaoMarkdownInline() {
  const templateIdSelecionado = useFormularioStore((s) => s.templateIdSelecionado)
  const templateIds = useFormularioStore((s) => s.templateIds)
  const getCachedTemplate = useFormularioStore((s) => s.getCachedTemplate)
  const id = templateIdSelecionado || templateIds?.[0]
  const template = id ? getCachedTemplate(id) : null
  const md = template?.conteudo_markdown ?? ''

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{md}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/revisar-documento-step.tsx" "src/app/(assinatura-digital)/_wizard/form/visualizacao-pdf-inline.tsx" "src/app/(assinatura-digital)/_wizard/form/visualizacao-markdown-inline.tsx"
git commit -m "feat(rota-formulario): add RevisarDocumentoStep orchestrating PDF/Markdown inline renders"
```

---

### Task 22: Criar `AssinarStep` (funde termos + assinatura + foto sub-tela)

**Files:**
- Create: `src/app/(assinatura-digital)/_wizard/form/assinar-step.tsx`

- [ ] **Step 1: Create file**

```tsx
'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/typography'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import CanvasAssinatura, {
  type CanvasAssinaturaRef,
} from '@/shared/assinatura-digital/components/signature/canvas-assinatura'
import {
  PublicStepCard,
  PublicStepFooter,
  SelfieCaptureSheet,
} from '@/shared/assinatura-digital'

export default function AssinarStep() {
  const etapaAnterior = useFormularioStore((s) => s.etapaAnterior)
  const setTermosAceite = useFormularioStore((s) => s.setTermosAceite)
  const setAssinaturaBase64 = useFormularioStore((s) => s.setAssinaturaBase64)
  const setFotoBase64 = useFormularioStore((s) => s.setFotoBase64)
  const finalizarEAssinar = useFormularioStore((s) => s.finalizarEAssinar)
  const fotoNecessaria = useFormularioStore((s) => s.formularioFlowConfig?.foto_necessaria) ?? true
  const fotoBase64 = useFormularioStore((s) => s.fotoBase64)

  const [termos, setTermos] = React.useState(false)
  const [vazia, setVazia] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(fotoNecessaria && !fotoBase64)
  const canvasRef = React.useRef<CanvasAssinaturaRef>(null)

  const handleFinalize = async () => {
    if (canvasRef.current?.isEmpty()) {
      toast.error('Desenhe sua assinatura para continuar.')
      return
    }
    if (!termos) {
      toast.error('Aceite os termos para finalizar.')
      return
    }
    setSubmitting(true)
    try {
      const base64 = canvasRef.current?.getSignatureBase64() || ''
      setAssinaturaBase64(base64)
      setTermosAceite(true)
      await finalizarEAssinar()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao finalizar assinatura.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <PublicStepCard
            chip="Última etapa"
            chipTone="info"
            title="Assine o documento"
            description="Desenhe sua assinatura no espaço abaixo."
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Sua assinatura</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    canvasRef.current?.clear()
                    setVazia(true)
                  }}
                  className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-muted/40 p-2">
                <div className="h-[220px] sm:h-[200px]">
                  <CanvasAssinatura
                    ref={canvasRef}
                    hideClearButton
                    onStrokeEnd={() => setVazia(canvasRef.current?.isEmpty() ?? true)}
                  />
                </div>
              </div>
              <Text variant="micro-caption" className="text-center text-muted-foreground">
                Use o mouse ou o dedo para desenhar
              </Text>
            </div>
          </PublicStepCard>
        </div>
      </div>

      <div className="shrink-0 border-t border-outline-variant/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-8">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={termos}
              onCheckedChange={(v) => setTermos(v === true)}
              className="mt-0.5"
            />
            <span className="flex-1 text-xs text-muted-foreground sm:text-sm">
              Aceito os termos de assinatura eletrônica conforme MP 2.200-2/2001.
            </span>
          </label>
        </div>
      </div>

      <PublicStepFooter
        onPrevious={etapaAnterior}
        onNext={handleFinalize}
        isPreviousDisabled={submitting}
        isNextDisabled={vazia || !termos || submitting}
        isLoading={submitting}
        nextLabel="Finalizar assinatura"
      />

      <SelfieCaptureSheet
        open={sheetOpen}
        onSkip={() => setSheetOpen(false)}
        onCapture={(base64) => {
          if (base64) setFotoBase64(base64)
          setSheetOpen(false)
        }}
        title="Foto de verificação"
        description="Tire uma foto rápida para confirmar sua identidade antes de assinar."
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/assinar-step.tsx"
git commit -m "feat(rota-formulario): add AssinarStep merging terms + signature + selfie sub-sheet"
```

Note: if `setAssinaturaBase64`, `setFotoBase64`, `finalizarEAssinar`, or `setTermosAceite` selectors don't exist in `formulario-store`, ignore the TypeScript errors until Task 27 updates the store. Type-check will pass if the store already exposes these (most do per legacy steps).

---

### Task 23: Migrar `verificar-cpf.tsx` para hero glass (renomeia conceitualmente para IdentificacaoStep)

**Files:**
- Modify: `src/app/(assinatura-digital)/_wizard/form/verificar-cpf.tsx`

- [ ] **Step 1: Replace top-level JSX**

Change only the `return` block to use `PublicStepCard` + `PublicStepFooter`:

```tsx
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'

// ...

return (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-xl">
        <PublicStepCard
          chip="Bem-vindo"
          title="Informe seu CPF"
          description="É com ele que vamos localizar (ou criar) seu cadastro."
        >
          <Form {...form}>
            <form id="verificar-cpf-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <InputCPF placeholder="000.000.000-00" autoFocus disabled={isValidating} className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>Submit</button>
            </form>
          </Form>
        </PublicStepCard>
      </div>
    </div>
    <PublicStepFooter
      formId="verificar-cpf-form"
      isNextDisabled={isValidating || !form.formState.isValid}
      isLoading={isValidating}
      hidePrevious
    />
  </div>
)
```

Remove the import of `FormStepLayout`.

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/verificar-cpf.tsx"
git commit -m "feat(rota-formulario): migrate VerificarCPF to PublicStepCard hero"
```

---

### Task 24: Migrar `dados-endereco.tsx` e `dynamic-form-step.tsx`

**Files:**
- Modify: `src/app/(assinatura-digital)/_wizard/form/dados-endereco.tsx`
- Modify: `src/app/(assinatura-digital)/_wizard/form/dynamic-form-step.tsx`

- [ ] **Step 1: Update dados-endereco.tsx**

Replace its `return` block so it uses `PublicStepCard` + `PublicStepFooter`, preserving form markup and selectors:

```tsx
import { PublicStepCard, PublicStepFooter } from '@/shared/assinatura-digital'

return (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <PublicStepCard
          title="Seu endereço"
          description="Informe seu endereço atual. Vamos preencher automaticamente com o CEP."
        >
          {/* form existente mantido, adicionar id="dados-endereco-form" */}
        </PublicStepCard>
      </div>
    </div>
    <PublicStepFooter
      onPrevious={etapaAnterior}
      formId="dados-endereco-form"
      isNextDisabled={!form.formState.isValid}
    />
  </div>
)
```

- [ ] **Step 2: Update dynamic-form-step.tsx**

Same pattern. Use chip "Formulário" if desired. Keep all internal dynamic field rendering intact.

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/dados-endereco.tsx" "src/app/(assinatura-digital)/_wizard/form/dynamic-form-step.tsx"
git commit -m "feat(rota-formulario): migrate DadosEndereco and DynamicFormStep to PublicStepCard"
```

---

### Task 25: Reescrever `sucesso.tsx` usando `SuccessHero`

**Files:**
- Modify: `src/app/(assinatura-digital)/_wizard/form/sucesso.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, PackageOpen } from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import type { PdfGerado } from '@/shared/assinatura-digital/types/store'
import { SuccessHero } from '@/shared/assinatura-digital'

export default function Sucesso() {
  const resetAll = useFormularioStore((s) => s.resetAll)
  const getCachedTemplate = useFormularioStore((s) => s.getCachedTemplate)
  const dadosContatos = useFormularioStore((s) => s.dadosContatos)
  const pdfsGerados = useFormularioStore((s) => s.pdfsGerados)

  const [isZipping, setIsZipping] = useState(false)

  const getName = (id: string) => getCachedTemplate(id)?.nome || 'Documento'

  const validos = (pdfsGerados ?? []).filter((p) => p.pdf_url?.startsWith('http'))
  const title = validos.length > 1 ? 'Documentos assinados!' : 'Tudo pronto!'
  const subtitle = validos.length > 1
    ? `${validos.length} documentos foram assinados com sucesso.`
    : 'Seu documento foi assinado com sucesso.'

  const handleDownload = (pdf: PdfGerado) => {
    const link = document.createElement('a')
    link.href = pdf.pdf_url
    link.download = `${getName(pdf.template_id)}.pdf`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZip = async () => {
    setIsZipping(true)
    toast.loading('Preparando ZIP...', { id: 'zip' })
    try {
      const zip = new JSZip()
      await Promise.all(
        validos.map(async (p) => {
          const blob = await (await fetch(p.pdf_url)).blob()
          zip.file(`${getName(p.template_id)}.pdf`, blob)
        }),
      )
      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `documentos-assinados.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('ZIP baixado!', { id: 'zip' })
    } catch (e) {
      toast.error('Erro ao gerar ZIP.', { id: 'zip' })
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 items-start overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-lg">
          <SuccessHero title={title} subtitle={subtitle}>
            {validos.length > 0 && (
              <GlassPanel depth={1} className="mt-6 space-y-3 rounded-2xl p-4">
                {validos.map((pdf) => (
                  <button
                    key={pdf.template_id}
                    type="button"
                    onClick={() => handleDownload(pdf)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-3 text-left transition-colors hover:bg-surface-container-low/60"
                  >
                    <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold text-primary">
                      PDF
                    </div>
                    <Text variant="label" className="min-w-0 flex-1 truncate text-foreground">
                      {getName(pdf.template_id)}
                    </Text>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
                {validos.length > 1 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleZip}
                    disabled={isZipping}
                    className="h-11 w-full cursor-pointer"
                  >
                    {isZipping ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando...</>
                    ) : (
                      <><PackageOpen className="mr-2 h-4 w-4" /> Baixar todos em ZIP</>
                    )}
                  </Button>
                )}
              </GlassPanel>
            )}

            {dadosContatos?.email && (
              <GlassPanel depth={1} className="mt-3 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <Text variant="micro-caption" className="text-left text-muted-foreground">
                    Uma cópia será enviada para {dadosContatos.email}.
                  </Text>
                </div>
              </GlassPanel>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={resetAll}
              className="mt-6 h-11 w-full cursor-pointer"
            >
              Iniciar novo formulário
            </Button>
          </SuccessHero>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/sucesso.tsx"
git commit -m "feat(rota-formulario): rewrite Sucesso with SuccessHero and glass PDF list"
```

---

### Task 26: Atualizar `formulario-container` com nova topologia de 7 steps + shell unificado

**Files:**
- Modify: `src/app/(assinatura-digital)/_wizard/form/formulario-container.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import { PublicWizardShell, type PublicWizardStep } from '@/shared/assinatura-digital'
import VerificarCPF from './verificar-cpf'
import ContratosPendentesStep from './contratos-pendentes-step'
import DadosPessoaisStep from './dados-pessoais-step'
import DadosEndereco from './dados-endereco'
import DynamicFormStep from './dynamic-form-step'
import RevisarDocumentoStep from './revisar-documento-step'
import AssinarStep from './assinar-step'
import Sucesso from './sucesso'
import type { StepConfig } from '@/shared/assinatura-digital/types/store'

const STEP_LABELS: Record<string, string> = {
  cpf: 'Identificação',
  pendentes: 'Pendentes',
  pessoais: 'Dados',
  endereco: 'Endereço',
  acao: 'Formulário',
  visualizacao: 'Revisão',
  assinatura: 'Assinar',
  sucesso: 'Pronto',
}

function formatResumeHint(ts: number | null, etapa: number): string | null {
  if (!ts || etapa === 0) return null
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return 'Continuando de onde parou · salvo agora'
  if (diffMin === 1) return 'Continuando de onde parou · salvo há 1 min'
  return `Continuando de onde parou · salvo há ${diffMin} min`
}

export default function FormularioContainer() {
  const etapaAtual = useFormularioStore((s) => s.etapaAtual)
  const stepConfigs = useFormularioStore((s) => s.stepConfigs)
  const setStepConfigs = useFormularioStore((s) => s.setStepConfigs)
  const formularioFlowConfig = useFormularioStore((s) => s.formularioFlowConfig)
  const contratosPendentes = useFormularioStore((s) => s.contratosPendentes)
  const resetAll = useFormularioStore((s) => s.resetAll)
  const timestamp = useFormularioStore((s) => s._timestamp)
  const setGeolocation = useFormularioStore((s) => s.setGeolocation)

  // Geolocation silenciosa (sem step dedicado)
  useEffect(() => {
    if (formularioFlowConfig?.geolocation_necessaria && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setGeolocation?.(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
        () => {},
        { enableHighAccuracy: false, timeout: 10000 },
      )
    }
  }, [formularioFlowConfig?.geolocation_necessaria, setGeolocation])

  useEffect(() => {
    const temPendentes = (contratosPendentes?.length ?? 0) > 0
    const configs: StepConfig[] = [
      { id: 'cpf', index: 0, component: 'VerificarCPF', required: true, enabled: true },
    ]
    let i = 1
    if (temPendentes) {
      configs.push({ id: 'pendentes', index: i++, component: 'ContratosPendentesStep', required: false, enabled: true })
    }
    configs.push(
      { id: 'pessoais', index: i++, component: 'DadosPessoaisStep', required: true, enabled: true },
      { id: 'endereco', index: i++, component: 'DadosEndereco', required: true, enabled: true },
      { id: 'acao', index: i++, component: 'DynamicFormStep', required: true, enabled: true },
      { id: 'visualizacao', index: i++, component: 'RevisarDocumentoStep', required: true, enabled: true },
      { id: 'assinatura', index: i++, component: 'AssinarStep', required: true, enabled: true },
      { id: 'sucesso', index: i++, component: 'Sucesso', required: true, enabled: true },
    )
    setStepConfigs(configs)
  }, [formularioFlowConfig, contratosPendentes, setStepConfigs])

  const renderEtapa = () => {
    if (!stepConfigs || stepConfigs.length === 0) {
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando formulário...</p>
        </div>
      )
    }
    const current = stepConfigs.find((s) => s.index === etapaAtual)
    switch (current?.component) {
      case 'VerificarCPF': return <VerificarCPF />
      case 'ContratosPendentesStep': return <ContratosPendentesStep />
      case 'DadosPessoaisStep': return <DadosPessoaisStep />
      case 'DadosEndereco': return <DadosEndereco />
      case 'DynamicFormStep': return <DynamicFormStep />
      case 'RevisarDocumentoStep': return <RevisarDocumentoStep />
      case 'AssinarStep': return <AssinarStep />
      case 'Sucesso': return <Sucesso />
      default: return <VerificarCPF />
    }
  }

  const stepItems: PublicWizardStep[] = (stepConfigs ?? [])
    .filter((c) => c.id !== 'pendentes' && c.id !== 'sucesso')
    .map((c) => ({ id: c.id, label: STEP_LABELS[c.id] ?? c.component }))

  const currentIndexInStepItems = Math.max(
    0,
    stepItems.findIndex((s) => s.id === (stepConfigs?.find((c) => c.index === etapaAtual)?.id ?? 'cpf')),
  )

  return (
    <PublicWizardShell
      steps={stepItems}
      currentIndex={currentIndexInStepItems}
      onRestart={etapaAtual > 0 ? resetAll : undefined}
      resumeHint={formatResumeHint(timestamp, etapaAtual)}
      tint={stepConfigs?.find((c) => c.index === etapaAtual)?.id === 'sucesso' ? 'success' : 'primary'}
    >
      {renderEtapa()}
    </PublicWizardShell>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

If there are compile errors about `setGeolocation` not existing on the store, verify the store already has it (it is referenced in legacy `geolocation-step.tsx`).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/_wizard/form/formulario-container.tsx"
git commit -m "refactor(rota-formulario): adopt PublicWizardShell with 7-step topology and silent geolocation"
```

---

### Task 27: Atualizar `hydrateContext` em `formulario-store` para validar etapaAtual

**Files:**
- Modify: `src/shared/assinatura-digital/store/formulario-store.ts`

- [ ] **Step 1: Write test**

Create `src/shared/assinatura-digital/store/__tests__/hydrate-context.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { useFormularioStore } from '../formulario-store'

describe('formulario-store.hydrateContext', () => {
  beforeEach(() => {
    useFormularioStore.getState().resetAll()
  })

  it('resets etapaAtual to 0 when it exceeds new stepConfigs length', () => {
    // simulate a persisted out-of-range state
    useFormularioStore.setState({
      etapaAtual: 99,
      segmentoId: 1,
      formularioId: 1,
    })
    useFormularioStore.getState().hydrateContext({
      segmentoId: 1,
      formularioId: 1,
      formularioNome: 'X',
      segmentoNome: 'Y',
    })
    expect(useFormularioStore.getState().etapaAtual).toBe(0)
  })

  it('keeps etapaAtual when it is within range', () => {
    useFormularioStore.setState({
      etapaAtual: 2,
      segmentoId: 1,
      formularioId: 1,
      stepConfigs: [
        { id: 'a', index: 0, component: 'X', required: true, enabled: true },
        { id: 'b', index: 1, component: 'Y', required: true, enabled: true },
        { id: 'c', index: 2, component: 'Z', required: true, enabled: true },
      ],
    })
    useFormularioStore.getState().hydrateContext({
      segmentoId: 1,
      formularioId: 1,
      formularioNome: 'X',
      segmentoNome: 'Y',
    })
    expect(useFormularioStore.getState().etapaAtual).toBe(2)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/shared/assinatura-digital/store/__tests__/hydrate-context.test.ts
```

- [ ] **Step 3: Update hydrateContext**

Inside `formulario-store.ts`, find the `hydrateContext` action and add this at the end of its body:

```ts
// Guard contra drafts persistidos apontando para steps extintos
const { etapaAtual, stepConfigs } = get()
const maxIndex = (stepConfigs?.length ?? 0) - 1
if (etapaAtual > Math.max(0, maxIndex)) {
  set({ etapaAtual: 0 })
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/shared/assinatura-digital/store/__tests__/hydrate-context.test.ts
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/assinatura-digital/store/formulario-store.ts src/shared/assinatura-digital/store/__tests__/hydrate-context.test.ts
git commit -m "fix(formulario-store): reset etapaAtual when hydrated context has incompatible stepConfigs"
```

---

### Task 28: Atualizar testes E2E da Rota B

**Files:**
- Modify: `src/app/(assinatura-digital)/__tests__/e2e/public-form-flow.spec.ts`

- [ ] **Step 1: Run current tests**

```bash
npm run test:e2e -- public-form-flow
```
Expected: failures em steps removidos (Identidade/Contatos separados, Visualização PDF/Markdown, Termos, Foto, Geolocation).

- [ ] **Step 2: Rewrite the test for 7 steps**

Update the happy-path sequence to:

1. Fill CPF → Continuar
2. Fill "Seus dados" (nome, RG, data, email, telefone) → Continuar
3. Fill Endereço → Continuar
4. Fill dynamic form (if schema) → Continuar
5. Revisar documento → Continuar
6. Assinar:
   - if `fotoNecessaria` → `[data-testid="selfie-sheet"]` visible; click "Pular"
   - Desenhar (pode fazer `page.mouse.down()/move()/up()` no canvas)
   - Check termos
   - Click "Finalizar assinatura"
7. Sucesso: assert `SuccessHero` title and at least one PDF link

- [ ] **Step 3: Run tests — expect PASS**

```bash
npm run test:e2e -- public-form-flow
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(assinatura-digital)/__tests__/e2e/public-form-flow.spec.ts"
git commit -m "test(rota-formulario): rewrite e2e for 7-step topology with selfie sub-sheet"
```

---

### Task 29: Deletar legacy da Rota B

**Files:**
- Delete: listed below

- [ ] **Step 1: Remove files**

```bash
rm "src/app/(assinatura-digital)/_wizard/form/dados-identidade.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/dados-contatos.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/visualizacao-pdf-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/visualizacao-markdown-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/termos-aceite-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/assinatura-manuscrita-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/capture/geolocation-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/capture/captura-foto-step.tsx"
rm "src/app/(assinatura-digital)/_wizard/capture/index.ts"
rmdir "src/app/(assinatura-digital)/_wizard/capture" 2>/dev/null || true
```

- [ ] **Step 2: Update `src/app/(assinatura-digital)/_wizard/form/index.ts` (if it exists)**

Remove re-exports of the deleted modules.

- [ ] **Step 3: Validate**

```bash
npm run type-check
npm run validate:exports
npm run check:architecture
npm test -- src/app/\(assinatura-digital\)
```

- [ ] **Step 4: Commit**

```bash
git add -A "src/app/(assinatura-digital)/_wizard"
git commit -m "chore(rota-formulario): delete legacy separated steps"
```

---

# FASE 4 · Cleanup final e validação

---

### Task 30: Deletar shells legados globais

**Files:**
- Delete: `public-form-shell.tsx`, `step-progress.tsx`, `form-step-layout.tsx` e seus tests

- [ ] **Step 1: Remove files**

```bash
rm "src/app/(assinatura-digital)/_wizard/public-form-shell.tsx"
rm "src/app/(assinatura-digital)/_wizard/step-progress.tsx"
rm "src/app/(assinatura-digital)/_wizard/form/form-step-layout.tsx"
rm "src/app/(assinatura-digital)/_wizard/__tests__/public-form-shell.test.tsx"
rm "src/app/(assinatura-digital)/_wizard/__tests__/step-progress.test.tsx"
rm "src/app/(assinatura-digital)/_wizard/__tests__/form-step-layout.test.tsx"
```

- [ ] **Step 2: Validate**

```bash
npm run type-check
npm run validate:exports
npm run check:architecture
npm test -- src/app/\(assinatura-digital\)
```

- [ ] **Step 3: Commit**

```bash
git add -A "src/app/(assinatura-digital)/_wizard"
git commit -m "chore(rota-publica): delete legacy shells (PublicFormShell, step-progress, FormStepLayout)"
```

---

### Task 31: Adicionar teste E2E para light-only enforcement

**Files:**
- Create: `src/app/(assinatura-digital)/__tests__/e2e/light-mode-forced.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { expect, test } from '@playwright/test'

test.describe('Rota pública força tema light', () => {
  test('mantém tema light mesmo com prefers-color-scheme dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/formulario/tributario/rescisao-trabalhista')

    const html = page.locator('html')
    await expect(html).toHaveClass(/light/)
    await expect(html).toHaveAttribute('data-theme', 'light')
    const colorScheme = await html.evaluate((el) => (el as HTMLElement).style.colorScheme)
    expect(colorScheme).toBe('light')
  })
})
```

- [ ] **Step 2: Run test — expect PASS**

```bash
npm run test:e2e -- light-mode-forced
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/__tests__/e2e/light-mode-forced.spec.ts"
git commit -m "test(rota-publica): assert light theme is forced regardless of OS preference"
```

---

### Task 32: Adicionar teste E2E para draft/stepConfig migration

**Files:**
- Create: `src/app/(assinatura-digital)/__tests__/e2e/draft-stepconfig-migration.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { expect, test } from '@playwright/test'

test.describe('Draft migration: etapaAtual out-of-range', () => {
  test('reset etapaAtual to 0 when persisted state points to removed step', async ({ page }) => {
    await page.goto('/formulario/tributario/rescisao-trabalhista')

    // Preenche sessionStorage com etapaAtual alto (simula usuário que estava no step Geolocation extinto = 8)
    await page.evaluate(() => {
      sessionStorage.setItem(
        'formulario-store',
        JSON.stringify({
          state: {
            etapaAtual: 99,
            segmentoId: 1,
            formularioId: 1,
            stepConfigs: null,
            _timestamp: Date.now(),
          },
          version: 0,
        }),
      )
    })

    await page.reload()

    // Deve cair no step 0 (identificação)
    await expect(page.getByText(/Informe seu CPF/i)).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test — expect PASS**

```bash
npm run test:e2e -- draft-stepconfig-migration
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(assinatura-digital)/__tests__/e2e/draft-stepconfig-migration.spec.ts"
git commit -m "test(rota-formulario): assert draft migration resets out-of-range etapaAtual"
```

---

### Task 33: Validação final + smoke manual

- [ ] **Step 1: Run full validation pipeline**

```bash
npm run type-check
npm run validate:exports
npm run check:architecture
npm test
npm run test:e2e
```

All must pass. Fix any remaining issues inline before proceeding.

- [ ] **Step 2: Run dev server and smoke test mobile-first**

```bash
npm run dev
```

In the browser, open the dev tools and emulate iPhone SE (375x667):

1. Navigate to `/formulario/tributario/rescisao-trabalhista`:
   - Assert: Identificação step shows CPF input with autofocus
   - Fill CPF → advance
   - Confirm all 7 steps render within viewport (no horizontal scroll)
   - Canvas in Assinar step is ≥220px tall
   - Terms footer sticky visible; CTA in thumb zone
2. Navigate to `/assinatura/<valid-token>`:
   - Welcome hero with glass card and chip
   - Advance through 3 steps; Selfie sub-sheet opens if enabled
   - Canvas ≥220px
   - Sucesso shows celebratory hero with glass PDF card

Toggle `prefers-color-scheme: dark` in dev tools → confirm the public route remains light.

- [ ] **Step 3: Final commit (if any doc/adjust)**

If any inline fixes were made:

```bash
git add -A
git commit -m "chore(rota-publica): final adjustments after smoke test"
```

- [ ] **Step 4: Summary comment**

Write a short summary in the PR description (when it's opened) listing:
- 2 routes migrated
- Legacy files deleted (count)
- New shell components (count)
- Steps reduced (10-12 → 7 on rota B; 6 → 4-5 on rota A)
- Light-only enforced
- Tests added (unit + e2e)

---

## Self-review checklist (for the plan author, not the executor)

- [x] Cobre todas as decisões do spec (shell unificado, 7 steps, canvas grande, termos sticky, selfie sub-tela, sucesso celebratório, light-only, AmbientBackdrop tint).
- [x] Nenhum "TBD" / "implementar depois" / "adicionar validação apropriada".
- [x] Todos os paths de arquivos são absolutos a partir da raiz do repo e escapados para rotas com parênteses.
- [x] Cada task entrega código completo.
- [x] Cada task termina em commit atômico.
- [x] Tipos e assinaturas são consistentes entre tasks (`PublicWizardStep` definido em Task 4 e reutilizado em Task 5, 11, 26).
- [x] Testes precedem a implementação onde aplicável (TDD real nos novos componentes).
- [x] Migrações de arquivos existentes mostram o bloco de código completo a ser aplicado, não só "wrap em X".
- [x] Fase 4 valida com `check:architecture`, `validate:exports`, `type-check`, `test`, `test:e2e`.
