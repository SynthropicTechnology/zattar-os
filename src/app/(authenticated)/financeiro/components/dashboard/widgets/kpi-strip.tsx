'use client';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
} from 'lucide-react';
import { StatCard } from '@/app/(authenticated)/dashboard/components/widgets/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardFinanceiroData } from '@/app/(authenticated)/financeiro/actions/dashboard';

// ============================================================================
// Helpers
// ============================================================================

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(valor) >= 1_000_000 ? 'compact' : 'standard',
  }).format(valor);

/**
 * Calcula a variação percentual entre dois valores.
 * Retorna null se o valor anterior for zero (evita divisão por zero).
 */
function calcularVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 100);
}

// ============================================================================
// Types
// ============================================================================

interface KpiStripProps {
  data: DashboardFinanceiroData;
  isLoading: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function KpiStrip({ data, isLoading }: KpiStripProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 sm:p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Calcular variações a partir da evolução mensal
  const evolucao = data.evolucaoMensal || [];
  const _mesAtualIdx = evolucao.length - 1;
  const mesAnteriorIdx = evolucao.length - 2;

  const receitaAnterior = mesAnteriorIdx >= 0 ? evolucao[mesAnteriorIdx].receitas : 0;
  const despesaAnterior = mesAnteriorIdx >= 0 ? evolucao[mesAnteriorIdx].despesas : 0;
  const saldoAnterior = mesAnteriorIdx >= 0 ? evolucao[mesAnteriorIdx].saldo : 0;

  const varReceita = calcularVariacao(data.receitasMes, receitaAnterior);
  const varDespesa = calcularVariacao(data.despesasMes, despesaAnterior);
  const varSaldo = calcularVariacao(data.saldoMes, saldoAnterior);

  const kpis = [
    {
      title: 'Resultado do Mês',
      value: formatarMoeda(data.saldoMes),
      change: varSaldo,
      changeLabel: 'vs mês anterior',
      trend: data.saldoMes >= 0 ? ('up' as const) : ('down' as const),
      icon: Wallet,
      variant: 'default' as const,
      href: '/app/financeiro/dre',
    },
    {
      title: 'Receitas',
      value: formatarMoeda(data.receitasMes),
      change: varReceita,
      changeLabel: 'vs mês anterior',
      trend: (varReceita !== null && varReceita >= 0) ? ('up' as const) : ('down' as const),
      icon: TrendingUp,
      variant: 'success' as const,
      href: '/app/financeiro/contas-receber',
    },
    {
      title: 'Despesas',
      value: formatarMoeda(data.despesasMes),
      change: varDespesa,
      changeLabel: 'vs mês anterior',
      trend: (varDespesa !== null && varDespesa <= 0) ? ('down' as const) : ('up' as const),
      icon: TrendingDown,
      variant: 'danger' as const,
      href: '/app/financeiro/contas-pagar',
    },
    {
      title: 'A Receber',
      value: formatarMoeda(data.receitasPendentes),
      description: `${data.qtdReceitasPendentes} pendente${data.qtdReceitasPendentes !== 1 ? 's' : ''}`,
      icon: ArrowDownToLine,
      variant: 'info' as const,
      href: '/app/financeiro/contas-receber',
    },
    {
      title: 'A Pagar',
      value: formatarMoeda(data.despesasPendentes),
      description: 'Total pendente',
      icon: ArrowUpFromLine,
      variant: 'warning' as const,
      href: '/app/financeiro/contas-pagar',
    },
    {
      title: 'Vencidas',
      value: formatarMoeda(data.valorVencido),
      description: `${data.contasVencidas} conta${data.contasVencidas !== 1 ? 's' : ''} em atraso`,
      icon: AlertTriangle,
      variant: 'danger' as const,
      href: '/app/financeiro/contas-pagar',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change ?? undefined}
          changeLabel={kpi.changeLabel}
          description={kpi.description}
          trend={kpi.trend ?? 'neutral'}
          icon={kpi.icon}
          variant={kpi.variant}
          href={kpi.href}
        />
      ))}
    </div>
  );
}
