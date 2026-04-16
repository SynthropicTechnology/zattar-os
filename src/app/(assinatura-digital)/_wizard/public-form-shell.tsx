'use client'

import type { ReactNode } from 'react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { BrandMark } from '@/components/shared/brand-mark'
import { StepProgress, type StepProgressItem } from './step-progress'

interface PublicFormShellProps {
  steps: StepProgressItem[]
  currentIndex: number
  onRestart?: () => void
  resumeHint?: string | null
  children: ReactNode
}

export function PublicFormShell({
  steps,
  currentIndex,
  onRestart,
  resumeHint,
  children,
}: PublicFormShellProps) {
  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background">
      <AmbientBackdrop blurIntensity={25} />

      {/* Desktop aside (lg+) */}
      <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-border/20 bg-background/40 px-6 py-8 backdrop-blur-xl lg:flex">
        <div className="mb-10">
          <BrandMark />
        </div>
        <StepProgress.Vertical
          steps={steps}
          currentIndex={currentIndex}
          onRestart={onRestart}
          resumeHint={resumeHint}
        />
      </aside>

      {/* Main column */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Mobile header (<lg) */}
        <header className="shrink-0 border-b border-border/20 bg-background/60 backdrop-blur-xl lg:hidden">
          <StepProgress.Horizontal
            steps={steps}
            currentIndex={currentIndex}
            onRestart={onRestart}
            resumeHint={resumeHint}
          />
        </header>

        {/* Step content area */}
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  )
}
