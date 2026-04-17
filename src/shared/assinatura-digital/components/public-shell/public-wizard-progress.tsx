'use client'

import { Check, Clock, ListChecks, RotateCcw } from 'lucide-react'
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
  const total = steps.length
  const currentDisplay = Math.min(currentIndex + 1, total)

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            <Text variant="overline" className="text-muted-foreground">
              Progresso
            </Text>
          </div>
          <div className="flex items-baseline gap-1.5">
            <Text variant="kpi-value" className="text-foreground">
              {currentDisplay}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              de {total}
            </Text>
          </div>
        </div>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:scale-95 cursor-pointer"
            aria-label="Recomeçar"
            title="Recomeçar"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <ol className="relative flex flex-1 flex-col gap-4">
        {steps.map((step, index) => {
          const isPast = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex
          const isLast = index === steps.length - 1
          return (
            <li key={step.id} className="relative flex items-center gap-3">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-3.75 top-9 h-[calc(100%-8px)] w-px transition-colors',
                    isPast ? 'bg-primary/40' : 'bg-outline-variant/30',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isPast && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/12',
                  isFuture && 'border-outline-variant/60 bg-surface-container-lowest/40 text-muted-foreground/70 backdrop-blur-sm',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isPast ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </span>
              <Text
                variant="label"
                className={cn(
                  'truncate transition-colors',
                  isCurrent && 'text-foreground',
                  isPast && 'text-foreground/80 font-normal',
                  isFuture && 'text-muted-foreground/60 font-normal',
                )}
              >
                {step.label}
              </Text>
            </li>
          )
        })}
      </ol>

      {resumeHint && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-start gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 px-3 py-2.5 backdrop-blur-sm"
        >
          <Clock
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
          />
          <Text variant="caption" className="text-foreground/70 leading-snug">
            {resumeHint}
          </Text>
        </div>
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
          <Text variant="micro-caption" className="shrink-0 text-primary font-semibold">
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
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-95 cursor-pointer"
            aria-label="Recomeçar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-outline-variant/30"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_50%,transparent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {resumeHint && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-1.5 pt-0.5"
        >
          <Clock aria-hidden="true" className="h-3 w-3 text-success" />
          <Text variant="micro-caption" className="text-foreground/60">
            {resumeHint}
          </Text>
        </div>
      )}
    </div>
  )
}

export const PublicWizardProgress = { Vertical, Horizontal }
