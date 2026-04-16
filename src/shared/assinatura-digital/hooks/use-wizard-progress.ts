'use client'

import { useFormularioStore } from '../store/formulario-store'
import {
  STEP_LABELS,
  STEPS_HIDDEN_FROM_PROGRESS,
} from '../constants/step-labels'

export interface WizardProgress {
  /** Índice 1-based do step atual considerando apenas os visíveis na barra. */
  currentStep: number
  /** Total de steps visíveis na barra de progresso. */
  totalSteps: number
  /** Label curto do step atual (ex: "Ação"). */
  currentLabel: string | null
  /** Texto formatado pronto pra chip (ex: "Etapa 5 de 9"). */
  chipLabel: string | null
  /** Se o step atual aparece na barra (false pra pendentes/sucesso). */
  isVisibleInProgress: boolean
}

/**
 * Deriva posição do wizard público a partir do store Zustand.
 * Fonte única pra chip de etapa, sidebar e telemetria.
 */
export function useWizardProgress(): WizardProgress {
  const etapaAtual = useFormularioStore((state) => state.etapaAtual)
  const stepConfigs = useFormularioStore((state) => state.stepConfigs)

  const visibleSteps = (stepConfigs ?? []).filter(
    (c) => !STEPS_HIDDEN_FROM_PROGRESS.includes(c.id),
  )

  const currentConfig = stepConfigs?.find((c) => c.index === etapaAtual)
  const currentId = currentConfig?.id ?? null
  const currentLabel = currentId
    ? STEP_LABELS[currentId] ?? currentConfig?.component ?? null
    : null

  const visibleIndex = currentId
    ? visibleSteps.findIndex((s) => s.id === currentId)
    : -1
  const isVisibleInProgress = visibleIndex >= 0
  const currentStep = isVisibleInProgress ? visibleIndex + 1 : 0
  const totalSteps = visibleSteps.length

  const chipLabel =
    isVisibleInProgress && totalSteps > 0
      ? `Etapa ${currentStep} de ${totalSteps}`
      : null

  return {
    currentStep,
    totalSteps,
    currentLabel,
    chipLabel,
    isVisibleInProgress,
  }
}
