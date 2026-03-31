'use client';

/**
 * Widget: Heatmap de Atividade — Processos
 * ============================================================================
 * Conectado ao hook useDashboard().
 * Usa produtividade.porDia (últimos N dias de baixas) para preencher um grid
 * de 35 células (5 semanas × 7 dias). Os dias sem dados são preenchidos com 0.
 * Esta é uma solução temporária — o heatmap completo aguarda um repositório
 * de dados de atividade dedicado.
 *
 * Uso:
 *   import { WidgetHeatmapAtividade } from '@/app/app/dashboard/widgets/processos/heatmap-atividade'
 * ============================================================================
 */

import { Activity } from 'lucide-react';
import {
  CalendarHeatmap,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks/use-dashboard';

export function WidgetHeatmapAtividade() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  // Obter porDia de produtividade — disponível apenas no perfil de usuário.
  // Para admin, usar as baixas médias por advogado como estimativa de atividade.
  const porDia =
    data.role === 'user'
      ? data.produtividade.porDia
      : [];

  const mediaDiaria =
    data.role === 'user'
      ? data.produtividade.mediaDiaria
      : 0;

  // Construir array de 35 posições (5 semanas × 7 dias).
  // Preenche do fim para o início: as últimas N posições com dados reais,
  // o restante com zeros.
  const CELLS = 35;
  const heatmapData = Array<number>(CELLS).fill(0);

  if (porDia.length > 0) {
    const slice = porDia.slice(-CELLS);
    const startIdx = CELLS - slice.length;
    slice.forEach((entry, i) => {
      heatmapData[startIdx + i] = entry.baixas;
    });
  }

  const pico   = Math.max(...heatmapData, 0);
  const media  = porDia.length > 0
    ? (heatmapData.reduce((a, b) => a + b, 0) / Math.max(porDia.length, 1))
    : mediaDiaria;
  const mediaFmt = media.toFixed(1);

  return (
    <WidgetContainer
      title="Heatmap de Atividade"
      icon={Activity}
      subtitle="Baixas por dia — últimas 5 semanas"
      depth={1}
    >
      <div className="flex flex-col gap-4 mt-1">
        <CalendarHeatmap data={heatmapData} colorScale="primary" />

        {/* Legenda de intensidade */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Intensidade:
          </span>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-[3px] bg-border/10" />
            <div className="size-3 rounded-[3px] bg-primary/15" />
            <div className="size-3 rounded-[3px] bg-primary/30" />
            <div className="size-3 rounded-[3px] bg-primary/50" />
            <div className="size-3 rounded-[3px] bg-primary/80" />
          </div>
          <div className="flex items-center gap-1 ml-1">
            <span className="text-[9px] text-muted-foreground/30">Nenhum</span>
            <span className="text-[9px] text-muted-foreground/30">→</span>
            <span className="text-[9px] text-primary/60">Alto</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="pt-3 border-t border-border/10 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
              Média diária
            </span>
            <span className="font-display text-lg font-bold">{mediaFmt}</span>
            <span className="text-[9px] text-muted-foreground/30">baixas / dia</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
              Pico
            </span>
            <span className="font-display text-lg font-bold">
              {fmtNum(pico)}
            </span>
            <span className="text-[9px] text-muted-foreground/30">maior valor do período</span>
          </div>
        </div>

        {porDia.length === 0 && (
          <p className="text-[9px] text-muted-foreground/30 text-center">
            Dados de atividade diária em desenvolvimento para o perfil admin
          </p>
        )}
      </div>
    </WidgetContainer>
  );
}
