'use client';

/**
 * WidgetDespesasCategoria — Despesas por categoria com donut chart
 * Fonte: useDashboard() → data.dadosFinanceiros.despesasPorCategoria
 */

import { PieChart } from 'lucide-react';
import { WidgetContainer, MiniDonut, fmtMoeda } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

export function WidgetDespesasCategoria() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="Despesas por Categoria" icon={PieChart} subtitle="Sem dados">
        <p className="text-xs text-muted-foreground/60">Dados indisponíveis.</p>
      </WidgetContainer>
    );
  }

  const categorias = data.dadosFinanceiros.despesasPorCategoria;

  if (!categorias || categorias.length === 0) {
    return (
      <WidgetContainer title="Despesas por Categoria" icon={PieChart} subtitle="Distribuição">
        <p className="text-xs text-muted-foreground/60">Nenhuma despesa categorizada.</p>
      </WidgetContainer>
    );
  }

  const total = categorias.reduce((acc, c) => acc + c.valor, 0);
  const segments = categorias.map((c) => ({
    value: c.valor,
    color: tokenForTone(c.tone),
    label: c.categoria,
  }));

  return (
    <WidgetContainer title="Despesas por Categoria" icon={PieChart} subtitle="Distribuição">
      <div className="flex items-center gap-4">
        <MiniDonut
          segments={segments}
          size={80}
          strokeWidth={10}
          centerLabel={fmtMoeda(total)}
        />

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {categorias.map((c) => (
            <div key={c.categoria} className="flex items-center gap-2">
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: tokenForTone(c.tone) }}
              />
              <span className="text-[10px] text-muted-foreground/70 truncate flex-1">
                {c.categoria}
              </span>
              <span className="text-[10px] font-medium tabular-nums shrink-0">
                {fmtMoeda(c.valor)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
