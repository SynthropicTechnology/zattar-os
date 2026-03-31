'use client';

/**
 * Widget: Obrigações por Categoria — Treemap
 * ============================================================================
 * Placeholder aguardando o módulo de contratos.
 * Exibe um estado vazio com Treemap sem segmentos e InsightBanner explicativo.
 * Quando o hook de contratos estiver disponível, substituir pelos dados reais
 * de obrigações agrupados por categoria (acordos, condenações, custas, etc).
 *
 * Uso:
 *   import { WidgetObrigacoesTreemap } from '@/app/app/dashboard/widgets/contratos/obrigacoes-treemap'
 * ============================================================================
 */

import { BarChart3 } from 'lucide-react';
import {
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';

export function WidgetObrigacoesTreemap() {
  return (
    <WidgetContainer
      title="Obrigações por Categoria"
      icon={BarChart3}
      subtitle="Distribuição de valores em aberto"
      depth={1}
    >
      {/* Empty state para treemap */}
      <div className="flex flex-col gap-4 mt-1">
        {/* Placeholder visual do treemap */}
        <div
          className="rounded-lg border border-border/10 bg-border/5 flex items-center justify-center"
          style={{ height: 80 }}
        >
          <p className="text-[10px] text-muted-foreground/30 italic">
            Aguardando dados de contratos...
          </p>
        </div>

        {/* Legenda placeholder */}
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Acordos Trabalhistas', color: 'hsl(var(--primary) / 0.30)' },
            { label: 'Condenações',          color: 'hsl(var(--destructive) / 0.25)' },
            { label: 'Custas Processuais',   color: 'hsl(var(--warning) / 0.25)' },
            { label: 'Honorários Periciais', color: 'hsl(var(--primary) / 0.15)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="size-2.5 rounded-[3px] shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-muted-foreground/35 truncate">
                {item.label}
              </span>
              <span className="text-[10px] text-muted-foreground/25 ml-auto tabular-nums">
                —
              </span>
            </div>
          ))}
        </div>

        <InsightBanner type="info">
          Módulo de contratos em desenvolvimento — o treemap de obrigações será preenchido após a integração.
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}
