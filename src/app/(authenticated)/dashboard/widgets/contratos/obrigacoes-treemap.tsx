'use client';

/**
 * Widget: Obrigações por Categoria — Treemap
 * ============================================================================
 * Conectado ao módulo de obrigações via actionListarAcordos().
 * Agrupa obrigações por tipo (acordo, condenação, custas) com valores reais.
 *
 * Uso:
 *   import { WidgetObrigacoesTreemap } from '@/app/(authenticated)/dashboard/widgets/contratos/obrigacoes-treemap'
 * ============================================================================
 */

import { BarChart3 } from 'lucide-react';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import {
  InsightBanner,
  WidgetContainer,
  fmtMoeda,
} from '../../mock/widgets/primitives';

interface ObrigacaoPorTipo {
  label: string;
  valor: number;
  color: string;
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  acordo: { label: 'Acordos', color: 'var(--chart-primary-soft)' },
  condenacao: { label: 'Condenações', color: 'var(--chart-destructive-soft)' },
  custas_processuais: { label: 'Custas Processuais', color: 'var(--chart-warning-soft)' },
};

export function WidgetObrigacoesTreemap() {
  const { data: dashboardData, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const treemapObrigacoes = dashboardData?.contratos?.treemapObrigacoes ?? [];

  const data: ObrigacaoPorTipo[] = treemapObrigacoes.map(item => ({
    label: item.natureza,
    valor: item.valor,
    color: TIPO_CONFIG[item.natureza.toLowerCase()]?.color ?? TIPO_CONFIG['acordo']?.color ?? 'var(--muted)',
  })).sort((a, b) => b.valor - a.valor) ?? [];

  const totalValor = data.reduce((acc, it) => acc + it.valor, 0);

  return (
    <WidgetContainer
      title="Obrigações por Categoria"
      icon={BarChart3}
      subtitle="Distribuição de valores em aberto"
      depth={1}
    >
      <div className="flex flex-col gap-4 mt-1">
        {data.length === 0 ? (
          <div
            className="rounded-lg border border-border/10 bg-border/5 flex items-center justify-center"
            style={{ height: 80 }}
          >
            <p className="text-[10px] text-muted-foreground/55 italic">
              Nenhuma obrigação ativa.
            </p>
          </div>
        ) : (
          <>
            {/* Visual treemap simplificado — barras proporcionais */}
            <div className="flex gap-1 rounded-lg overflow-hidden" style={{ height: 80 }}>
              {data.map((item) => {
                const pct = totalValor > 0 ? (item.valor / totalValor) * 100 : 0;
                return (
                  <div
                    key={item.label}
                    className="flex items-end justify-center pb-2 transition-all duration-500"
                    style={{
                      backgroundColor: item.color,
                      width: `${Math.max(pct, 8)}%`,
                    }}
                  >
                    <span className="text-[8px] font-semibold text-foreground/70 tabular-nums">
                      {Math.round(pct)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda com valores reais */}
            <div className="flex flex-col gap-1.5">
              {data.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-[3px] shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-muted-foreground/70 truncate flex-1">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-medium tabular-nums">
                    {fmtMoeda(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {totalValor > 0 && (
          <InsightBanner type="info">
            Total em obrigações ativas: {fmtMoeda(totalValor)}
          </InsightBanner>
        )}
      </div>
    </WidgetContainer>
  );
}
