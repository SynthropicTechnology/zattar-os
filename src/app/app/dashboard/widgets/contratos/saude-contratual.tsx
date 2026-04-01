'use client';

/**
 * Widget: Saúde Contratual
 * ============================================================================
 * Conectado ao módulo de contratos via actionContratosStats().
 * Calcula score de saúde baseado em taxa de conversão e distribuição.
 *
 * Uso:
 *   import { WidgetSaudeContratual } from '@/app/app/dashboard/widgets/contratos/saude-contratual'
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import {
  GaugeMeter,
  InsightBanner,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { actionContratosStats, type ContratosStatsData } from '@/features/contratos/actions/contratos-actions';

type GaugeStatus = 'good' | 'warning' | 'danger' | 'neutral';

function calcScoreContratual(stats: ContratosStatsData): { score: number; status: GaugeStatus } {
  // Score baseado em: taxa de conversão (peso 60%) + novos no mês (peso 20%) + sem desistência (peso 20%)
  const taxaConv = Math.min(stats.taxaConversao, 100);
  const desistencias = stats.porStatus['desistencia']?.count ?? 0;
  const taxaDesistencia = stats.total > 0 ? (desistencias / stats.total) * 100 : 0;
  const novosMesScore = Math.min(stats.novosMes * 10, 100); // até 10 novos = 100%

  const score = Math.round(
    taxaConv * 0.6 +
    novosMesScore * 0.2 +
    Math.max(100 - taxaDesistencia * 5, 0) * 0.2
  );

  const clampedScore = Math.min(Math.max(score, 0), 100);
  const status: GaugeStatus = clampedScore >= 70 ? 'good' : clampedScore >= 40 ? 'warning' : 'danger';

  return { score: clampedScore, status };
}

export function WidgetSaudeContratual() {
  const [stats, setStats] = useState<ContratosStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await actionContratosStats();
        if (result.success) {
          setStats(result.data);
        }
      } catch {
        // silently fail — widget mostra skeleton
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!stats) return <WidgetSkeleton size="md" />;

  const { score, status } = calcScoreContratual(stats);
  const ativos = (stats.porStatus['contratado']?.count ?? 0) + (stats.porStatus['distribuido']?.count ?? 0);
  const emContratacao = stats.porStatus['em_contratacao']?.count ?? 0;

  return (
    <WidgetContainer
      title="Saúde Contratual"
      icon={HeartPulse}
      subtitle="Score consolidado da carteira de contratos"
      depth={2}
      className="md:col-span-2"
    >
      <div className="flex flex-col items-center gap-4 mt-1">
        <div className="flex flex-col items-center gap-1">
          <GaugeMeter
            value={score}
            max={100}
            label="score contratual"
            status={status}
            size={120}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 w-full pt-3 border-t border-border/10">
          {[
            { label: 'Contratos Ativos', value: fmtNum(ativos) },
            { label: 'Novos no Mês', value: fmtNum(stats.novosMes) },
            { label: 'Em Contratação', value: fmtNum(emContratacao) },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider text-center">
                {item.label}
              </span>
              <span className="font-display text-xl font-bold">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {stats.novosMes > 0 && (
          <InsightBanner type="success">
            {stats.novosMes} novo(s) contrato(s) este mês — taxa de conversão em {stats.taxaConversao}%.
          </InsightBanner>
        )}

        {stats.total === 0 && (
          <InsightBanner type="info">
            Nenhum contrato cadastrado ainda.
          </InsightBanner>
        )}
      </div>
    </WidgetContainer>
  );
}
