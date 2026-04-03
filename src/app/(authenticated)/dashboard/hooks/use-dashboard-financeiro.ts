'use client';

/**
 * Hooks para dados financeiros do dashboard
 *
 * Migrado de: src/app/_lib/hooks/use-dashboard-financeiro.ts
 * Consome Server Actions do módulo financeiro
 */

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  actionObterDashboardFinanceiro,
  actionObterFluxoCaixaPorPeriodo,
  actionObterTopCategorias,
  actionListarOrcamentos,
  actionObterAnaliseOrcamentaria
} from '@/app/(authenticated)/financeiro/server-actions';
import { AnaliseOrcamentariaUI } from '@/app/(authenticated)/financeiro/actions';

// ============================================================================
// Types
// ============================================================================

interface FluxoCaixaChartData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo?: number;
}

interface CategoriaValor {
  categoria: string;
  valor: number;
}

// ============================================================================
// Dashboard Financeiro Principal
// ============================================================================

const dashboardFetcher = async () => {
  const result = await actionObterDashboardFinanceiro();
  if (!result.success) throw new Error(result.error);
  return result.data;
};

export function useDashboardFinanceiro() {
  const { data, error, isValidating, mutate } = useSWR(
    'dashboard-financeiro',
    dashboardFetcher,
    {
      refreshInterval: 30000, // 30 segundos
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    isLoading: !data && !error,
    error,
    isValidating,
    mutate,
  };
}

// ============================================================================
// Saldo de Contas
// ============================================================================

export function useSaldoContas() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    saldoAtual: dash.data?.saldoMes ?? 0,
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
      quantidade: dash.data?.contasVencidas || 0,
      valor: dash.data?.despesasPendentes || 0,
    },
    contasReceber: {
      quantidade: 0,
      valor: dash.data?.receitasPendentes || 0,
    },
  };
}

// ============================================================================
// Fluxo de Caixa
// ============================================================================

export function useFluxoCaixa(meses: number = 6) {
  const [data, setData] = useState<FluxoCaixaChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hoje = new Date();
        // Inicio: X meses atras
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);
        // Fim: 6 meses no futuro para incluir projeções
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 6, 0);

        // Usar a action correta que retorna dados agrupados por período
        const result = await actionObterFluxoCaixaPorPeriodo(
          {
            dataInicio: inicio.toISOString(),
            dataFim: fim.toISOString(),
            incluirProjetado: true,
          },
          'mes' // Agrupamento mensal
        );

        if (result.success && result.data) {
          const periodos = result.data;
          const dadosGrafico = periodos.map(p => ({
            mes: p.periodo,
            receitas: p.totalEntradas,
            despesas: p.totalSaidas,
            saldo: p.saldoFinal,
          }));

          setData(dadosGrafico);
        } else {
          const errorMsg = !result.success ? result.error : 'Erro ao buscar fluxo de caixa';
          console.error('[Dashboard Financeiro] Erro ao buscar fluxo de caixa:', errorMsg);
          setError(new Error(errorMsg));
        }
      } catch (err) {
        console.error('[Dashboard Financeiro] Erro inesperado no fluxo de caixa:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meses]);

  return {
    data,
    isLoading: loading,
    error,
    isValidating: loading,
    mutate: () => {},
  };
}

// ============================================================================
// Despesas por Categoria
// ============================================================================

export function useDespesasPorCategoria() {
  const [data, setData] = useState<CategoriaValor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await actionObterTopCategorias('despesa', 5);

        if (result.success && result.data) {
          const categorias = result.data.categorias || [];

          setData(categorias.map((c) => ({
            categoria: c.categoria,
            valor: c.valor,
          })));
        } else {
          console.error('[Dashboard Financeiro] Erro ao buscar categorias:', result.error);
          setError(new Error(result.error || 'Erro ao buscar categorias'));
        }
      } catch (err) {
        console.error('[Dashboard Financeiro] Erro inesperado nas categorias:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    despesasPorCategoria: data,
    isLoading: loading,
    error,
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

  if (dash.data) {
    if (dash.data.contasVencidas > 0) {
      alertas.push({
        tipo: 'danger',
        mensagem: `${dash.data.contasVencidas} conta(s) vencida(s) no valor de ${formatarMoeda(dash.data.valorVencido)}`,
      });
    }

    if (dash.data.despesasMes > dash.data.receitasMes) {
      alertas.push({
        tipo: 'warning',
        mensagem: 'Despesas do mês superam as receitas',
      });
    }
  }

  return {
    ...dash,
    alertas,
  };
}

// Helper para formatar moeda
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
