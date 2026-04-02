'use client';

/**
 * Hook para buscar partes contrarias
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ParteContraria } from '../types';
import type {
  BuscarPartesContrariasParams,
  PaginationInfo,
} from '../types';
import { actionListarPartesContrarias } from '../actions/partes-contrarias-actions';

interface UsePartesContrariasResult {
  partesContrarias: ParteContraria[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar partes contrarias
 */
export const usePartesContrarias = (
  params: BuscarPartesContrariasParams = {}
): UsePartesContrariasResult => {
  const [partesContrarias, setPartesContrarias] = useState<ParteContraria[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const situacao = params.situacao || '';
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parametros para comparacao estavel
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipo_pessoa,
      situacao,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, situacao, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarPartesContrarias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarPartesContrarias({
        pagina,
        limite,
        busca: busca || undefined,
        tipo_pessoa: (tipo_pessoa as 'pf' | 'pj' | '') || undefined,
        situacao: (situacao as 'A' | 'I' | 'E' | 'H' | '') || undefined,
        incluir_endereco: incluirEndereco,
        incluir_processos: incluirProcessos,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar partes contrárias');
      }

      setPartesContrarias(result.data.data as ParteContraria[]);
      setPaginacao({
        pagina: result.data.pagination.page,
        limite: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPaginas: result.data.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar partes contrarias';
      setError(errorMessage);
      setPartesContrarias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, situacao, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // So executar se os parametros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarPartesContrarias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    partesContrarias,
    paginacao,
    isLoading,
    error,
    refetch: buscarPartesContrarias,
  };
};
