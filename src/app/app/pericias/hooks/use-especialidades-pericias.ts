'use client';

/**
 * Hook para buscar especialidades de perícia
 */

import { useState, useEffect, useCallback } from 'react';
import { actionListarEspecialidadesPericia } from '../actions/pericias-actions';
import type { EspecialidadePericiaOption } from '../types';

const isClient = typeof window !== 'undefined';

export interface UseEspecialidadesPericiasOptions {
  enabled?: boolean;
}

export interface UseEspecialidadesPericiasResult {
  especialidades: EspecialidadePericiaOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useEspecialidadesPericias = (
  options: UseEspecialidadesPericiasOptions = {}
): UseEspecialidadesPericiasResult => {
  const { enabled = true } = options;
  const [especialidades, setEspecialidades] = useState<EspecialidadePericiaOption[]>([]);
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
      const result = await actionListarEspecialidadesPericia();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar especialidades');
      }

      const payload = result.data as { especialidades?: EspecialidadePericiaOption[] };
      setEspecialidades(payload.especialidades || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar especialidades';
      setError(errorMessage);
      setEspecialidades([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return {
    especialidades,
    isLoading,
    error,
    refetch: buscar,
  };
};
