'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  actionListarFolhasPagamento, 
  actionBuscarFolhaPagamento,
  actionBuscarFolhaPorPeriodo,
  actionGerarFolhaPagamento,
  actionPreviewGerarFolha,
  actionAtualizarFolhaPagamento,
  actionAprovarFolhaPagamento,
  actionPagarFolhaPagamento,
  actionVerificarCancelamentoFolha,
  actionCancelarFolhaPagamento,
  actionExcluirFolhaPagamento,
  actionObterResumoPagamento
} from '../actions/folhas-pagamento-actions';
import type {
  FolhaPagamentoComDetalhes,
  ListarFolhasParams,
  TotaisFolhasPorStatus,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO
} from '../domain';

// ============================================================================
// Types
// ============================================================================

interface UseFolhasPagamentoParams extends ListarFolhasParams {
  incluirTotais?: boolean;
}

interface UseFolhasPagamentoResult {
  folhas: FolhaPagamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  totais: TotaisFolhasPorStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Principal
// ============================================================================

export const useFolhasPagamento = (params: UseFolhasPagamentoParams = {}): UseFolhasPagamentoResult => {
  const [folhas, setFolhas] = useState<FolhaPagamentoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseFolhasPagamentoResult['paginacao']>(null);
  const [totais, setTotais] = useState<TotaisFolhasPorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarFolhas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const actionParams: UseFolhasPagamentoParams = {
        pagina: params.pagina,
        limite: params.limite,
        mesReferencia: params.mesReferencia,
        anoReferencia: params.anoReferencia,
        status: params.status,
        ordenarPor: params.ordenarPor,
        ordem: params.ordem,
        incluirTotais: params.incluirTotais,
      };

      const result = await actionListarFolhasPagamento(actionParams);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar folhas de pagamento');
      }

      setFolhas(result.data.items);
      setPaginacao(result.data.paginacao);
      setTotais(result.data.totais || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folhas de pagamento';
      setError(errorMessage);
      setFolhas([]);
      setPaginacao(null);
      setTotais(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.mesReferencia,
    params.anoReferencia,
    params.status,
    params.ordenarPor,
    params.ordem,
    params.incluirTotais,
  ]);

  useEffect(() => {
    buscarFolhas();
  }, [buscarFolhas]);

  return {
    folhas,
    paginacao,
    totais,
    isLoading,
    error,
    refetch: buscarFolhas,
  };
};

// ============================================================================
// Hook para Folha Individual
// ============================================================================

interface UseFolhaPagamentoResult {
  folha: FolhaPagamentoComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFolhaPagamento = (id: number | null): UseFolhaPagamentoResult => {
  const [folha, setFolha] = useState<FolhaPagamentoComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarFolha = useCallback(async () => {
    if (!id) {
      setFolha(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionBuscarFolhaPagamento(id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar folha de pagamento');
      }

      setFolha(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folha de pagamento';
      setError(errorMessage);
      setFolha(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarFolha();
  }, [buscarFolha]);

  return {
    folha,
    isLoading,
    error,
    refetch: buscarFolha,
  };
};

// ============================================================================
// Hook para Folha por Período
// ============================================================================

interface UseFolhaDoPeriodoParams {
  ano: number | null;
  mes: number | null;
}

export const useFolhaDoPeriodo = (params: UseFolhaDoPeriodoParams): UseFolhaPagamentoResult => {
  const [folha, setFolha] = useState<FolhaPagamentoComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarFolhaDoPeriodo = useCallback(async () => {
    if (!params.ano || !params.mes) {
      setFolha(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionBuscarFolhaPorPeriodo(params.mes, params.ano);

      if (!result.success) {
         // handle not found as null, not error
         if (result.error && result.error.includes('encontrada')) { 
             setFolha(null);
             return;
         }
         throw new Error(result.error || 'Erro ao buscar folha');
      }
      
      if (!result.data) {
          setFolha(null);
          return;
      }

      setFolha(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folha do período';
      setError(errorMessage);
      setFolha(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.ano, params.mes]);

  useEffect(() => {
    buscarFolhaDoPeriodo();
  }, [buscarFolhaDoPeriodo]);

  return {
    folha,
    isLoading,
    error,
    refetch: buscarFolhaDoPeriodo,
  };
};

// ============================================================================
// Mutation Functions
// ============================================================================

interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const previewGerarFolha = async (
  mesReferencia: number,
  anoReferencia: number
): Promise<MutationResult<{
  salariosVigentes: Array<{
    usuarioId: number;
    nomeExibicao: string;
    cargo?: string;
    salarioBruto: number;
  }>;
  valorTotal: number;
  totalFuncionarios: number;
  periodoLabel: string;
}>> => {
  try {
    const result = await actionPreviewGerarFolha(mesReferencia, anoReferencia);
    return result as MutationResult<{
      salariosVigentes: Array<{
        usuarioId: number;
        nomeExibicao: string;
        cargo?: string;
        salarioBruto: number;
      }>;
      valorTotal: number;
      totalFuncionarios: number;
      periodoLabel: string;
    }>; 
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao gerar preview' };
  }
};

export const gerarFolha = async (dados: GerarFolhaDTO): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const formData = new FormData();
    formData.append('mesReferencia', dados.mesReferencia.toString());
    formData.append('anoReferencia', dados.anoReferencia.toString());
    if (dados.dataPagamento) formData.append('dataPagamento', dados.dataPagamento);
    if (dados.observacoes) formData.append('observacoes', dados.observacoes);

    const result = await actionGerarFolhaPagamento(formData);
    return result as MutationResult<FolhaPagamentoComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao gerar folha' };
  }
};

export const atualizarFolha = async (
  id: number,
  dados: { dataPagamento?: string | null; observacoes?: string | null }
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const formData = new FormData();
    if (dados.dataPagamento !== undefined) formData.append('dataPagamento', dados.dataPagamento || '');
    if (dados.observacoes !== undefined) formData.append('observacoes', dados.observacoes || '');

    const result = await actionAtualizarFolhaPagamento(id, formData);
    return result as MutationResult<FolhaPagamentoComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar folha' };
  }
};

export const aprovarFolha = async (
  id: number,
  dados: AprovarFolhaDTO
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const formData = new FormData();
    formData.append('contaBancariaId', dados.contaBancariaId.toString());
    formData.append('contaContabilId', dados.contaContabilId.toString());
    if (dados.centroCustoId) formData.append('centroCustoId', dados.centroCustoId.toString());
    if (dados.observacoes) formData.append('observacoes', dados.observacoes);

    const result = await actionAprovarFolhaPagamento(id, formData);
    return result as MutationResult<FolhaPagamentoComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao aprovar folha' };
  }
};

export const pagarFolha = async (
  id: number,
  dados: PagarFolhaDTO
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const formData = new FormData();
    formData.append('formaPagamento', dados.formaPagamento);
    formData.append('contaBancariaId', dados.contaBancariaId.toString());
    if (dados.dataEfetivacao) formData.append('dataEfetivacao', dados.dataEfetivacao);
    if (dados.observacoes) formData.append('observacoes', dados.observacoes);

    const result = await actionPagarFolhaPagamento(id, formData);
    return result as MutationResult<FolhaPagamentoComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao pagar folha' };
  }
};

export const verificarCancelamentoFolha = async (id: number): Promise<MutationResult<{
  podeCancelar: boolean;
  motivo?: string;
  status: string;
  temLancamentosPagos: boolean;
}>> => {
  try {
    const result = await actionVerificarCancelamentoFolha(id);
    return result as MutationResult<{
      podeCancelar: boolean;
      motivo?: string;
      status: string;
      temLancamentosPagos: boolean;
    }>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao verificar cancelamento' };
  }
};

export const cancelarFolha = async (
  id: number,
  motivo?: string
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const result = await actionCancelarFolhaPagamento(id, motivo);
    return result as MutationResult<FolhaPagamentoComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao cancelar folha' };
  }
};

export const excluirFolha = async (id: number): Promise<MutationResult> => {
  try {
    const result = await actionExcluirFolhaPagamento(id);
    return result;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao excluir folha' };
  }
};

export const obterResumoParaPagamento = async (id: number): Promise<MutationResult<{
  totalBruto: number;
  totalItens: number;
  itensPendentes: number;
  itensConfirmados: number;
}>> => {
  try {
    const result = await actionObterResumoPagamento(id);
    return result as MutationResult<{
      totalBruto: number;
      totalItens: number;
      itensPendentes: number;
      itensConfirmados: number;
    }>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao obter resumo' };
  }
};
