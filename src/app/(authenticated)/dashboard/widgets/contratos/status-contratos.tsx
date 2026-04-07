'use client';

/**
 * Widget: Status dos Contratos — Donut
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.porStatus
 * Mostra distribuição de contratos por status com MiniDonut + legenda.
 *
 * Uso:
 *   import { WidgetStatusContratos } from '@/app/(authenticated)/dashboard/widgets/contratos/status-contratos'
 * ============================================================================
 */

import { FileText } from 'lucide-react';
import {
  WidgetContainer,
  MiniDonut,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

export function WidgetStatusContratos() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Status dos Contratos" icon={FileText} subtitle="Distribuição por status" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Não foi possível carregar os dados.
        </p>
      </WidgetContainer>
    );
  }

  const contratos = isDashboardUsuario(data)
    ? data.contratos
    : isDashboardAdmin(data)
      ? data.contratos
      : undefined;

  if (!contratos) {
    return (
      <WidgetContainer title="Status dos Contratos" icon={FileText} subtitle="Distribuição por status" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { porStatus } = contratos;
  const total = porStatus.reduce((acc, s) => acc + s.count, 0);

  const segments = porStatus.map((s) => ({
    value: s.count,
    color: tokenForTone(s.tone),
    label: s.status,
  }));

  return (
    <WidgetContainer
      title="Status dos Contratos"
      icon={FileText}
      subtitle="Distribuição por status"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={segments}
          size={90}
          strokeWidth={12}
          centerLabel={`${fmtNum(total)}`}
        />

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {porStatus.map((s) => {
            const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : '0';
            return (
              <div key={s.status} className="flex items-center gap-2">
                <div
                  className="size-2.5 rounded-[3px] shrink-0"
                  style={{ backgroundColor: tokenForTone(s.tone) }}
                />
                <span className="text-[10px] text-muted-foreground/70 truncate flex-1 capitalize">
                  {s.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-medium tabular-nums">
                  {fmtNum(s.count)}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums w-8 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}
