'use client';

/**
 * PipelineFunnel — Visualização de funil de conversão entre estágios.
 *
 * Extraído do PipelineFunnel do mock de contratos.
 * Exibe contagem, valor e taxa de conversão entre estágios adjacentes.
 *
 * Uso:
 *   <PipelineFunnel stages={stages} desistencias={{ count: 2 }} />
 */

import { GitBranch, ArrowRight } from 'lucide-react';
import { GlassPanel, fmtMoeda } from '@/app/app/dashboard/mock/widgets/primitives';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineStageData {
  id: string;
  label: string;
  color: string;
  count: number;
  valor?: number;
}

export interface PipelineFunnelProps {
  stages: PipelineStageData[];
  desistencias?: { count: number; valor?: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PipelineFunnel({ stages, desistencias }: PipelineFunnelProps) {
  // Exclui desistência das barras do funil principal
  const funnelStages = stages.filter((s) => s.id !== 'desistencia');
  const maxCount = Math.max(...funnelStages.map((s) => s.count), 1);

  const desistCount = desistencias?.count ?? stages.find((s) => s.id === 'desistencia')?.count ?? 0;
  const desistValor = desistencias?.valor ?? stages.find((s) => s.id === 'desistencia')?.valor;

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="size-4 text-muted-foreground/50" />
        <h2 className="font-heading text-sm font-semibold">Pipeline de Conversão</h2>
        {desistCount > 0 && (
          <span className="text-[10px] text-muted-foreground/55 ml-auto">
            {desistCount} desistência{desistCount !== 1 ? 's' : ''}
            {desistValor !== undefined ? ` (${fmtMoeda(desistValor)})` : ''}
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        {funnelStages.map((stage, i) => {
          const barWidth = Math.max(20, (stage.count / maxCount) * 100);
          const prevCount = i > 0 ? funnelStages[i - 1].count : stage.count;
          const convRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 100;

          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-2">
              {/* Stage header */}
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  {stage.label}
                </p>
                <p className="font-display text-2xl font-bold mt-0.5">{stage.count}</p>
                {stage.valor !== undefined && (
                  <p className="text-xs text-muted-foreground/50 tabular-nums">
                    {fmtMoeda(stage.valor)}
                  </p>
                )}
              </div>

              {/* Funnel bar */}
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: stage.color,
                  opacity: 0.6,
                }}
              />

              {/* Conversion rate */}
              {i > 0 ? (
                <div className="flex items-center gap-1 text-[10px]">
                  <ArrowRight className="size-2.5 text-muted-foreground/55" />
                  <span
                    className={
                      convRate >= 70
                        ? 'text-success/60'
                        : convRate >= 50
                          ? 'text-warning/60'
                          : 'text-destructive/60'
                    }
                  >
                    {convRate}%
                  </span>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
