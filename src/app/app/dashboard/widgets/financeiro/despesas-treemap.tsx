'use client';

import { BarChart2 } from 'lucide-react';
import {
  WidgetContainer,
  Treemap,
  ComparisonStat,
  InsightBanner,
  fmtMoeda,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDespesasPorCategoria } from '../../hooks';

// ─── Paleta de cores por posição ─────────────────────────────────────────────

const SEGMENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--info, var(--primary)))',
  'hsl(var(--muted-foreground) / 0.4)',
];

function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index] ?? 'hsl(var(--muted-foreground) / 0.4)';
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <BarChart2 className="size-8 text-muted-foreground/20" />
      <p className="text-[11px] text-muted-foreground/40 text-center">
        Nenhuma despesa por categoria disponível
      </p>
    </div>
  );
}

// ─── WidgetDespesasTreemap ────────────────────────────────────────────────────

export function WidgetDespesasTreemap() {
  const { despesasPorCategoria, isLoading, error } = useDespesasPorCategoria();

  if (isLoading) {
    return <WidgetSkeleton size="sm" />;
  }

  if (error) {
    return (
      <WidgetContainer
        title="Composição de Despesas"
        subtitle="Proporção visual por categoria"
        icon={BarChart2}
      >
        <p className="text-[11px] text-muted-foreground/40 py-6 text-center">
          Dados de despesas indisponíveis.
        </p>
      </WidgetContainer>
    );
  }

  const categorias = despesasPorCategoria ?? [];

  if (categorias.length === 0) {
    return (
      <WidgetContainer
        title="Composição de Despesas"
        subtitle="Proporção visual por categoria"
        icon={BarChart2}
      >
        <EmptyState />
      </WidgetContainer>
    );
  }

  // Map CategoriaValor to Treemap segments
  const segments = categorias.map((c, i) => ({
    label: c.categoria,
    value: c.valor,
    color: getSegmentColor(i),
  }));

  const totalAtual = categorias.reduce((acc, c) => acc + c.valor, 0);

  return (
    <WidgetContainer
      title="Composição de Despesas"
      subtitle="Proporção visual por categoria"
      icon={BarChart2}
    >
      <div className="mt-1">
        <Treemap segments={segments} height={100} />
      </div>

      <div className="mt-4 pt-3 border-t border-border/10 flex items-end justify-between gap-4">
        <ComparisonStat
          label="Total mês"
          current={totalAtual}
          previous={totalAtual}
          format="currency"
        />
        <div className="flex flex-wrap gap-1.5 justify-end">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[9px] text-muted-foreground/40">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="mt-3">
          <InsightBanner type="info">
            {segments[0]?.label ?? 'Categoria principal'} representa{' '}
            {totalAtual > 0
              ? Math.round(((segments[0]?.value ?? 0) / totalAtual) * 100)
              : 0}
            % do total de despesas — {fmtMoeda(segments[0]?.value ?? 0)}.
          </InsightBanner>
        </div>
      )}
    </WidgetContainer>
  );
}
