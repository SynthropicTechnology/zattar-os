'use client'

import type { ReactNode } from 'react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { SkipLink } from '@/components/shared/skip-link'
import { BrandMark } from '@/components/shared/brand-mark'

interface PublicWizardShellProps {
  /** Tonalidade do backdrop. Default: 'primary' */
  tint?: 'primary' | 'success'
  children: ReactNode

  /**
   * @deprecated Progresso agora vive dentro de `PublicStepCard` via props
   * `currentStep` / `totalSteps`. Este prop é aceito apenas para compatibilidade
   * transitória com o fluxo `assinatura/[token]` e é silenciosamente ignorado.
   */
  steps?: unknown
  /** @deprecated Ver `steps`. */
  currentIndex?: unknown
  /** @deprecated O botão Recomeçar vive dentro de `PublicStepCard`. */
  onRestart?: unknown
  /** @deprecated Resume hint foi removido do shell. */
  resumeHint?: unknown
}

export function PublicWizardShell({
  tint = 'primary',
  children,
}: PublicWizardShellProps) {
  return (
    <div
      data-wizard-public=""
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-surface-dim px-4 py-6 sm:px-6 sm:py-10"
    >
      <SkipLink />
      <AmbientBackdrop blurIntensity={70} tint={tint} />

      <BrandMark
        variant="auto"
        size="custom"
        priority
        className="relative z-10 mb-1 h-32 w-auto -my-5 sm:mb-2 sm:h-44 sm:-my-7"
      />

      <main
        id="main-content"
        className="relative z-10 flex w-full max-w-130 flex-col"
        aria-label="Formulário de assinatura digital"
      >
        {children}
      </main>
    </div>
  )
}
