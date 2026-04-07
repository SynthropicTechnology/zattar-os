'use client';

/**
 * Widget: Audiencias por Tipo
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.porTipo.
 * Exibe barras horizontais com labels, valores, cores e total.
 *
 * Uso:
 *   import { AudienciasPorTipo } from '@/app/(authenticated)/dashboard/widgets/audiencias/por-tipo'
 * ============================================================================
 */

import { Gavel } from 'lucide-react';
import {
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';

export function AudienciasPorTipo() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="md" />;

  const porTipo = audiencias.porTipo;

  if (!porTipo || porTipo.length === 0) {
    return (
      <WidgetContainer
        title="Por Tipo"
        icon={Gavel}
        subtitle="Distribuicao por tipo de audiencia"
      >
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Gavel className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Dados por tipo indisponiveis
          </p>
        </div>
      </WidgetContainer>
    );
  }

  const maxCount = Math.max(...porTipo.map((t) => t.count), 1);
  const total = porTipo.reduce((acc, t) => acc + t.count, 0);

  return (
    <WidgetContainer
      title="Por Tipo"
      icon={Gavel}
      subtitle="Distribuicao por tipo de audiencia"
    >
      <div className="space-y-2.5">
        {porTipo.map((item) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.tipo} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground/70 truncate">
                  {item.tipo}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-medium tabular-nums">
                    {fmtNum(item.count)}
                  </span>
                  <span className="text-muted-foreground/50 text-[10px] tabular-nums">
                    ({pct}%)
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-border/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: tokenForTone(item.tone),
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            Total
          </span>
          <span className="text-[12px] font-bold tabular-nums">
            {fmtNum(total)}
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}
