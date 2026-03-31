'use client';

/**
 * WidgetProdutividadeSemanal — Widget conectado
 * Fonte: useDashboard() → data.produtividade.porDia (role=user)
 *        useDashboard() → sem porDia (role=admin) → mostra mensagem
 */

import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  MiniBar,
  InsightBanner,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

// Abreviações dos dias da semana em PT-BR
const DIA_LABELS: Record<string, string> = {
  '0': 'Dom',
  '1': 'Seg',
  '2': 'Ter',
  '3': 'Qua',
  '4': 'Qui',
  '5': 'Sex',
  '6': 'Sáb',
};

function getDiaSemanaLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DIA_LABELS[String(d.getDay())] ?? dateStr.slice(5);
}

export function WidgetProdutividadeSemanal() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data || !isDashboardUsuario(data)) {
    return (
      <WidgetContainer
        title="Produtividade Semanal"
        icon={BarChart3}
        subtitle="Baixas por dia da semana"
        depth={1}
      >
        <InsightBanner type="info">
          Dados de produtividade individual não disponíveis para administradores.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  const { porDia, mediaDiaria, baixasSemana } = data.produtividade;

  // Pega os últimos 5 dias úteis (até 7 registros)
  const semana = porDia.slice(-7);

  if (semana.length === 0) {
    return (
      <WidgetContainer
        title="Produtividade Semanal"
        icon={BarChart3}
        subtitle="Baixas por dia da semana"
        depth={1}
      >
        <InsightBanner type="info">
          Nenhum dado de produtividade registrado esta semana.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  const barData = semana.map((d) => ({
    label: getDiaSemanaLabel(d.data),
    value: d.baixas,
  }));

  const total = semana.reduce((acc, d) => acc + d.baixas, 0);
  const media = total > 0 ? Math.round(total / semana.length) : 0;
  const melhorDia = semana.reduce((best, d) => (d.baixas > best.baixas ? d : best), semana[0]);

  const insightText =
    media >= 5
      ? `Média de ${media} baixas/dia — semana acima da meta.`
      : `Média de ${media} baixas/dia — abaixo da média histórica de ${Math.round(mediaDiaria)}.`;

  const insightType: 'success' | 'warning' = media >= 5 ? 'success' : 'warning';

  return (
    <WidgetContainer
      title="Produtividade Semanal"
      icon={BarChart3}
      subtitle="Baixas por dia — semana atual"
      depth={1}
    >
      <div className="flex items-end justify-between gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Total semana
          </span>
          <span className="font-display text-lg font-bold tabular-nums">
            {fmtNum(baixasSemana || total)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Média diária
          </span>
          <span className="font-display text-base font-bold tabular-nums text-primary/80">
            {media}
          </span>
        </div>
      </div>

      <MiniBar data={barData} height={64} barColor="bg-primary/60" />

      {melhorDia && (
        <div className="mt-3 pt-3 border-t border-border/10 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/40">
            Melhor dia: {getDiaSemanaLabel(melhorDia.data)}
          </span>
          <span className="text-[9px] font-semibold tabular-nums text-primary/70">
            {melhorDia.baixas} baixas
          </span>
        </div>
      )}

      <div className="mt-3">
        <InsightBanner type={insightType}>{insightText}</InsightBanner>
      </div>
    </WidgetContainer>
  );
}
