'use client';

/**
 * WidgetFluxoCaixa — Fluxo de caixa mensal (receita vs despesa)
 * Fonte: useDashboard() → data.dadosFinanceiros.fluxoCaixaMensal
 */

import { TrendingUp } from 'lucide-react';
import { WidgetContainer, MiniBar, fmtMoeda } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { fmtMes } from '../shared/fmt-mes';

export function WidgetFluxoCaixa() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="Fluxo de Caixa" icon={TrendingUp} subtitle="Sem dados">
        <p className="text-xs text-muted-foreground/60">Dados indisponíveis.</p>
      </WidgetContainer>
    );
  }

  const fluxo = data.dadosFinanceiros.fluxoCaixaMensal;

  if (!fluxo || fluxo.length === 0) {
    return (
      <WidgetContainer title="Fluxo de Caixa" icon={TrendingUp} subtitle="Mensal">
        <p className="text-xs text-muted-foreground/60">Nenhum dado de fluxo disponível.</p>
      </WidgetContainer>
    );
  }

  const barData = fluxo.map((item) => ({
    label: fmtMes(item.mes),
    value: item.receita,
    value2: item.despesa,
  }));

  const lastMonth = fluxo[fluxo.length - 1];

  return (
    <WidgetContainer title="Fluxo de Caixa" icon={TrendingUp} subtitle="Receita vs Despesa">
      <div className="flex flex-col gap-3">
        <MiniBar
          data={barData}
          height={56}
          barColor="bg-success/50"
          barColor2="bg-destructive/40"
        />

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-success/50" />
            <span>Receita</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm bg-destructive/40" />
            <span>Despesa</span>
          </div>
        </div>

        {/* Last month summary */}
        {lastMonth && (
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/10">
            <span className="text-muted-foreground/50">{fmtMes(lastMonth.mes)}</span>
            <div className="flex items-center gap-3">
              <span className="text-success/70 font-medium">{fmtMoeda(lastMonth.receita)}</span>
              <span className="text-destructive/60 font-medium">{fmtMoeda(lastMonth.despesa)}</span>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
