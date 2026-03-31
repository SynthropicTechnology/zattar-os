'use client';

import { AlertTriangle, TrendingDown } from 'lucide-react';
import {
  WidgetContainer,
  ProgressRing,
  InsightBanner,
  fmtMoeda,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useContasPagarReceber } from '../../hooks';

// ─── Constante de inadimplência ───────────────────────────────────────────────
// Usamos 12% como taxa mock até ter dados de aging precisos

const INADIMPLENCIA_RATE = 0.12;

// ─── WidgetInadimplencia ──────────────────────────────────────────────────────

export function WidgetInadimplencia() {
  const { contasReceber, isLoading, error } = useContasPagarReceber();

  if (isLoading) {
    return <WidgetSkeleton size="sm" />;
  }

  if (error) {
    return (
      <WidgetContainer
        title="Inadimplência"
        subtitle="Sobre carteira a receber"
        icon={AlertTriangle}
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de inadimplência indisponíveis.
        </p>
      </WidgetContainer>
    );
  }

  const totalAReceber = contasReceber?.valor ?? 0;
  const inadimplenciaPercent = Math.round(INADIMPLENCIA_RATE * 100);
  const valorEmAtraso = totalAReceber * INADIMPLENCIA_RATE;
  const isAlert = inadimplenciaPercent > 10;
  const ringColor = isAlert ? 'hsl(var(--destructive))' : 'hsl(var(--success))';

  return (
    <WidgetContainer
      title="Inadimplência"
      subtitle="Sobre carteira a receber"
      icon={AlertTriangle}
    >
      <div className="flex items-center gap-5 mt-1">
        <ProgressRing
          percent={inadimplenciaPercent}
          size={72}
          color={ringColor}
        />
        <div className="flex flex-col gap-1">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
              Em atraso
            </p>
            <p
              className="text-lg font-bold font-display tabular-nums"
              style={{ color: ringColor }}
            >
              {totalAReceber > 0 ? fmtMoeda(valorEmAtraso) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
              Carteira total
            </p>
            <p className="text-sm font-semibold font-display tabular-nums text-muted-foreground/70">
              {totalAReceber > 0 ? fmtMoeda(totalAReceber) : '—'}
            </p>
          </div>
        </div>
      </div>

      {isAlert && (
        <div className="mt-4">
          <InsightBanner type="alert">
            Inadimplência acima do limite recomendado de 10% — atenção à carteira.
          </InsightBanner>
        </div>
      )}

      {!isAlert && (
        <div className="mt-4 pt-3 border-t border-border/10">
          <div className="flex items-center gap-1.5 text-success/60">
            <TrendingDown className="size-3.5" />
            <span className="text-[10px]">Dentro da meta de 10%</span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}
