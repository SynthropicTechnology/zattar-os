'use client';

/**
 * Hook para buscar detalhes de um processo específico do acervo
 */

import { useState, useEffect, useCallback } from 'react';
import type { Acervo } from '@/app/app/acervo';
import { actionBuscarProcesso } from '@/app/app/acervo';

interface UseProcessoDetailResult {
  processo: Acervo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar detalhes de um processo do acervo por ID
 */
export const useProcessoDetail = (processoId: number | null): UseProcessoDetailResult => {
  const [processo, setProcesso] = useState<Acervo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarProcesso = useCallback(async () => {
    if (!processoId) {
      setProcesso(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionBuscarProcesso(processoId);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao buscar processo');
      }

      setProcesso((result.data as Acervo) || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar processo';
      setError(errorMessage);
      setProcesso(null);
    } finally {
      setIsLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    buscarProcesso();
  }, [buscarProcesso]);

  return {
    processo,
    isLoading,
    error,
    refetch: buscarProcesso,
  };
};
