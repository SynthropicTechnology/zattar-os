'use client';

/**
 * WidgetStatusDistribuicao -- Widget conectado
 * Fonte: useDashboard()
 *   - role=user: data.processos.porStatus (ou fallback ativos/arquivados)
 *   - role=admin: data.metricas + data.processos.porStatus
 */

import { PieChart } from 'lucide-react';
import {
  WidgetContainer,
  MiniDonut,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

interface StatusSegment {
  value: number;
  color: string;
  label: string;
}

export function WidgetStatusDistribuicao() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Distribuicao por Status"
        icon={PieChart}
        subtitle="Total de processos ativos"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let segments: StatusSegment[];

  if (isDashboardUsuario(data)) {
    const p = data.processos;

    if (p.porStatus && p.porStatus.length > 0) {
      segments = p.porStatus.map((s: { count: number; color: string; status: string }) => ({
        value: s.count,
        color: s.color,
        label: s.status,
      }));
    } else {
      // Fallback: build from ativos/arquivados
      segments = [
        { value: p.ativos, color: 'oklch(0.55 0.18 145)' /* --success */, label: 'Ativos' },
        { value: p.arquivados, color: 'oklch(0.42 0.01 281)' /* --muted-foreground */, label: 'Arquivados' },
      ];
    }
  } else {
    return null;
  }

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Distribuicao por Status"
      icon={PieChart}
      subtitle="Total de processos ativos"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={segments}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col justify-center gap-2.5 flex-1 min-w-0">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {seg.label}
              </span>
              <span className="text-[10px] font-medium tabular-nums">
                {fmtNum(seg.value)}
              </span>
              <span className="text-[9px] text-muted-foreground/60 w-7 text-right tabular-nums">
                {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
