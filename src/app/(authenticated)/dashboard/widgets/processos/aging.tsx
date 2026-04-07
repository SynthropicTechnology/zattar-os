'use client';

/**
 * WidgetAging -- Widget conectado
 * Fonte: useDashboard()
 *   - data.processos.aging (faixa/count/color)
 */

import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  StackedBar,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';
import { ToneDot } from '@/components/ui/tone-dot';

export function WidgetAging() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Aging dos Processos"
        icon={BarChart3}
        subtitle="Distribuicao por tempo de duracao"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let aging: { faixa: string; count: number; tone: SemanticTone }[] | undefined;

  if (isDashboardUsuario(data)) {
    aging = data.processos.aging;
  } else {
    // Admin não tem data.processos — widget só funciona para usuário
    return null;
  }

  if (!aging || aging.length === 0) {
    return (
      <WidgetContainer
        title="Aging dos Processos"
        icon={BarChart3}
        subtitle="Distribuicao por tempo de duracao"
        depth={1}
      >
        <p className="text-[10px] text-muted-foreground/60">
          Dados insuficientes para exibir aging.
        </p>
      </WidgetContainer>
    );
  }

  const segments = aging.map((a) => ({
    value: a.count,
    color: tokenForTone(a.tone),
    label: a.faixa,
    tone: a.tone,
  }));

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Aging dos Processos"
      icon={BarChart3}
      subtitle="Distribuicao por tempo de duracao"
      depth={1}
    >
      <StackedBar segments={segments} height={12} />
      <div className="flex flex-col gap-3 mt-4">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center gap-2">
              <ToneDot tone={seg.tone} shape="bullet" aria-label={seg.label} />
              <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                {seg.label}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 rounded-full bg-border/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: tokenForTone(seg.tone) }}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums w-6 text-right">
                  {seg.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}
