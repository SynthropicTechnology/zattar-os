'use client';

/**
 * Hook para buscar perícias com filtros e paginação
 *
 * Segue o padrão de src/features/expedientes/hooks/use-expedientes.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Pericia, ListarPericiasParams, SituacaoPericiaCodigo } from '../domain';
import type { PaginatedResponse } from '@/types';
import { actionListarPericias } from '../actions/pericias-actions';

// Verificação SSR
const isClient = typeof window !== 'undefined';

// =============================================================================
// TIPOS
// =============================================================================

export interface BuscarPericiasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  situacaoCodigo?: SituacaoPericiaCodigo;
  situacoesExcluidas?: SituacaoPericiaCodigo[];
  responsavelId?: number | 'null';
  semResponsavel?: boolean;
  laudoJuntado?: boolean;
  prazoEntregaInicio?: string;
  prazoEntregaFim?: string;
  dataCriacaoInicio?: string;
  dataCriacaoFim?: string;
  trt?: string;
  grau?: string;
  especialidadeId?: number;
  peritoId?: number;
  segredoJustica?: boolean;
  prioridadeProcessual?: boolean;
  arquivado?: boolean;
  ordenarPor?: 'prazo_entrega' | 'data_criacao' | 'situacao_codigo';
  ordem?: 'asc' | 'desc';
}

export interface UsePericiasOptions {
  enabled?: boolean;
}

export interface UsePericiasResult {
  pericias: Pericia[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export const usePericias = (
  params: BuscarPericiasParams = {},
  options: UsePericiasOptions = {}
): UsePericiasResult => {
  const { enabled = true } = options;
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [paginacao, setPaginacao] = useState<UsePericiasResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce busca textual (300ms)
  const buscaDebounced = useDebounce(params.busca, 300);

  // Parâmetros estáveis (sem busca) para evitar re-render desnecessário
  const paramsEstaveis = useMemo(
    () => ({
      pagina: params.pagina,
      limite: params.limite,
      situacaoCodigo: params.situacaoCodigo,
      situacoesExcluidas: params.situacoesExcluidas,
      responsavelId: params.responsavelId,
      semResponsavel: params.semResponsavel,
      laudoJuntado: params.laudoJuntado,
      prazoEntregaInicio: params.prazoEntregaInicio,
      prazoEntregaFim: params.prazoEntregaFim,
      dataCriacaoInicio: params.dataCriacaoInicio,
      dataCriacaoFim: params.dataCriacaoFim,
      trt: params.trt,
      grau: params.grau,
      especialidadeId: params.especialidadeId,
      peritoId: params.peritoId,
      segredoJustica: params.segredoJustica,
      prioridadeProcessual: params.prioridadeProcessual,
      arquivado: params.arquivado,
      ordenarPor: params.ordenarPor,
      ordem: params.ordem,
    }),
    [
      params.pagina,
      params.limite,
      params.situacaoCodigo,
      params.situacoesExcluidas,
      params.responsavelId,
      params.semResponsavel,
      params.laudoJuntado,
      params.prazoEntregaInicio,
      params.prazoEntregaFim,
      params.dataCriacaoInicio,
      params.dataCriacaoFim,
      params.trt,
      params.grau,
      params.especialidadeId,
      params.peritoId,
      params.segredoJustica,
      params.prioridadeProcessual,
      params.arquivado,
      params.ordenarPor,
      params.ordem,
    ]
  );

  const buscarPericias = useCallback(async () => {
    if (!isClient || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const actionParams: ListarPericiasParams = {
        pagina: paramsEstaveis.pagina,
        limite: paramsEstaveis.limite,
        busca: buscaDebounced || undefined,
        situacaoCodigo: paramsEstaveis.situacaoCodigo,
        situacoesExcluidas: paramsEstaveis.situacoesExcluidas,
        responsavelId: paramsEstaveis.responsavelId,
        semResponsavel: paramsEstaveis.semResponsavel,
        laudoJuntado: paramsEstaveis.laudoJuntado,
        prazoEntregaInicio: paramsEstaveis.prazoEntregaInicio,
        prazoEntregaFim: paramsEstaveis.prazoEntregaFim,
        dataCriacaoInicio: paramsEstaveis.dataCriacaoInicio,
        dataCriacaoFim: paramsEstaveis.dataCriacaoFim,
        trt: paramsEstaveis.trt as ListarPericiasParams['trt'],
        grau: paramsEstaveis.grau as ListarPericiasParams['grau'],
        especialidadeId: paramsEstaveis.especialidadeId,
        peritoId: paramsEstaveis.peritoId,
        segredoJustica: paramsEstaveis.segredoJustica,
        prioridadeProcessual: paramsEstaveis.prioridadeProcessual,
        arquivado: paramsEstaveis.arquivado,
        ordenarPor: paramsEstaveis.ordenarPor,
        ordem: paramsEstaveis.ordem,
      };

      const result = await actionListarPericias(actionParams);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar perícias');
      }

      const payload = result.data as PaginatedResponse<Pericia>;
      setPericias(payload.data);
      setPaginacao({
        pagina: payload.pagination.page,
        limite: payload.pagination.limit,
        total: payload.pagination.total,
        totalPaginas: payload.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar perícias';
      setError(errorMessage);
      setPericias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [paramsEstaveis, buscaDebounced, enabled]);

  useEffect(() => {
    buscarPericias();
  }, [buscarPericias]);

  return {
    pericias,
    paginacao,
    isLoading,
    error,
    refetch: buscarPericias,
  };
};
