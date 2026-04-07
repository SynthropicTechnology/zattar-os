'use client';

/**
 * WidgetStatusDistribuicao -- Widget conectado
 * Fonte: useDashboard()
 *   - role=user: data.processos.porStatus (ou fallback ativos/arquivados)
 *   - role=admin: data.metricas + data.processos.porStatus
 */

import { PieChart } from 'lucide-react';
import {
  WidgetContainer,
  MiniDonut,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';
import { ToneDot } from '@/components/ui/tone-dot';

interface StatusSegment {
  value: number;
  color: string;
  label: string;
  tone?: SemanticTone;
}

export function WidgetStatusDistribuicao() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Distribuicao por Status"
        icon={PieChart}
        subtitle="Total de processos ativos"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let segments: StatusSegment[];

  if (isDashboardUsuario(data)) {
    const p = data.processos;

    if (p.porStatus && p.porStatus.length > 0) {
      segments = p.porStatus.map((s: { count: number; tone: SemanticTone; status: string }) => ({
        value: s.count,
        color: tokenForTone(s.tone),
        label: s.status,
        tone: s.tone,
      }));
    } else {
      // Fallback: build from ativos/arquivados
      segments = [
        { value: p.ativos, color: 'var(--success)', label: 'Ativos' },
        { value: p.arquivados, color: 'var(--muted-foreground)', label: 'Arquivados' },
      ];
    }
  } else {
    return null;
  }

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Distribuicao por Status"
      icon={PieChart}
      subtitle="Total de processos ativos"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={segments}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col justify-center gap-2.5 flex-1 min-w-0">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <ToneDot tone={seg.tone} color={!seg.tone ? seg.color : undefined} aria-label={seg.label} />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {seg.label}
              </span>
              <span className="text-[10px] font-medium tabular-nums">
                {fmtNum(seg.value)}
              </span>
              <span className="text-[9px] text-muted-foreground/60 w-7 text-right tabular-nums">
                {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
