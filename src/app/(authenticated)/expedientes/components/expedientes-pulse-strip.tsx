'use client';

/**
 * ExpedientesPulseStrip — KPI strip com 4 métricas operacionais
 * ============================================================================
 * Substitui os 5 ControlMetricCards por cards com AnimatedNumber,
 * barra de proporção e delta contextual.
 *
 * Inspiração: ProcessosPulseStrip + MissionKpiStrip
 * ============================================================================
 */

import { AlertTriangle, Clock, CalendarClock, UserX } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import {
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PulseMetric {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  highlight?: boolean;
}

interface ExpedientesPulseStripProps {
  vencidos: number;
  hoje: number;
  proximos: number;
  semDono: number;
  total: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpedientesPulseStrip({
  vencidos,
  hoje,
  proximos,
  semDono,
  total,
}: ExpedientesPulseStripProps) {
  const metrics: PulseMetric[] = [
    {
      label: 'Vencidos',
      value: vencidos,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      highlight: vencidos > 0,
    },
    {
      label: 'Hoje',
      value: hoje,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
    },
    {
      label: 'Próximos 3d',
      value: proximos,
      icon: CalendarClock,
      color: 'text-primary',
      bgColor: 'bg-primary',
    },
    {
      label: 'Sem dono',
      value: semDono,
      icon: UserX,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const pct = total > 0 ? Math.round((metric.value / total) * 100) : 0;
        const Icon = metric.icon;

        return (
          <GlassPanel
            key={metric.label}
            depth={metric.highlight ? 2 : 1}
            className={cn(
              'px-4 py-3.5',
              metric.highlight && metric.value > 0 && 'border-destructive/15',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className={cn(
                    'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                    metric.highlight && metric.value > 0 && 'text-destructive/80',
                  )}>
                    <AnimatedNumber value={metric.value} />
                  </p>
                </div>
              </div>
              <div className={cn(
                'size-8 rounded-lg flex items-center justify-center shrink-0',
                `${metric.bgColor}/8`,
                metric.highlight && metric.value > 0 && 'border border-destructive/20',
              )}>
                <Icon className={cn('size-4', `${metric.color}/60`)} />
              </div>
            </div>

            {/* Barra de proporção */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    `${metric.bgColor}/25`,
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
                {pct}%
              </span>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
