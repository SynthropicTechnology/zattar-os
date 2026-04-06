/**
 * DASHBOARD FEATURE - Financeiro Metrics Repository
 *
 * Dados financeiros consolidados para o dashboard.
 * Responsabilidades:
 * - Saldo, contas a pagar/receber, alertas
 */

import { getDashboardFinanceiro } from '@/app/(authenticated)/financeiro/services/dashboard';
import { formatarMoeda } from './shared/formatters';
import type { DadosFinanceirosConsolidados } from '../domain';

/**
 * Busca dados financeiros consolidados para o dashboard
 * Consolida saldo, contas a pagar/receber e alertas em uma única chamada
 */
export async function buscarDadosFinanceirosConsolidados(
  usuarioId?: number
): Promise<DadosFinanceirosConsolidados> {
  try {
    // Buscar dados do dashboard financeiro
    const dashboardData = await getDashboardFinanceiro(usuarioId?.toString() || 'system');

    // Gerar alertas baseado nos dados
    const alertas: { tipo: string; mensagem: string }[] = [];

    if (dashboardData.contasVencidas > 0) {
      alertas.push({
        tipo: 'danger',
        mensagem: `${dashboardData.contasVencidas} conta(s) vencida(s) no valor de ${formatarMoeda(dashboardData.valorVencido)}`,
      });
    }

    if (dashboardData.despesasMes > dashboardData.receitasMes) {
      alertas.push({
        tipo: 'warning',
        mensagem: 'Despesas do mês superam as receitas',
      });
    }

    return {
      saldoTotal: dashboardData.saldoMes || 0,
      contasPagar: {
        quantidade: dashboardData.qtdDespesasPendentes || 0,
        valor: dashboardData.despesasPendentes || 0,
      },
      contasReceber: {
        quantidade: dashboardData.qtdReceitasPendentes || 0,
        valor: dashboardData.receitasPendentes || 0,
      },
      alertas,
    };
  } catch (error) {
    console.error('Erro ao buscar dados financeiros consolidados:', error);
    // Retornar dados zerados em caso de erro
    return {
      saldoTotal: 0,
      contasPagar: { quantidade: 0, valor: 0 },
      contasReceber: { quantidade: 0, valor: 0 },
      alertas: [],
    };
  }
}
