'use client';

import dynamic from 'next/dynamic';
import {
  useDashboardFinanceiro,
  useFluxoCaixa,
  useDespesasPorCategoria,
  useContasPagarReceber,
  useAlertasFinanceiros,
  useOrcamentoAtual,
} from '@/app/(authenticated)/dashboard/hooks/use-dashboard-financeiro';
import { useResumoObrigacoes } from '../../hooks/use-obrigacoes';
import { ChartSkeleton } from '../shared/chart-skeleton';
import { DashboardSkeleton } from './dashboard-skeleton';
import { KpiStrip } from './widgets/kpi-strip';
import { DespesasCategoriaChart } from './widgets/despesas-categoria-chart';
import { ObrigacoesWidget } from './widgets/obrigacoes-widget';
import { AlertasWidget } from './widgets/alertas-widget';
import { ContasResumoWidget } from './widgets/contas-resumo-widget';
import { OrcamentoRealizadoWidget } from './widgets/orcamento-realizado-widget';

// ============================================================================
// Lazy-loaded chart widgets (~200KB Recharts bundle)
// ============================================================================

const EvolucaoMensalChart = dynamic(
  () => import('./widgets/evolucao-mensal-chart').then(m => ({ default: m.EvolucaoMensalChart })),
  { ssr: false, loading: () => <ChartSkeleton title="Evolução Mensal (12 meses)" /> }
);

const FluxoCaixaChart = dynamic(
  () => import('./widgets/fluxo-caixa-chart').then(m => ({ default: m.FluxoCaixaChart })),
  { ssr: false, loading: () => <ChartSkeleton title="Fluxo de Caixa" /> }
);

// ============================================================================
// FinanceiroDashboard
// ============================================================================

export function FinanceiroDashboard() {
  // Data hooks
  const { data: dashData, isLoading: isLoadingDash } = useDashboardFinanceiro();
  const { data: fluxoData, isLoading: isLoadingFluxo } = useFluxoCaixa(12);
  const { despesasPorCategoria, isLoading: isLoadingCategorias } = useDespesasPorCategoria();
  const { contasPagar, contasReceber, isLoading: isLoadingContas } = useContasPagarReceber();
  const { alertas, isLoading: isLoadingAlertas } = useAlertasFinanceiros();
  const { orcamentoAtual, isOrcamentoLoading } = useOrcamentoAtual();
  const { resumo: resumoObrigacoes, isLoading: isLoadingObrigacoes } = useResumoObrigacoes();

  // Full-page skeleton while primary data loads
  if (isLoadingDash && !dashData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ================================================================
          Tier 1 — KPI Strip (visão instantânea)
          6 métricas críticas com tendência % vs mês anterior
          ================================================================ */}
      <KpiStrip
        data={dashData!}
        isLoading={isLoadingDash}
      />

      {/* ================================================================
          Tier 2 — Análise de Tendências
          Evolução 12 meses (2/3) + Despesas por Categoria (1/3)
          ================================================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EvolucaoMensalChart data={dashData?.evolucaoMensal || []} />
        </div>
        <DespesasCategoriaChart
          data={despesasPorCategoria || []}
          isLoading={isLoadingCategorias}
        />
      </div>

      {/* ================================================================
          Tier 3 — Projeção e Planejamento
          Fluxo de Caixa (2/3) + Orçamento vs Realizado (1/3)
          ================================================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FluxoCaixaChart
            data={fluxoData || []}
            isLoading={isLoadingFluxo}
          />
        </div>
        <OrcamentoRealizadoWidget
          data={orcamentoAtual}
          isLoading={isOrcamentoLoading}
        />
      </div>

      {/* ================================================================
          Tier 4 — Operacional
          Obrigações + Alertas + Contas Pagar/Receber
          ================================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ObrigacoesWidget
          resumo={resumoObrigacoes}
          isLoading={isLoadingObrigacoes}
        />
        <AlertasWidget
          alertas={alertas || []}
          isLoading={isLoadingAlertas}
        />
        <ContasResumoWidget
          contasPagar={contasPagar}
          contasReceber={contasReceber}
          isLoading={isLoadingContas}
        />
      </div>
    </div>
  );
}
