'use client';

/**
 * Hooks para dados financeiros do dashboard
 *
 * Migrado de: src/app/_lib/hooks/use-dashboard-financeiro.ts
 * Consome Server Actions do módulo financeiro
 */

import { useState, useEffect } from 'react';
import { useDashboard } from './use-dashboard';
import { actionListarOrcamentos, actionObterAnaliseOrcamentaria } from '@/app/(authenticated)/financeiro/actions';
import { AnaliseOrcamentariaUI } from '@/app/(authenticated)/financeiro/actions';

// ============================================================================
// Types
// ============================================================================





// ============================================================================
// Dashboard Financeiro Principal
// ============================================================================

export function useDashboardFinanceiro() {
  const dash = useDashboard();

  return {
    data: dash.data?.dadosFinanceiros ?? null,
    isLoading: dash.isLoading,
    error: dash.error,
    isValidating: false, // Legacy support
    mutate: dash.refetch,
  };
}

// ============================================================================
// Saldo de Contas
// ============================================================================

export function useSaldoContas() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    saldoAtual: dash.data?.saldoTotal ?? 0,
  };
}

// ============================================================================
// Contas a Pagar/Receber
// ============================================================================

export function useContasPagarReceber() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    contasPagar: {
      quantidade: dash.data?.contasPagar?.quantidade || 0,
      valor: dash.data?.contasPagar?.valor || 0,
    },
    contasReceber: {
      quantidade: dash.data?.contasReceber?.quantidade || 0,
      valor: dash.data?.contasReceber?.valor || 0,
    },
  };
}

// ============================================================================
// Fluxo de Caixa
// ============================================================================

export function useFluxoCaixa(meses: number = 6) {
  const dash = useDashboardFinanceiro();

  const fluxo = dash.data?.fluxoCaixaMensal?.map(item => ({
    mes: item.mes,
    receitas: item.receita,
    despesas: item.despesa,
    saldo: item.receita - item.despesa
  })) ?? [];

  return {
    data: fluxo.slice(-meses),
    isLoading: dash.isLoading,
    error: dash.error,
    isValidating: false,
    mutate: () => { },
  };
}

// ============================================================================
// Despesas por Categoria
// ============================================================================

export function useDespesasPorCategoria() {
  const dash = useDashboardFinanceiro();

  const despesasPorCategoria = dash.data?.despesasPorCategoria?.map((c) => ({
    categoria: c.categoria,
    valor: c.valor,
  })) ?? [];

  return {
    despesasPorCategoria,
    isLoading: dash.isLoading,
    error: dash.error,
  };
}

// ============================================================================
// Orçamento Atual
// ============================================================================

export function useOrcamentoAtual() {
  const dash = useDashboardFinanceiro();
  const [orcamento, setOrcamento] = useState<AnaliseOrcamentariaUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();

        // 1. Buscar orçamento em execução para o ano atual
        const resultLista = await actionListarOrcamentos({
          ano: currentYear,
          status: 'em_execucao',
          limite: 1
        });

        if (!resultLista.success) {
          throw new Error(resultLista.error);
        }

        // ListarOrcamentosResponse: items array
        const orcamentos = resultLista.data?.items || [];
        const orcamentoAtivo = orcamentos[0];

        if (!orcamentoAtivo) {
          setLoading(false);
          return;
        }

        // 2. Buscar análise detalhada
        const resultAnalise = await actionObterAnaliseOrcamentaria(orcamentoAtivo.id);

        if (!resultAnalise.success) {
          console.error('[Dashboard Financeiro] Erro ao buscar análise:', resultAnalise.error);
          return;
        }

        setOrcamento(resultAnalise.data);

      } catch (err) {
        console.error('[Dashboard Financeiro] Erro ao buscar orçamento:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    ...dash,
    orcamentoAtual: orcamento,
    isOrcamentoLoading: loading,
    orcamentoError: error
  };
}

// ============================================================================
// Alertas Financeiros
// ============================================================================

export function useAlertasFinanceiros() {
  const dash = useDashboardFinanceiro();

  // Gerar alertas baseado nos dados
  const alertas: { tipo: string; mensagem: string }[] = [];

  if (dash.data?.alertas) {
    alertas.push(...dash.data.alertas);
  }

  return {
    ...dash,
    alertas,
  };
}


