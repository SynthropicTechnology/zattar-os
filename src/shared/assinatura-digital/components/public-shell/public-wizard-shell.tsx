'use client'

import type { ReactNode } from 'react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { SkipLink } from '@/components/shared/skip-link'
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
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-surface-dim">
      <SkipLink />
      <AmbientBackdrop blurIntensity={55} tint={tint} />

      <PublicWizardHeader />

      <div className="relative z-10 flex min-h-0 flex-1">
        {hasSteps && (
          <aside
            aria-label="Progresso do formulário"
            className="relative z-10 hidden w-72 shrink-0 flex-col border-r border-outline-variant/20 bg-surface-container-lowest/50 px-8 py-10 backdrop-blur-xl lg:flex"
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
          id="main-content"
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
