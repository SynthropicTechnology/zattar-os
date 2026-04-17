'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

/**
 * Seletor CSS que identifica o primeiro elemento interativo focável.
 * Exclui elementos disabled, readonly-e-hidden, e tabindex negativo.
 */
const FIRST_FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled]):not([aria-hidden="true"])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
]
  .map((s) => `${s}:not([aria-hidden="true"])`)
  .join(', ')

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
  const titleId = useId()
  const descriptionId = useId()
  const contentRef = useRef<HTMLDivElement>(null)

  // Focus management: ao montar, foca no primeiro input interativo do step.
  // Se não houver input, foca no heading (útil pra telas de sucesso/info).
  // Usa preventScroll para não saltar a viewport sob o teclado em mobile.
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const firstFocusable =
        contentRef.current?.querySelector<HTMLElement>(FIRST_FOCUSABLE_SELECTOR)
      if (firstFocusable) {
        firstFocusable.focus({ preventScroll: true })
        return
      }
      // Fallback: foca no heading (identificado por id único)
      const heading = document.getElementById(titleId) as HTMLHeadingElement | null
      heading?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(rafId)
    // title muda entre steps — serve como trigger pra re-focar
  }, [title, titleId])

  return (
    <GlassPanel
      depth={1}
      className={cn('flex h-full min-h-0 flex-col gap-4 p-6 sm:p-8', className)}
    >
      <section
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="contents"
      >
        <header className="space-y-2">
          {chip && (
            <div
              role="status"
              aria-label={`Progresso: ${chip}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1',
                tone.bg,
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', tone.dot)}
              />
              <Text variant="overline" className={tone.text}>
                {chip}
              </Text>
            </div>
          )}
          <Heading
            id={titleId}
            tabIndex={-1}
            level="page"
            className="font-display tracking-tight text-2xl sm:text-3xl outline-none"
          >
            {title}
          </Heading>
          {description && (
            <Text
              id={descriptionId}
              variant="caption"
              className="text-muted-foreground"
            >
              {description}
            </Text>
          )}
        </header>
        <div
          ref={contentRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 -mr-1"
        >
          {children}
        </div>
      </section>
    </GlassPanel>
  )
}
