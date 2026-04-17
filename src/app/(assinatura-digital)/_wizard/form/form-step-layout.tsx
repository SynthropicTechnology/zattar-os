'use client'

import { ReactNode } from 'react'
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
}

/**
 * Shell de step do wizard público — usa PublicStepCard + PublicStepFooter
 * para visual Glass Briefing unificado, com chip "Etapa N de M" automático
 * via useWizardProgress.
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
}: FormStepLayoutProps) {
  const progress = useWizardProgress()
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
