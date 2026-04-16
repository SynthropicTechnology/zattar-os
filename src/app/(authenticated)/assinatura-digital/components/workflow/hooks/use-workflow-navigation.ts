'use client';

/**
 * Hook para navegação do workflow de assinatura digital
 *
 * Conecta ao formulario-store e calcula o status de cada etapa.
 * Fluxo de 3 etapas: Upload → Configurar → Revisar
 */

import { useMemo, useCallback } from 'react';
import { useFormularioStore } from '@/shared/assinatura-digital/store/formulario-store';
import type { WorkflowStep, WorkflowNavigationState } from '../types';

/**
 * IDs das etapas do workflow de upload de documentos
 */
export const WORKFLOW_STEP_IDS = {
  UPLOAD: 'upload',
  CONFIGURAR: 'configurar',
  REVISAR: 'revisar',
} as const;

/**
 * Configuração padrão de 3 etapas (Upload → Configurar → Revisar)
 */
const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: WORKFLOW_STEP_IDS.UPLOAD, index: 0, label: 'Upload', status: 'pending' },
  { id: WORKFLOW_STEP_IDS.CONFIGURAR, index: 1, label: 'Configurar', status: 'pending' },
  { id: WORKFLOW_STEP_IDS.REVISAR, index: 2, label: 'Revisar', status: 'pending' },
];

/**
 * Mapeamento de IDs de etapas para labels amigáveis
 */
const STEP_LABELS: Record<string, string> = {
  [WORKFLOW_STEP_IDS.UPLOAD]: 'Upload',
  [WORKFLOW_STEP_IDS.CONFIGURAR]: 'Configurar',
  [WORKFLOW_STEP_IDS.REVISAR]: 'Revisar',
};

/**
 * Número padrão de etapas no fluxo de upload
 */
const DEFAULT_TOTAL_STEPS = 3;

/**
 * Hook que gerencia a navegação do workflow de assinatura
 *
 * @returns Estado da navegação com steps, métodos de navegação e progresso
 *
 * @example
 * ```tsx
 * const { steps, currentStep, goToStep, progressPercentage } = useWorkflowNavigation();
 * ```
 */
export function useWorkflowNavigation(): WorkflowNavigationState {
  const {
    etapaAtual,
    stepConfigs,
    setEtapaAtual,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  // Filtra apenas steps habilitados e calcula o total real
  const enabledStepConfigs = useMemo(() => {
    if (!stepConfigs || stepConfigs.length === 0) {
      return null;
    }
    return stepConfigs.filter((config) => config.enabled);
  }, [stepConfigs]);

  // Total de steps usa apenas os habilitados
  const totalSteps = enabledStepConfigs?.length || DEFAULT_TOTAL_STEPS;

  // Calcula o status de cada step baseado na etapa atual
  const steps = useMemo<WorkflowStep[]>(() => {
    if (!enabledStepConfigs || enabledStepConfigs.length === 0) {
      // Fallback para 3 steps padrão (Upload → Configurar → Revisar)
      return DEFAULT_WORKFLOW_STEPS.map((step) => ({
        ...step,
        status:
          step.index < etapaAtual
            ? 'completed'
            : step.index === etapaAtual
              ? 'current'
              : 'pending',
      }));
    }

    return enabledStepConfigs.map((config, idx) => ({
      id: config.id,
      index: idx, // Usa índice sequencial baseado nos steps habilitados
      label: STEP_LABELS[config.id] || config.id,
      status:
        idx < etapaAtual
          ? 'completed'
          : idx === etapaAtual
            ? 'current'
            : 'pending',
    }));
  }, [enabledStepConfigs, etapaAtual]);

  // Calcula a porcentagem de progresso baseado nos steps habilitados
  const progressPercentage = useMemo(() => {
    if (totalSteps <= 1) return 100;
    return Math.round((etapaAtual / (totalSteps - 1)) * 100);
  }, [etapaAtual, totalSteps]);

  // Navega para um step específico (apenas se for anterior ao atual)
  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < etapaAtual) {
        setEtapaAtual(index);
      }
    },
    [etapaAtual, setEtapaAtual]
  );

  return {
    steps,
    currentStep: etapaAtual,
    totalSteps,
    canGoBack: etapaAtual > 0,
    canGoForward: etapaAtual < totalSteps - 1,
    goToStep,
    nextStep: proximaEtapa,
    previousStep: etapaAnterior,
    progressPercentage,
  };
}
