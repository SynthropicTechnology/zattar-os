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

  const vencidos      = expedientes.vencidos;
  const venceHoje     = expedientes.venceHoje;
  const prox7diasOnly = Math.max(expedientes.proximos7dias - venceHoje, 0);
  const restantes     = Math.max(
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
      color: 'hsl(var(--destructive))',
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
      color: 'hsl(var(--muted-foreground) / 0.55)',
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
    >
      <div className="space-y-3 mt-1">
        {faixas.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <UrgencyDot level={row.level} />
            <div className="w-28 shrink-0">
              <span className="text-[11px] text-muted-foreground/60">
                {row.label}
              </span>
            </div>
            <div className="flex-1 h-5 flex items-center gap-2">
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
                className="text-[12px] font-bold tabular-nums shrink-0"
                style={{ color: row.color }}
              >
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
          Total
        </span>
        <span className="text-sm font-bold">{fmtNum(totalExibido)}</span>
      </div>
    </WidgetContainer>
  );
}
