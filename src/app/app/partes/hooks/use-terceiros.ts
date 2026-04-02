'use client';

/**
 * Hook para buscar terceiros
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Terceiro } from '../types';
import type {
  BuscarTerceirosParams,
  PaginationInfo,
} from '../types';
import { actionListarTerceiros } from '../actions/terceiros-actions';

interface UseTerceirosResult {
  terceiros: Terceiro[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar terceiros
 */
export const useTerceiros = (params: BuscarTerceirosParams = {}): UseTerceirosResult => {
  const [terceiros, setTerceiros] = useState<Terceiro[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const tipo_parte = params.tipo_parte || '';
  const polo = params.polo || '';
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
      tipo_parte,
      polo,
      situacao,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, tipo_parte, polo, situacao, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarTerceiros = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarTerceiros({
        pagina,
        limite,
        busca: busca || undefined,
        tipo_pessoa: (tipo_pessoa as 'pf' | 'pj') || undefined,
        // @ts-expect-error - tipo_parte no banco pode ter valores variados
        tipo_parte: tipo_parte || undefined,
        // @ts-expect-error - polo no banco pode ter valores variados
        polo: polo || undefined,
        situacao: (situacao as 'A' | 'I') || undefined,
        incluir_endereco: incluirEndereco,
        incluir_processos: incluirProcessos,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar terceiros');
      }

      setTerceiros(result.data.data as Terceiro[]);
      setPaginacao({
        pagina: result.data.pagination.page,
        limite: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPaginas: result.data.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar terceiros';
      setError(errorMessage);
      setTerceiros([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, tipo_parte, polo, situacao, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // So executar se os parametros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarTerceiros();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    terceiros,
    paginacao,
    isLoading,
    error,
    refetch: buscarTerceiros,
  };
};
