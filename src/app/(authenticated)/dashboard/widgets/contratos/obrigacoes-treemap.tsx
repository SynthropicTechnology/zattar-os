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

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  InsightBanner,
  WidgetContainer,
  fmtMoeda,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { actionListarAcordos } from '@/app/(authenticated)/obrigacoes/server-actions';

interface ObrigacaoPorTipo {
  label: string;
  valor: number;
  color: string;
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  acordo:              { label: 'Acordos',              color: 'hsl(var(--primary) / 0.50)' },
  condenacao:          { label: 'Condenações',          color: 'hsl(var(--destructive) / 0.45)' },
  custas_processuais:  { label: 'Custas Processuais',   color: 'hsl(var(--warning) / 0.45)' },
};

function useObrigacoesPorTipo() {
  const [data, setData] = useState<ObrigacaoPorTipo[]>([]);
  const [totalValor, setTotalValor] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await actionListarAcordos({ pagina: 1, limite: 500 });
        if (!result.success) return;

        const acordos = (result.data as { acordos: Array<{ tipo: string; valorTotal: number; status: string }> })?.acordos ?? [];
        // Agrupar por tipo, apenas ativos (não pagos totalmente)
        const ativos = acordos.filter(a => a.status !== 'pago_total');
        const porTipo = new Map<string, number>();

        for (const a of ativos) {
          const tipo = a.tipo || 'acordo';
          porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + (a.valorTotal ?? 0));
        }

        const items: ObrigacaoPorTipo[] = [];
        let total = 0;
        for (const [tipo, valor] of porTipo.entries()) {
          const cfg = TIPO_CONFIG[tipo] ?? { label: tipo, color: 'hsl(var(--muted))' };
          items.push({ label: cfg.label, valor, color: cfg.color });
          total += valor;
        }

        items.sort((a, b) => b.valor - a.valor);
        setData(items);
        setTotalValor(total);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, totalValor, isLoading };
}

export function WidgetObrigacoesTreemap() {
  const { data, totalValor, isLoading } = useObrigacoesPorTipo();

  if (isLoading) return <WidgetSkeleton size="sm" />;

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
