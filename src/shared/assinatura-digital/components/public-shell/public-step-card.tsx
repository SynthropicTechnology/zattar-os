'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

/**
 * Seletor CSS que identifica o primeiro elemento interativo focável.
 * Exclui elementos disabled, hidden, readonly, aria-hidden ou tabindex negativo.
 *
 * `:not([tabindex="-1"])` é repetido em cada seletor base — sem isso, o
 * filtro só vale pra `[tabindex]` genérico e deixa passar `<input tabindex="-1">`.
 */
const FIRST_FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled]):not([readonly])',
  'button:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
]
  .map((s) => `${s}:not([tabindex="-1"]):not([aria-hidden="true"])`)
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

const CHIP_TONE_CLASSES: Record<NonNullable<PublicStepCardProps['chipTone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
}

const CHIP_DOT_CLASSES: Record<NonNullable<PublicStepCardProps['chipTone']>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
}

export function PublicStepCard({
  title,
  description,
  chip,
  chipTone = 'primary',
  children,
  className,
}: PublicStepCardProps) {
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
      className={cn('flex h-full min-h-0 flex-col gap-8 p-8 sm:p-10', className)}
    >
      <section
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="contents"
      >
        <header className="flex flex-col gap-4">
          {chip && (
            <div
              role="status"
              aria-label={`Progresso: ${chip}`}
              className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1',
                CHIP_TONE_CLASSES[chipTone],
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', CHIP_DOT_CLASSES[chipTone])}
              />
              <Text variant="overline" className="text-current">
                {chip}
              </Text>
            </div>
          )}
          <Heading
            id={titleId}
            tabIndex={-1}
            level="page"
            className="text-[28px] sm:text-[32px] leading-tight tracking-tight outline-none"
          >
            {title}
          </Heading>
          {description && (
            <Text
              id={descriptionId}
              variant="caption"
              className="text-muted-foreground text-base"
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
