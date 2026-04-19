'use client';

/**
 * ContratosPipelineStepper — Funil de estágios em GlassPanel único.
 * ============================================================================
 * Segue o padrão de `SignaturePipeline` (assinatura digital): um container
 * com header + colunas internas lado a lado, cada coluna com ícone, label,
 * contador grande, barra proporcional e taxa de conversão relativa ao total.
 *
 * Cada coluna é clicável para filtrar a lista por status; a coluna ativa
 * ganha realce sutil via fundo primary/5 e glow no dot.
 * ============================================================================
 */

import * as React from 'react';
import { GitBranch, FileEdit, FileCheck2, Scale, Ban, type LucideIcon } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  STATUS_CONTRATO_LABELS,
  type StatusContrato,
} from '@/app/(authenticated)/contratos/domain';

// ---------------------------------------------------------------------------
// Config dos estágios
// ---------------------------------------------------------------------------

interface StageConfig {
  icon: LucideIcon;
  textColor: string;
  cssVar: string;
}

const STAGE_ORDER: StatusContrato[] = [
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
];

const STAGE_CONFIG: Record<StatusContrato, StageConfig> = {
  em_contratacao: {
    icon: FileEdit,
    textColor: 'text-info',
    cssVar: 'var(--info)',
  },
  contratado: {
    icon: FileCheck2,
    textColor: 'text-success',
    cssVar: 'var(--success)',
  },
  distribuido: {
    icon: Scale,
    textColor: 'text-primary',
    cssVar: 'var(--primary)',
  },
  desistencia: {
    icon: Ban,
    textColor: 'text-destructive',
    cssVar: 'var(--destructive)',
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContratosPipelineStepperProps {
  porStatus: Record<string, number>;
  activeStatus?: string | null;
  onStatusClick?: (status: string) => void;
  /** Compact mode para detail page header (sem container). */
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
  const stages = React.useMemo(
    () =>
      STAGE_ORDER.map((status) => ({
        status,
        count: porStatus[status] ?? 0,
      })),
    [porStatus],
  );

  const total = React.useMemo(
    () => stages.reduce((sum, s) => sum + s.count, 0),
    [stages],
  );

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const body = (
    <div className="flex items-stretch gap-3">
      {stages.map((stage) => {
        const cfg = STAGE_CONFIG[stage.status];
        const Icon = cfg.icon;
        const isActive = activeStatus === stage.status;
        const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
        const barWidth = Math.max(15, (stage.count / maxCount) * 100);
        const clickable = typeof onStatusClick === 'function';

        const inner = (
          <div className="flex flex-col items-center gap-2 py-2 px-1 w-full">
            <div className="flex items-center gap-1.5">
              <Icon className={cn('size-3.5', cfg.textColor)} />
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-[0.06em]',
                  isActive ? 'text-foreground' : 'text-muted-foreground/65',
                )}
              >
                {STATUS_CONTRATO_LABELS[stage.status]}
              </span>
            </div>
            <p
              className={cn(
                'font-heading text-2xl font-bold tabular-nums leading-none',
                isActive ? 'text-foreground' : 'text-foreground/85',
              )}
            >
              {stage.count.toLocaleString('pt-BR')}
            </p>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${barWidth}%`,
                backgroundColor: cfg.cssVar,
                opacity: isActive ? 0.95 : 0.6,
                boxShadow: isActive ? `0 0 10px ${cfg.cssVar}55` : undefined,
              }}
              aria-hidden="true"
            />
            {total > 0 ? (
              <span
                className={cn(
                  'text-[10px] font-medium tabular-nums',
                  isActive ? cfg.textColor : 'text-muted-foreground/55',
                )}
              >
                {pct}% do total
              </span>
            ) : (
              <span className="text-[10px] text-transparent" aria-hidden>
                -
              </span>
            )}
          </div>
        );

        const commonWrapperClasses = cn(
          'flex-1 rounded-xl transition-all duration-180',
          isActive && 'bg-primary/5 ring-1 ring-primary/15',
        );

        if (!clickable) {
          return (
            <div key={stage.status} className={commonWrapperClasses}>
              {inner}
            </div>
          );
        }

        return (
          <button
            key={stage.status}
            type="button"
            onClick={() => onStatusClick?.(stage.status)}
            aria-pressed={isActive}
            className={cn(
              commonWrapperClasses,
              'cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'hover:bg-primary/8',
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );

  if (compact) return body;

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/8">
          <GitBranch className="size-3.5 text-primary/70" />
        </span>
        <Heading level="widget">Pipeline de Contratos</Heading>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 text-[10px] font-medium tabular-nums">
          {total.toLocaleString('pt-BR')} total
        </span>
      </div>
      {body}
    </GlassPanel>
  );
}
