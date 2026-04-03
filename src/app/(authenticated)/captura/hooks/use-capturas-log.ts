'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CapturaLog,
  ListarCapturasLogParams,
  ListarCapturasLogResult,
} from '@/app/(authenticated)/captura/types';

interface CapturasLogApiResponse {
  success: boolean;
  data: ListarCapturasLogResult;
}

interface UseCapturasLogResult {
  capturas: CapturaLog[];
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

/**
 * Hook para buscar histórico de capturas
 */
export const useCapturasLog = (
  params: ListarCapturasLogParams = {}
): UseCapturasLogResult => {
  const [capturas, setCapturas] = useState<CapturaLog[]>([]);
  const [paginacao, setPaginacao] = useState<UseCapturasLogResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar chamadas duplicadas (React StrictMode)
  const fetchingRef = useRef(false);
  const lastParamsRef = useRef<string>('');

  const buscarCapturas = useCallback(async (forceRefetch = false) => {
    // Construir query string
    const searchParams = new URLSearchParams();

    if (params.pagina !== undefined) {
      searchParams.set('pagina', params.pagina.toString());
    }
    if (params.limite !== undefined) {
      searchParams.set('limite', params.limite.toString());
    }
    if (params.tipo_captura) {
      searchParams.set('tipo_captura', params.tipo_captura);
    }
    if (params.advogado_id) {
      searchParams.set('advogado_id', params.advogado_id.toString());
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.data_inicio) {
      searchParams.set('data_inicio', params.data_inicio);
    }
    if (params.data_fim) {
      searchParams.set('data_fim', params.data_fim);
    }

    const paramsKey = searchParams.toString();

    // Evitar fetch duplicado se já estamos buscando os mesmos params
    if (!forceRefetch && fetchingRef.current && lastParamsRef.current === paramsKey) {
      return;
    }

    fetchingRef.current = true;
    lastParamsRef.current = paramsKey;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/captura/historico?${paramsKey}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: CapturasLogApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setCapturas(data.data.capturas);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar histórico de capturas';
      setError(errorMessage);
      setCapturas([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [
    params.pagina,
    params.limite,
    params.tipo_captura,
    params.advogado_id,
    params.status,
    params.data_inicio,
    params.data_fim,
  ]);

  useEffect(() => {
    buscarCapturas();
  }, [buscarCapturas]);

  return {
    capturas,
    paginacao,
    isLoading,
    error,
    refetch: () => buscarCapturas(true), // forceRefetch = true para refetch manual
  };
};
