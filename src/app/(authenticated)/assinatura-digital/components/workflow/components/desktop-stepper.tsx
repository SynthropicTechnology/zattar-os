'use client';

/**
 * Versão desktop do stepper - horizontal com labels e ícones
 */

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { StepIndicator } from './step-indicator';
import type { WorkflowStep } from '../types';

interface DesktopStepperProps {
  /** Lista de steps com status */
  steps: WorkflowStep[];
  /** Callback quando um step é clicado */
  onStepClick?: (stepIndex: number) => void;
  /** Permite navegação para steps anteriores */
  allowNavigation: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Stepper horizontal para desktop
 *
 * Exibe os steps em linha com:
 * - Indicador circular (número, ponto ou check)
 * - Label do step
 * - Linha conectora entre steps
 */
export function DesktopStepper({
  steps,
  onStepClick,
  allowNavigation,
  className,
}: DesktopStepperProps) {
  const handleStepClick = (step: WorkflowStep) => {
    if (allowNavigation && step.status === 'completed' && onStepClick) {
      onStepClick(step.index);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        'animate-fade-in animate-duration-300',
        className
      )}
    >
      {steps.map((step, idx) => {
        const isClickable =
          allowNavigation && step.status === 'completed';
        const isLast = idx === steps.length - 1;

        return (
          <Fragment key={step.id}>
            {/* Step container */}
            <div className="flex items-center gap-2">
              {/* Step indicator */}
              <StepIndicator
                step={step}
                onClick={() => handleStepClick(step)}
                isClickable={isClickable}
                size="md"
              />

              {/* Step label - hidden on smaller screens */}
              <span
                className={cn(
                  'hidden text-sm transition-colors duration-200 lg:inline',
                  step.status === 'current' && 'font-bold text-primary',
                  step.status === 'completed' && 'font-medium text-foreground',
                  step.status === 'pending' && 'font-medium text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 w-6 transition-all duration-500 lg:w-8',
                  // Previous step completed - line is filled
                  step.status === 'completed' ? 'bg-primary' : 'bg-border'
                )}
                aria-hidden="true"
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
