'use client';

/**
 * Hook para buscar representantes
 *
 * NOTA: Apos a refatoracao do modelo, representantes sao sempre advogados
 * (pessoas fisicas) com CPF unico.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Representante } from '../types';
import type { BuscarRepresentantesParams, PaginationInfo } from '../types';
import { actionListarRepresentantes } from '../actions/representantes-actions';

interface UseRepresentantesResult<T extends Representante = Representante> {
  representantes: T[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar representantes
 */
export const useRepresentantes = <T extends Representante = Representante>(
  params: BuscarRepresentantesParams = {}
): UseRepresentantesResult<T> => {
  const [representantes, setRepresentantes] = useState<T[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const oab = params.oab || '';
  const ufOab = params.uf_oab || '';
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parametros para comparacao estavel
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      oab,
      ufOab,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, oab, ufOab, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarRepresentantes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarRepresentantes({
        pagina,
        limite,
        busca: busca || undefined,
        oab: oab || undefined,
        uf_oab: ufOab || undefined,
        incluirEndereco,
        incluirProcessos,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar representantes');
      }

      setRepresentantes(result.data.data as T[]);
      setPaginacao({
        pagina: result.data.pagination.page,
        limite: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPaginas: result.data.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar representantes';
      setError(errorMessage);
      setRepresentantes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, oab, ufOab, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // So executar se os parametros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarRepresentantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    representantes,
    paginacao,
    isLoading,
    error,
    refetch: buscarRepresentantes,
  };
};
