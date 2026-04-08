'use client';

/**
 * Widget: Funil de Vencimentos — Expedientes (Aging Funnel)
 * ============================================================================
 * Conectado ao hook useDashboard().
 * Deriva as faixas de urgência a partir de expedientesResumo:
 *   - Vencidos      = vencidos
 *   - Hoje          = venceHoje
 *   - Próx. 7 dias  = proximos7dias - venceHoje  (exclui os de hoje)
 *   - Restantes     = total - vencidos - proximos7dias
 *
 * Uso:
 *   import { AgingFunnel } from '@/app/(authenticated)/dashboard/widgets/expedientes/aging-funnel'
 * ============================================================================
 */

import { Clock } from 'lucide-react';
import {
  UrgencyDot,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks/use-dashboard';

export function AgingFunnel() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : {
        total: data.metricas.totalExpedientes,
        vencidos: data.metricas.expedientesVencidos,
        venceHoje: 0, // admin não expõe esse campo diretamente
        venceAmanha: 0,
        proximos7dias: 0,
        porTipo: [],
      };

  const vencidos = expedientes.vencidos;
  const venceHoje = expedientes.venceHoje;
  const prox7diasOnly = Math.max(expedientes.proximos7dias - venceHoje, 0);
  const restantes = Math.max(
    expedientes.total - vencidos - expedientes.proximos7dias,
    0
  );

  const faixas: {
    label: string;
    count: number;
    level: 'critico' | 'alto' | 'medio' | 'baixo';
    color: string;
  }[] = [
      {
        label: 'Vencidos',
        count: vencidos,
        level: 'critico',
        color: 'var(--destructive)',
      },
      {
        label: 'Vencem Hoje',
        count: venceHoje,
        level: 'alto',
        color: 'hsl(35 95% 58%)',
      },
      {
        label: 'Próx. 7 dias',
        count: prox7diasOnly,
        level: 'medio',
        color: 'hsl(217 91% 60%)',
      },
      {
        label: 'Restantes',
        count: restantes,
        level: 'baixo',
        color: 'var(--chart-muted-soft)',
      },
    ];

  const maxCount = Math.max(...faixas.map((f) => f.count), 1);
  const totalExibido = faixas.reduce((s, f) => s + f.count, 0);

  return (
    <WidgetContainer
      title="Funil de Vencimentos"
      icon={Clock}
      subtitle="Distribuição por janela de prazo"
      depth={1}
      className="h-auto! self-start p-4!"
    >
      <div className="mt-1 space-y-2">
        {faixas.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <UrgencyDot level={row.level} />
            <div className="w-24 shrink-0">
              <span className="text-[10px] text-muted-foreground/60">
                {row.label}
              </span>
            </div>
            <div className="flex h-4.5 flex-1 items-center gap-2">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${(row.count / maxCount) * 100}%`,
                  backgroundColor: row.color,
                  opacity: 0.75,
                  minWidth: row.count > 0 ? 4 : 0,
                }}
              />
              <span
                className="shrink-0 text-[11px] font-bold tabular-nums"
                style={{ color: row.color }}
              >
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/10 pt-2.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60">
          Total
        </span>
        <span className="text-[13px] font-bold">{fmtNum(totalExibido)}</span>
      </div>
    </WidgetContainer>
  );
}
