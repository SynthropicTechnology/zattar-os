'use client';

/**
 * Hook para buscar expedientes com filtros e paginação
 *
 * Segue o padrão de src/features/audiencias/hooks/use-audiencias.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Expediente, ListarExpedientesParams } from '../domain';
import type { PaginatedResponse } from '@/types';
import { actionListarExpedientes } from '../actions';

// Verificação SSR
const isClient = typeof window !== 'undefined';

// =============================================================================
// TIPOS
// =============================================================================

export interface BuscarExpedientesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  baixado?: boolean;
  prazoVencido?: boolean;
  semPrazo?: boolean;
  incluirSemPrazo?: boolean;
  dataPrazoLegalInicio?: string;
  dataPrazoLegalFim?: string;
  responsavelId?: number | 'null';
  semResponsavel?: boolean;
  trt?: string;
  grau?: string;
  tipoExpedienteId?: number;
  semTipo?: boolean;
  origem?: string;
  segredoJustica?: boolean;
  prioridadeProcessual?: boolean;
}

export interface UseExpedientesOptions {
  enabled?: boolean;
}

export interface UseExpedientesResult {
  expedientes: Expediente[];
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

export const useExpedientes = (
  params: BuscarExpedientesParams = {},
  options: UseExpedientesOptions = {}
): UseExpedientesResult => {
  const { enabled = true } = options;
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [paginacao, setPaginacao] = useState<UseExpedientesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce busca textual (300ms)
  const buscaDebounced = useDebounce(params.busca, 300);

  // Parâmetros estáveis (sem busca) para evitar re-render desnecessário
  const paramsEstaveis = useMemo(
    () => ({
      pagina: params.pagina,
      limite: params.limite,
      baixado: params.baixado,
      prazoVencido: params.prazoVencido,
      semPrazo: params.semPrazo,
      incluirSemPrazo: params.incluirSemPrazo,
      dataPrazoLegalInicio: params.dataPrazoLegalInicio,
      dataPrazoLegalFim: params.dataPrazoLegalFim,
      responsavelId: params.responsavelId,
      semResponsavel: params.semResponsavel,
      trt: params.trt,
      grau: params.grau,
      tipoExpedienteId: params.tipoExpedienteId,
      semTipo: params.semTipo,
      origem: params.origem,
      segredoJustica: params.segredoJustica,
      prioridadeProcessual: params.prioridadeProcessual,
    }),
    [
      params.pagina,
      params.limite,
      params.baixado,
      params.prazoVencido,
      params.semPrazo,
      params.incluirSemPrazo,
      params.dataPrazoLegalInicio,
      params.dataPrazoLegalFim,
      params.responsavelId,
      params.semResponsavel,
      params.trt,
      params.grau,
      params.tipoExpedienteId,
      params.semTipo,
      params.origem,
      params.segredoJustica,
      params.prioridadeProcessual,
    ]
  );

  const buscarExpedientes = useCallback(async () => {
    if (!isClient || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const actionParams: ListarExpedientesParams = {
        pagina: paramsEstaveis.pagina,
        limite: paramsEstaveis.limite,
        busca: buscaDebounced || undefined,
        baixado: paramsEstaveis.baixado,
        prazoVencido: paramsEstaveis.prazoVencido,
        semPrazo: paramsEstaveis.semPrazo,
        incluirSemPrazo: paramsEstaveis.incluirSemPrazo,
        dataPrazoLegalInicio: paramsEstaveis.dataPrazoLegalInicio,
        dataPrazoLegalFim: paramsEstaveis.dataPrazoLegalFim,
        responsavelId: paramsEstaveis.responsavelId,
        semResponsavel: paramsEstaveis.semResponsavel,
        trt: paramsEstaveis.trt as ListarExpedientesParams['trt'],
        grau: paramsEstaveis.grau as ListarExpedientesParams['grau'],
        tipoExpedienteId: paramsEstaveis.tipoExpedienteId,
        semTipo: paramsEstaveis.semTipo,
        origem: paramsEstaveis.origem as ListarExpedientesParams['origem'],
        segredoJustica: paramsEstaveis.segredoJustica,
        prioridadeProcessual: paramsEstaveis.prioridadeProcessual,
      };

      const result = await actionListarExpedientes(actionParams);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar expedientes');
      }

      const payload = result.data as PaginatedResponse<Expediente>;
      setExpedientes(payload.data);
      setPaginacao({
        pagina: payload.pagination.page,
        limite: payload.pagination.limit,
        total: payload.pagination.total,
        totalPaginas: payload.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar expedientes';
      setError(errorMessage);
      setExpedientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [paramsEstaveis, buscaDebounced, enabled]);

  useEffect(() => {
    buscarExpedientes();
  }, [buscarExpedientes]);

  return {
    expedientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarExpedientes,
  };
};
