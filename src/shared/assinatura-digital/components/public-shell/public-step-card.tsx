'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Seletor CSS que identifica o primeiro elemento interativo focável.
 * Exclui elementos disabled, hidden, readonly, aria-hidden ou tabindex negativo.
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

type ChipTone = 'primary' | 'success' | 'info'

const CHIP_TONE_CLASSES: Record<ChipTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
}

const CHIP_DOT_CLASSES: Record<ChipTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
}

interface PublicStepCardProps {
  /** Título do step */
  title: string
  /** Descrição curta abaixo do título */
  description?: string

  /** Progresso — número 1-based do step atual */
  currentStep?: number
  /** Total de steps visíveis */
  totalSteps?: number
  /** Label curto do step atual (ex: 'CPF', 'Dados', 'Contato') */
  stepLabel?: string
  /** Callback pra recomeçar — exibe ícone ao lado do label quando presente */
  onRestart?: () => void

  /**
   * Chip estático exibido acima do título — usado por fluxos que não têm
   * progresso automático via store (ex: assinatura por token). É ignorado
   * quando `currentStep`/`totalSteps` são fornecidos (a barra toma o lugar).
   */
  chip?: string
  /** Tom do chip. Default: 'primary' */
  chipTone?: ChipTone

  /** Navegação */
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  hidePrevious?: boolean
  hideNext?: boolean
  /** Quando definido, o botão Continuar vira type=submit vinculado a esse form */
  formId?: string

  children: ReactNode
  className?: string
}

export function PublicStepCard({
  title,
  description,
  currentStep,
  totalSteps,
  stepLabel,
  onRestart,
  chip,
  chipTone = 'primary',
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
  children,
  className,
}: PublicStepCardProps) {
  const titleId = useId()
  const descriptionId = useId()
  const contentRef = useRef<HTMLDivElement>(null)

  const hasProgress =
    typeof currentStep === 'number' &&
    typeof totalSteps === 'number' &&
    totalSteps > 0
  const progressPct = hasProgress
    ? Math.min(100, Math.max(0, (currentStep! / totalSteps!) * 100))
    : 0

  const showPrevious = !hidePrevious && !!onPrevious
  const showNext = !hideNext

  // Focus management: ao montar, foca no primeiro input do step.
  // Fallback: heading. Usa preventScroll pra não saltar viewport sob teclado.
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const firstFocusable =
        contentRef.current?.querySelector<HTMLElement>(FIRST_FOCUSABLE_SELECTOR)
      if (firstFocusable) {
        firstFocusable.focus({ preventScroll: true })
        return
      }
      const heading = document.getElementById(titleId) as HTMLHeadingElement | null
      heading?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(rafId)
  }, [title, titleId])

  return (
    <GlassPanel
      depth={1}
      className={cn(
        'flex w-full flex-col overflow-hidden p-0',
        className,
      )}
    >
      {hasProgress && (
        <div className="flex flex-col gap-3 px-6 pt-5 sm:px-8 sm:pt-6">
          <div
            className="h-0.75 w-full overflow-hidden rounded-full bg-outline-variant/30"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={currentStep}
            aria-label="Progresso do formulário"
          >
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_10px_color-mix(in_oklch,var(--primary)_55%,transparent)] transition-[width] duration-420 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <Text
                variant="micro-caption"
                className="font-semibold tracking-[0.02em] text-primary"
              >
                {currentStep} de {totalSteps}
              </Text>
              {stepLabel && (
                <Text
                  variant="micro-caption"
                  className="text-muted-foreground"
                >
                  · {stepLabel}
                </Text>
              )}
            </div>

            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:scale-95"
                aria-label="Recomeçar"
                title="Recomeçar"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <section
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex min-h-0 flex-1 flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6"
      >
        <header className="flex flex-col gap-2">
          {!hasProgress && chip && (
            <span
              role="status"
              aria-label={chip}
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
            </span>
          )}
          <Heading
            id={titleId}
            tabIndex={-1}
            level="page"
            className="text-[22px] leading-tight tracking-tight outline-none sm:text-[26px]"
          >
            {title}
          </Heading>
          {description && (
            <Text
              id={descriptionId}
              variant="caption"
              className="text-muted-foreground text-[14.5px] leading-relaxed"
            >
              {description}
            </Text>
          )}
        </header>

        <div
          ref={contentRef}
          className="scrollbar-glass -mr-2 flex min-h-0 flex-1 flex-col overflow-y-auto pr-2"
        >
          {children}
        </div>
      </section>

      {(showPrevious || showNext) && (
        <footer
          className="flex shrink-0 items-stretch gap-2.5 border-t border-outline-variant/25 bg-surface-container-lowest/50 px-6 py-4 sm:items-center sm:px-8 sm:py-5"
          style={{ paddingBottom: 'max(16px, env(keyboard-inset-height, 0px))' }}
        >
          {showPrevious && (
            <Button
              type="button"
              variant="glass-outline"
              onClick={onPrevious}
              disabled={isPreviousDisabled || isLoading}
              className="h-11 cursor-pointer gap-1 sm:min-w-28"
            >
              <ChevronLeft className="h-4 w-4" />
              {previousLabel}
            </Button>
          )}
          {showNext && (
            <Button
              type={formId ? 'submit' : 'button'}
              form={formId}
              onClick={formId ? undefined : onNext}
              disabled={isNextDisabled || isLoading}
              className="h-11 flex-1 cursor-pointer gap-1.5 transition-colors active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {nextLabel}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </footer>
      )}
    </GlassPanel>
  )
}
