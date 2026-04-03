'use client';

import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusContrato } from '@/app/(authenticated)/contratos';
import { formatarStatusContrato } from '@/app/(authenticated)/contratos';
import { cn } from '@/lib/utils';

interface ContratoProgressCardProps {
  status: StatusContrato;
}

const STATUS_WORKFLOW: StatusContrato[] = [
  'em_contratacao',
  'contratado',
  'distribuido',
];

function getProgressValue(status: StatusContrato): number {
  if (status === 'desistencia') return 100;
  const index = STATUS_WORKFLOW.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / STATUS_WORKFLOW.length) * 100);
}

function getStepStatus(
  currentStatus: StatusContrato,
  stepStatus: StatusContrato
): 'completed' | 'current' | 'pending' | 'cancelled' {
  if (currentStatus === 'desistencia') {
    return 'cancelled';
  }

  const currentIndex = STATUS_WORKFLOW.indexOf(currentStatus);
  const stepIndex = STATUS_WORKFLOW.indexOf(stepStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function ContratoProgressCard({ status }: ContratoProgressCardProps) {
  const progressValue = getProgressValue(status);
  const isDesistencia = status === 'desistencia';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Progresso do Contrato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progresso */}
        <div className="flex items-center gap-4">
          <Progress
            value={progressValue}
            className={cn(
              'h-2',
              isDesistencia && '[&>div]:bg-destructive'
            )}
          />
          <div className="text-muted-foreground text-sm whitespace-nowrap">
            {progressValue}%
          </div>
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {STATUS_WORKFLOW.map((stepStatus) => {
            const stepState = getStepStatus(status, stepStatus);
            const label = formatarStatusContrato(stepStatus);

            return (
              <div
                key={stepStatus}
                className="flex flex-col items-center gap-1"
              >
                {stepState === 'completed' ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : stepState === 'current' ? (
                  <Circle className="size-5 text-primary fill-primary" />
                ) : stepState === 'cancelled' ? (
                  <XCircle className="size-5 text-destructive" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/50" />
                )}
                <span
                  className={cn(
                    'text-xs text-center',
                    stepState === 'completed' && 'text-primary',
                    stepState === 'current' && 'text-primary font-medium',
                    stepState === 'cancelled' && 'text-destructive',
                    stepState === 'pending' && 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status atual se for desistência */}
        {isDesistencia && (
          <div className="text-center text-sm text-destructive font-medium">
            Contrato cancelado (Desistência)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
