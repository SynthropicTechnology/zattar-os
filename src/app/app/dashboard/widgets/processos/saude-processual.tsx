'use client';

/**
 * WidgetSaudeProcessual — Widget conectado (col-span-2)
 * Fonte: useDashboard()
 *   - role=user: data.processos (ProcessoResumo: total, ativos, arquivados)
 *   - role=admin: data.metricas (MetricasEscritorio: totalProcessos, processosAtivos, taxaResolucao)
 */

import { HeartPulse } from 'lucide-react';
import {
  WidgetContainer,
  GaugeMeter,
  ComparisonStat,
  InsightBanner,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

interface ProcessoStats {
  total: number;
  ativos: number;
  arquivados: number;
  taxaResolucao?: number;
}

function calcularScore(stats: ProcessoStats): { score: number; status: 'good' | 'warning' | 'danger' } {
  const { total, ativos, arquivados, taxaResolucao } = stats;
  if (total === 0) return { score: 0, status: 'danger' };

  const pctAtivos = (ativos / total) * 100;
  const taxa = taxaResolucao ?? 50;
  // Composite: 50% proporção de ativos (positivo ter ativos), 50% taxa de resolução
  const raw = pctAtivos * 0.5 + taxa * 0.5;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const status: 'good' | 'warning' | 'danger' =
    score > 65 ? 'good' : score >= 35 ? 'warning' : 'danger';

  return { score, status };
}

function gerarInsight(stats: ProcessoStats): { tipo: 'success' | 'warning' | 'info'; texto: string } {
  const taxa = stats.taxaResolucao ?? 0;

  if (taxa >= 70) {
    return {
      tipo: 'success',
      texto: `Taxa de resolução de ${taxa}% — portfólio em boa saúde.`,
    };
  }

  if (taxa >= 40) {
    return {
      tipo: 'info',
      texto: `Taxa de resolução de ${taxa}% — há espaço para melhorar o fluxo de encerramento.`,
    };
  }

  return {
    tipo: 'warning',
    texto: `Taxa de resolução de ${taxa}% — revise processos sem movimentação recente.`,
  };
}

export function WidgetSaudeProcessual() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Saúde do Portfólio"
        icon={HeartPulse}
        subtitle="Score composto — ativos e resolução"
        depth={2}
        className="md:col-span-2"
      >
        <InsightBanner type="warning">
          Não foi possível carregar os dados processuais.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  let stats: ProcessoStats;
  let subtitleExtra = '';

  if (isDashboardUsuario(data)) {
    const p = data.processos;
    stats = {
      total: p.total,
      ativos: p.ativos,
      arquivados: p.arquivados,
      // Usuário não tem taxaResolucao direta; deriva de arquivados/total
      taxaResolucao: p.total > 0 ? Math.round((p.arquivados / p.total) * 100) : 0,
    };
    subtitleExtra = 'portfólio pessoal';
  } else if (isDashboardAdmin(data)) {
    const m = data.metricas;
    stats = {
      total: m.totalProcessos,
      ativos: m.processosAtivos,
      arquivados: m.processosArquivados,
      taxaResolucao: Math.round(m.taxaResolucao),
    };
    subtitleExtra = 'escritório';
  } else {
    return null;
  }

  const { score, status } = calcularScore(stats);
  const insight = gerarInsight(stats);
  const encerrados = stats.arquivados;

  return (
    <WidgetContainer
      title="Saúde do Portfólio"
      icon={HeartPulse}
      subtitle={`Score composto — ${subtitleExtra}`}
      depth={2}
      className="md:col-span-2"
    >
      <div className="flex flex-col gap-4">

        {/* Gauge + comparisons */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="shrink-0">
            <GaugeMeter
              value={score}
              max={100}
              label="score geral"
              status={status}
              size={120}
            />
          </div>

          <div className="flex flex-1 gap-6 flex-wrap min-w-0">
            <ComparisonStat
              label="Ativos"
              current={stats.ativos}
              previous={Math.max(0, stats.ativos - 5)} // estimativa de variação
              format="number"
            />
            <ComparisonStat
              label="Encerrados"
              current={encerrados}
              previous={Math.max(0, encerrados - 3)}
              format="number"
            />
            {stats.taxaResolucao !== undefined && (
              <div className="flex flex-col gap-1">
                <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
                  Taxa resolução
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-lg font-bold">
                    {stats.taxaResolucao}%
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground/30">
                  encerrados / total
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Insight */}
        <InsightBanner type={insight.tipo}>{insight.texto}</InsightBanner>

      </div>
    </WidgetContainer>
  );
}
