/**
 * React Hooks for Acervo Feature
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  actionListarAcervoPaginado,
  actionBuscarProcesso,
  actionAtribuirResponsavel,
  actionBuscarProcessosClientePorCpf,
} from '../actions/acervo-actions';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  Acervo,
  ProcessosClienteCpfResponse,
} from '../domain';

/**
 * Hook for listing acervo with filters and pagination
 */
export function useAcervo(initialParams: ListarAcervoParams = {}) {
  const [data, setData] = useState<ListarAcervoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarAcervoParams>(initialParams);

  const fetchAcervo = useCallback(async (fetchParams?: ListarAcervoParams) => {
    setLoading(true);
    setError(null);

    try {
      const result = await actionListarAcervoPaginado(fetchParams || params);

      if (result.success && result.data) {
        setData(result.data as ListarAcervoResult);
      } else {
        setError(result.error || 'Erro ao carregar acervo');
        toast.error('Erro', {
          description: result.error || 'Erro ao carregar acervo',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAcervo();
  }, [fetchAcervo]);

  const updateParams = useCallback((newParams: Partial<ListarAcervoParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refetch = useCallback(() => {
    fetchAcervo(params);
  }, [fetchAcervo, params]);

  return {
    data,
    loading,
    error,
    params,
    updateParams,
    refetch,
  };
}

/**
 * Hook for fetching a single process by ID
 */
export function useProcesso(id: number | null) {
  const [processo, setProcesso] = useState<Acervo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchProcesso = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await actionBuscarProcesso(id);

      if (result.success && result.data) {
        setProcesso(result.data as Acervo);
      } else {
        setError(result.error || 'Erro ao carregar processo');
        toast.error('Erro', {
          description: result.error || 'Erro ao carregar processo',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProcesso();
  }, [fetchProcesso]);

  return {
    processo,
    loading,
    error,
    refetch: fetchProcesso,
  };
}

/**
 * Hook for assigning responsible to processes
 */
export function useAtribuirResponsavel() {
  const [loading, setLoading] = useState(false);

  const atribuir = useCallback(async (
    processoIds: number[],
    responsavelId: number | null
  ) => {
    setLoading(true);

    try {
      const result = await actionAtribuirResponsavel(processoIds, responsavelId);

      if (result.success) {
        toast.success('Responsável atribuído', {
          description: 'Responsável atribuído com sucesso',
        });
        return true;
      } else {
        toast.error('Erro', {
          description: result.error || 'Erro ao atribuir responsável',
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro', { description: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    atribuir,
    loading,
  };
}

/**
 * Hook for searching processes by client CPF (for AI Agent)
 */
export function useProcessosClienteCpf() {
  type ProcessosClienteCpfData = Extract<ProcessosClienteCpfResponse, { success: true }>['data'];

  const [data, setData] = useState<ProcessosClienteCpfData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (cpf: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await actionBuscarProcessosClientePorCpf(cpf);

      if (result.success) {
        setData(result.data);
      } else {
        const msg = result.error || 'Erro ao buscar processos';
        setData(null);
        setError(msg);
        toast.error('Erro', {
          description: msg,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setData(null);
      toast.error('Erro', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    buscar,
  };
}

/**
 * Hook for acervo filters state management
 */
export function useAcervoFilters(initialFilters: ListarAcervoParams = {}) {
  const [filters, setFilters] = useState<ListarAcervoParams>(initialFilters);

  const updateFilter = useCallback(<K extends keyof ListarAcervoParams>(
    key: K,
    value: ListarAcervoParams[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback((key: keyof ListarAcervoParams) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilter,
    setFilters,
  };
}
