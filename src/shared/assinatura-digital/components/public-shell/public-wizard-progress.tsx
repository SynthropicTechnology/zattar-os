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
