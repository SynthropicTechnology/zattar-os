'use client';

/**
 * WidgetContasPagar — Aging de contas a pagar
 * Fonte: useDashboard() → data.dadosFinanceiros.contasPagarAging
 */

import { ArrowDownLeft } from 'lucide-react';
import { WidgetContainer, fmtMoeda } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

export function WidgetContasPagar() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="Contas a Pagar" icon={ArrowDownLeft} subtitle="Sem dados">
        <p className="text-xs text-muted-foreground/60">Dados indisponíveis.</p>
      </WidgetContainer>
    );
  }

  const fin = data.dadosFinanceiros;
  const aging = fin.contasPagarAging;
  const total = fin.contasPagar.valor;

  if (!aging || aging.length === 0) {
    return (
      <WidgetContainer
        title="Contas a Pagar"
        icon={ArrowDownLeft}
        subtitle="Aging"
        action={<span className="text-[11px] font-semibold text-destructive/70">{fmtMoeda(total)}</span>}
      >
        <p className="text-xs text-muted-foreground/60">Nenhum dado de aging disponível.</p>
      </WidgetContainer>
    );
  }

  const maxVal = Math.max(...aging.map((a) => a.valor));

  return (
    <WidgetContainer
      title="Contas a Pagar"
      icon={ArrowDownLeft}
      subtitle="Aging"
      action={<span className="text-[11px] font-semibold text-destructive/70">{fmtMoeda(total)}</span>}
    >
      <div className="flex flex-col gap-2">
        {aging.map((item) => (
          <div key={item.faixa} className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0 truncate">
              {item.faixa}
            </span>
            <div className="flex-1 h-4 rounded-full bg-border/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: maxVal > 0 ? `${(item.valor / maxVal) * 100}%` : '0%',
                  backgroundColor: tokenForTone(item.tone),
                }}
              />
            </div>
            <span className="text-[10px] font-medium tabular-nums w-20 text-right shrink-0">
              {fmtMoeda(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
