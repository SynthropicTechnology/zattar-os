'use client';

/**
 * Hook para buscar peritos (terceiros do tipo PERITO)
 */

import { useState, useEffect, useCallback } from 'react';
import { actionListarTerceiros } from '@/app/(authenticated)/partes/actions/terceiros-actions';
import type { PeritoOption } from '../types';

const isClient = typeof window !== 'undefined';

export interface UsePeritosOptions {
  enabled?: boolean;
}

export interface UsePeritosResult {
  peritos: PeritoOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePeritos = (
  options: UsePeritosOptions = {}
): UsePeritosResult => {
  const { enabled = true } = options;
  const [peritos, setPeritos] = useState<PeritoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    if (!isClient || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarTerceiros({
        limite: 200,
        tipo_parte: 'PERITO',
        situacao: 'A',
      });

      if (!result.success) {
        throw new Error('Erro ao buscar peritos');
      }

      const data = result.data?.data as unknown as { id: number; nome: string }[] | undefined;
      setPeritos((data || []).map((p) => ({ id: p.id, nome: p.nome })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar peritos';
      setError(errorMessage);
      setPeritos([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return {
    peritos,
    isLoading,
    error,
    refetch: buscar,
  };
};
