'use client'

import { ReactNode } from 'react'
import { PublicStepCard } from '@/shared/assinatura-digital/components/public-shell'
import { useWizardProgress } from '@/shared/assinatura-digital/hooks/use-wizard-progress'
import { useFormularioStore } from '@/shared/assinatura-digital/store'

interface FormStepLayoutProps {
  title: string
  description?: string
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextDisabled?: boolean
  isPreviousDisabled?: boolean
  isLoading?: boolean
  children: ReactNode
  hidePrevious?: boolean
  hideNext?: boolean
  /** ID de formulário HTML para submit via botão externo */
  formId?: string
}

/**
 * Shell de step do wizard público — wrapper fino sobre PublicStepCard.
 * Deriva progresso/label do store via useWizardProgress e expõe um onRestart
 * automático a partir do segundo step visível.
 */
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
  children,
  hidePrevious = false,
  hideNext = false,
  formId,
}: FormStepLayoutProps) {
  const progress = useWizardProgress()
  const resetAll = useFormularioStore((state) => state.resetAll)

  const showRestart =
    progress.isVisibleInProgress && progress.currentStep > 1
  const onRestart = showRestart ? resetAll : undefined

  return (
    <PublicStepCard
      title={title}
      description={description}
      currentStep={progress.isVisibleInProgress ? progress.currentStep : undefined}
      totalSteps={progress.isVisibleInProgress ? progress.totalSteps : undefined}
      stepLabel={progress.currentLabel ?? undefined}
      onRestart={onRestart}
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
    >
      {children}
    </PublicStepCard>
  )
}
