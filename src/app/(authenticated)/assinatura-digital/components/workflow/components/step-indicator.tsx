'use client';

/**
 * Indicador visual individual de uma etapa do workflow
 */

import type { KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowStep } from '../types';

interface StepIndicatorProps {
  /** Dados da etapa */
  step: WorkflowStep;
  /** Callback ao clicar (se clicável) */
  onClick?: () => void;
  /** Se o step pode ser clicado */
  isClickable: boolean;
  /** Tamanho do indicador */
  size?: 'sm' | 'md';
}

/**
 * Componente de indicador de step individual
 *
 * Renderiza um círculo com número ou ícone check (se completed).
 * Estados visuais:
 * - Completed: fundo primary, texto branco, ícone check
 * - Current: borda primary, fundo branco, ponto interno primary
 * - Pending: borda border, fundo branco, número em muted-foreground
 */
export function StepIndicator({
  step,
  onClick,
  isClickable,
  size = 'md',
}: StepIndicatorProps) {
  const { status, index } = step;

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
  };

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-current={status === 'current' ? 'step' : undefined}
      aria-disabled={!isClickable}
      aria-label={`Etapa ${index + 1}: ${step.label}${status === 'completed' ? ' (concluída)' : status === 'current' ? ' (atual)' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex items-center justify-center rounded-full font-medium transition-all duration-300',
        sizeClasses[size],
        // Status styles
        status === 'completed' && 'bg-primary text-primary-foreground',
        status === 'current' && 'border-2 border-primary bg-background',
        status === 'pending' && 'border-2 border-border bg-background text-muted-foreground',
        // Interactive styles
        isClickable && 'cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        !isClickable && status !== 'current' && 'cursor-default'
      )}
    >
      {status === 'completed' ? (
        <Check size={iconSizes[size]} strokeWidth={3} />
      ) : status === 'current' ? (
        <span
          className={cn(
            'rounded-full bg-primary',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
          )}
        />
      ) : (
        <span>{index + 1}</span>
      )}
    </div>
  );
}
