'use client';

/**
 * Versão mobile do stepper - barra de progresso simplificada
 */

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MobileProgressProps {
  /** Etapa atual (0-indexed) */
  currentStep: number;
  /** Total de etapas */
  totalSteps: number;
  /** Porcentagem de progresso calculada */
  progressPercentage: number;
  /** Label da etapa atual */
  currentStepLabel?: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Barra de progresso simplificada para mobile
 *
 * Exibe:
 * - Label "Etapa X de Y" ou nome da etapa atual
 * - Barra de progresso fina com animação suave
 */
export function MobileProgress({
  currentStep,
  totalSteps,
  progressPercentage,
  currentStepLabel,
  className,
}: MobileProgressProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 animate-fade-in animate-duration-300', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        {currentStepLabel && (
          <span className="text-xs font-semibold text-primary">
            {currentStepLabel}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <Progress
        value={progressPercentage}
        className="h-1"
        aria-label={`Progresso: ${progressPercentage}%`}
      />
    </div>
  );
}
