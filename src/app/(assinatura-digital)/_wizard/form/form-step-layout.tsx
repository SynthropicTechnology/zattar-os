'use client'

import { ReactNode } from 'react'
import { GlassPanel } from '@/components/shared/glass-panel'
import { Heading, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PublicStepCard,
  PublicStepFooter,
} from '@/shared/assinatura-digital/components/public-shell'
import { useWizardProgress } from '@/shared/assinatura-digital/hooks/use-wizard-progress'

interface FormStepLayoutProps {
  title: string
  description?: string
  /** Número legível da etapa atual (1-based). Opcional — por default, deriva do store. */
  currentStep?: number
  /** Total de etapas legíveis. Opcional — por default, deriva do store. */
  totalSteps?: number
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  /** Classe adicional aplicada ao card externo */
  cardClassName?: string
  children: ReactNode
  hidePrevious?: boolean
  hideNext?: boolean
  /** ID de formulário HTML para submit via botão externo */
  formId?: string
  /** Contexto de uso: 'public' aplica estrutura viewport-fit; 'internal' preserva layout simples. */
  context?: 'public' | 'internal'
}

/**
 * Shell de step do wizard público — usa PublicStepCard + PublicStepFooter por baixo
 * no contexto 'public' (default) para visual Glass Briefing unificado.
 *
 * O contexto 'internal' renderiza em GlassPanel direto (sem viewport-fit) para usos
 * fora do wizard público.
 */
export default function FormStepLayout({
  title,
  description,
  currentStep,
  totalSteps,
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
  const progress = useWizardProgress()

  if (context === 'internal') {
    const nextButtonType = formId ? 'submit' : 'button'
    const handleNextClick = formId ? undefined : onNext

    return (
      <GlassPanel depth={1} className={cn('w-full', cardClassName)}>
        <div className="space-y-2 border-b border-outline-variant/20 p-6">
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
        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-outline-variant/20 p-6 sm:flex-row sm:items-center sm:justify-between">
          {!hidePrevious && onPrevious ? (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isPreviousDisabled || isLoading}
              className="h-12 min-w-28 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {previousLabel}
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}
          {!hideNext && (
            <Button
              type={nextButtonType}
              form={formId}
              onClick={handleNextClick}
              disabled={isNextDisabled || isLoading}
              className="h-12 min-w-40 cursor-pointer active:scale-95"
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
          )}
        </div>
      </GlassPanel>
    )
  }

  // Public: viewport-fit com PublicStepCard + PublicStepFooter
  // Chip derivado automaticamente via useWizardProgress se props explícitos ausentes
  const resolvedCurrent = currentStep ?? progress.currentStep
  const resolvedTotal = totalSteps ?? progress.totalSteps
  const chip =
    resolvedCurrent > 0 && resolvedTotal > 0
      ? `Etapa ${resolvedCurrent} de ${resolvedTotal}`
      : undefined

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 px-6 py-8 sm:px-10 sm:py-10">
        <div
          className={cn(
            'mx-auto flex min-h-0 w-full max-w-2xl flex-1',
            cardClassName,
          )}
        >
          <PublicStepCard title={title} description={description} chip={chip}>
            {children}
          </PublicStepCard>
        </div>
      </div>
      <PublicStepFooter
        onPrevious={onPrevious}
        onNext={onNext}
        nextLabel={nextLabel}
        previousLabel={previousLabel}
        isNextDisabled={isNextDisabled}
        isPreviousDisabled={isPreviousDisabled}
        isLoading={isLoading}
        hidePrevious={hidePrevious}
        hideNext={hideNext}
        formId={formId}
      />
    </div>
  )
}
