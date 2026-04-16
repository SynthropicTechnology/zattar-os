'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface FormStepLayoutProps {
  title: string
  description?: string
  /** Número legível da etapa atual (1-based). Opcional — shell exibe progresso. */
  currentStep?: number
  /** Total de etapas legíveis. Opcional — shell exibe progresso. */
  totalSteps?: number
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  /** Classe adicional aplicada ao GlassPanel externo */
  cardClassName?: string
  children: ReactNode
  hidePrevious?: boolean
  hideNext?: boolean
  /** ID de formulário HTML para submit via botão externo */
  formId?: string
  /** Contexto de uso: 'public' aplica estrutura viewport-fit; 'internal' preserva layout simples. */
  context?: 'public' | 'internal'
}

export default function FormStepLayout({
  title,
  description,
  onPrevious,
  onNext,
  nextLabel = 'Continuar',
  previousLabel = 'Voltar',
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  cardClassName,
  children,
  hidePrevious = false,
  hideNext = false,
  formId,
  context = 'public',
}: FormStepLayoutProps) {
  const nextButtonType = formId ? 'submit' : 'button'
  const nextButtonForm = formId ?? undefined
  const handleNextClick = formId ? undefined : onNext

  const previousButton = !hidePrevious ? (
    <Button
      type="button"
      variant="outline"
      onClick={onPrevious}
      disabled={isPreviousDisabled || isLoading}
      className="h-12 min-w-28 active:scale-95"
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      {previousLabel}
    </Button>
  ) : null

  const nextButton = !hideNext ? (
    <Button
      type={nextButtonType}
      form={nextButtonForm}
      onClick={handleNextClick}
      disabled={isNextDisabled || isLoading}
      className="h-12 min-w-40 active:scale-95"
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
  ) : null

  if (context === 'internal') {
    return (
      <GlassPanel depth={1} className={cn('w-full', cardClassName)}>
        <div className="space-y-2 border-b border-border/20 p-6">
          <Heading level="page" className="text-xl">
            {title}
          </Heading>
          {description && (
            <Text variant="caption" className="text-muted-foreground">
              {description}
            </Text>
          )}
        </div>
        <div className="p-6">{children}</div>
        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border/20 p-6 sm:flex-row sm:items-center sm:justify-between">
          {previousButton ?? <div className="hidden sm:block" />}
          {nextButton}
        </div>
      </GlassPanel>
    )
  }

  // Public context — viewport-fit com ScrollArea interna
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', cardClassName)}>
      {/* Header */}
      <header className="shrink-0 px-4 pb-4 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          <Heading level="page" className="text-2xl sm:text-3xl">
            {title}
          </Heading>
          {description && (
            <Text variant="caption" className="text-muted-foreground">
              {description}
            </Text>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 pb-8 sm:px-8 lg:px-12">
          {children}
        </div>
      </ScrollArea>

      {/* Sticky footer */}
      <footer className="shrink-0 border-t border-border/20 bg-background/60 backdrop-blur-xl">
        <div
          className={cn(
            'mx-auto flex w-full max-w-3xl items-stretch gap-3 px-4 py-4 sm:items-center sm:px-8 lg:px-12',
            !previousButton ? 'justify-end' : 'justify-between',
          )}
        >
          {previousButton}
          <div className="flex-1 sm:flex-initial">
            {nextButton && (
              <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
                {nextButton}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
