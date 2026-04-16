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
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface-dim">
      <AmbientBackdrop blurIntensity={55} tint={tint} />

      <PublicWizardHeader />

      <div className="relative z-10 flex min-h-0 flex-1">
        {hasSteps && (
          <aside
            aria-label="Progresso do formulário"
            className="relative z-10 hidden w-64 shrink-0 flex-col bg-surface-container-lowest/50 px-6 py-8 backdrop-blur-xl shadow-[1px_0_0_0_color-mix(in_oklch,var(--outline-variant)_25%,transparent),4px_0_32px_-8px_color-mix(in_oklch,black_5%,transparent)] dark:shadow-[1px_0_0_0_color-mix(in_oklch,var(--outline-variant)_30%,transparent),4px_0_32px_-8px_color-mix(in_oklch,black_50%,transparent)] lg:flex"
          >
            <PublicWizardProgress.Vertical
              steps={steps}
              currentIndex={currentIndex}
              onRestart={onRestart}
              resumeHint={resumeHint}
            />
          </aside>
        )}

        <main
          className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden"
          aria-label="Formulário de assinatura digital"
        >
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
