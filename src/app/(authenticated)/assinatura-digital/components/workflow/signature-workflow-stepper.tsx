'use client';

/**
 * SignatureWorkflowStepper - Indicador de progresso do fluxo de assinatura digital
 *
 * Componente responsivo que mostra o progresso através das etapas do formulário.
 * Versão desktop: stepper horizontal com labels e ícones.
 * Versão mobile: barra de progresso simplificada.
 *
 * Integra-se automaticamente com o formulario-store (Zustand).
 *
 * @example
 * ```tsx
 * // Uso básico (apenas visualização)
 * <SignatureWorkflowStepper />
 *
 * // Com navegação habilitada
 * <SignatureWorkflowStepper
 *   allowNavigation
 *   onStepClick={(index) => console.log('Navegando para step:', index)}
 * />
 * ```
 */

import { useViewport } from '@/hooks/use-viewport';
import { cn } from '@/lib/utils';
import { useWorkflowNavigation } from './hooks/use-workflow-navigation';
import { DesktopStepper } from './components/desktop-stepper';
import { MobileProgress } from './components/mobile-progress';
import type { SignatureWorkflowStepperProps } from './types';

/**
 * Componente principal do stepper de workflow
 *
 * Renderiza automaticamente a versão correta baseado no viewport:
 * - Mobile (< md): barra de progresso simplificada
 * - Desktop (>= md): stepper horizontal com steps clicáveis
 */
export function SignatureWorkflowStepper({
  className,
  onStepClick,
  allowNavigation = false,
}: SignatureWorkflowStepperProps) {
  const viewport = useViewport();
  const {
    steps,
    currentStep,
    totalSteps,
    goToStep,
    progressPercentage,
  } = useWorkflowNavigation();

  // Encontra o label da etapa atual
  const currentStepData = steps.find((s) => s.status === 'current');
  const currentStepLabel = currentStepData?.label;

  // Handler para clique nos steps
  const handleStepClick = (stepIndex: number) => {
    if (allowNavigation) {
      goToStep(stepIndex);
      onStepClick?.(stepIndex);
    }
  };

  return (
    <nav
      aria-label="Progresso do fluxo de assinatura"
      className={cn('w-full', className)}
      data-testid="workflow-stepper"
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Etapa {currentStep + 1} de {totalSteps}: {currentStepLabel}
      </div>

      {viewport.isMobile ? (
        <MobileProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          progressPercentage={progressPercentage}
          currentStepLabel={currentStepLabel}
        />
      ) : (
        <DesktopStepper
          steps={steps}
          onStepClick={handleStepClick}
          allowNavigation={allowNavigation}
        />
      )}
    </nav>
  );
}
