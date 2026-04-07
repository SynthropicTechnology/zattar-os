'use client';

/**
 * Widget: Status das Parcelas — StackedBar + breakdown
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.parcelasStatus
 * Mostra barra empilhada com legenda, contagens, percentuais e totais.
 *
 * Uso:
 *   import { WidgetParcelasStatus } from '@/app/(authenticated)/dashboard/widgets/contratos/parcelas-status'
 * ============================================================================
 */

import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  StackedBar,
  fmtMoeda,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

export function WidgetParcelasStatus() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
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
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { parcelasStatus } = contratos;

  const totalCount = parcelasStatus.reduce((acc, p) => acc + p.count, 0);
  const totalValor = parcelasStatus.reduce((acc, p) => acc + p.valor, 0);
  const valorPendente = parcelasStatus
    .filter((p) => p.status !== 'paga')
    .reduce((acc, p) => acc + p.valor, 0);

  const segments = parcelasStatus.map((p) => ({
    value: p.count,
    color: tokenForTone(p.tone),
    label: p.status,
  }));

  if (totalCount === 0) {
    return (
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center italic">
          Nenhuma parcela registrada.
        </p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Parcelas"
      icon={BarChart3}
      subtitle="Status de pagamento"
      depth={1}
    >
      <div className="flex flex-col gap-4">
        <StackedBar segments={segments} height={10} />

        <div className="flex flex-col gap-1.5">
          {parcelasStatus.map((p) => {
            const pct = totalCount > 0 ? ((p.count / totalCount) * 100).toFixed(0) : '0';
            return (
              <div key={p.status} className="flex items-center gap-2">
                <div
                  className="size-2.5 rounded-[3px] shrink-0"
                  style={{ backgroundColor: tokenForTone(p.tone) }}
                />
                <span className="text-[10px] text-muted-foreground/70 truncate flex-1 capitalize">
                  {p.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-medium tabular-nums">
                  {fmtNum(p.count)}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums w-8 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-3 border-t border-border/10">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Total
            </p>
            <p className="text-sm font-semibold font-display tabular-nums">
              {fmtMoeda(totalValor)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Pendente
            </p>
            <p className="text-sm font-semibold font-display tabular-nums text-warning/80">
              {fmtMoeda(valorPendente)}
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
