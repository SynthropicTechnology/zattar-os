'use client';

import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import {
  STATUS_CONTRATO_LABELS,
  type StatusContrato,
} from '@/app/(authenticated)/contratos/domain';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_ORDER: StatusContrato[] = [
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
];

const STAGE_COLORS: Record<StatusContrato, string> = {
  em_contratacao: 'bg-info',
  contratado: 'bg-success',
  distribuido: 'bg-primary',
  desistencia: 'bg-destructive',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContratosPipelineStepperProps {
  porStatus: Record<string, number>;
  activeStatus?: string | null;
  onStatusClick?: (status: string) => void;
  /** Compact mode for detail page header (no GlassPanel wrapper) */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContratosPipelineStepper({
  porStatus,
  activeStatus,
  onStatusClick,
  compact = false,
}: ContratosPipelineStepperProps) {
  const content = (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((stage, index) => {
        const isActive = activeStatus === stage;
        const count = porStatus[stage] ?? 0;

        return (
          <div key={stage} className="flex items-center gap-1">
            {/* Connector between stages */}
            {index > 0 && (
              <div className="w-5 h-0.5 bg-border/30" />
            )}

            {/* Stage button */}
            <button
              type="button"
              onClick={() => onStatusClick?.(stage)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors',
                'hover:bg-primary/4',
                isActive && 'bg-primary/6',
              )}
            >
              {/* Colored dot */}
              <span
                className={cn(
                  'size-2.5 rounded-full',
                  STAGE_COLORS[stage],
                  isActive && 'shadow-sm',
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  'text-xs text-muted-foreground whitespace-nowrap',
                  isActive && 'font-semibold text-foreground',
                )}
              >
                {STATUS_CONTRATO_LABELS[stage]}
              </span>

              {/* Count badge */}
              <span className="text-[10px] font-bold tabular-nums bg-primary/8 text-primary rounded-full px-1.5 py-0.5">
                {count}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return content;
  }

  return <GlassPanel className="px-5 py-3">{content}</GlassPanel>;
}
