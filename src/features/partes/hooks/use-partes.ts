'use client';

/**
 * usePartes — Hook unificado para buscar partes por tipo de entidade.
 *
 * Estratégia:
 *  - Chama a action correspondente ao tipo com incluir_processos: true
 *  - Mapeia os resultados para EntityCardData via adapter central
 *  - Debounce de 300ms na busca
 *
 * TODO: quando 'todos', mesclar as 4 entidades em paralelo.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { EntityCardData } from '@/components/dashboard/entity-card';
import { actionListarClientes } from '../actions/clientes-actions';
import { actionListarPartesContrarias } from '../actions/partes-contrarias-actions';
import { actionListarTerceiros } from '../actions/terceiros-actions';
import { actionListarRepresentantes } from '../actions/representantes-actions';
import {
  clienteToEntityCard,
  parteContrariaToEntityCard,
  terceiroToEntityCard,
  representanteToEntityCard,
} from '../adapters/entity-card-adapter';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TipoEntidade = 'todos' | 'clientes' | 'partes_contrarias' | 'terceiros' | 'representantes';

export interface UsePartesParams {
  tipoEntidade: TipoEntidade;
  busca?: string;
  pagina?: number;
  limite?: number;
}

export interface UsePartesResult {
  partes: EntityCardData[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePartes({
  tipoEntidade,
  busca = '',
  pagina = 1,
  limite = 50,
}: UsePartesParams): UsePartesResult {
  const [partes, setPartes] = useState<EntityCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce busca 300ms
  const [debouncedBusca, setDebouncedBusca] = useState(busca);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const paramsKey = useMemo(
    () => JSON.stringify({ tipoEntidade, debouncedBusca, pagina, limite }),
    [tipoEntidade, debouncedBusca, pagina, limite]
  );

  const paramsRef = useRef('');

  const fetchPartes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const buscaParam = debouncedBusca || undefined;

      // Clientes (ou "todos" — visão primária)
      if (tipoEntidade === 'clientes' || tipoEntidade === 'todos') {
        const result = await actionListarClientes({
          pagina,
          limite,
          busca: buscaParam,
          incluir_endereco: true,
          incluir_processos: true,
        });
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Erro ao buscar clientes');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (result.data.data as any[]) ?? [];
        setPartes(items.map(clienteToEntityCard));
        setTotal(result.data.pagination?.total ?? items.length);
        return;
      }

      // Partes Contrárias
      if (tipoEntidade === 'partes_contrarias') {
        const result = await actionListarPartesContrarias({
          pagina,
          limite,
          busca: buscaParam,
          incluir_endereco: true,
          incluir_processos: true,
        });
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Erro ao buscar partes contrárias');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data as any;
        const items = data.data ?? [];
        setPartes(items.map(parteContrariaToEntityCard));
        setTotal(data.pagination?.total ?? items.length);
        return;
      }

      // Terceiros
      if (tipoEntidade === 'terceiros') {
        const result = await actionListarTerceiros({
          pagina,
          limite,
          busca: buscaParam,
          incluir_endereco: true,
          incluir_processos: true,
        });
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Erro ao buscar terceiros');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data as any;
        const items = data.data ?? [];
        setPartes(items.map(terceiroToEntityCard));
        setTotal(data.pagination?.total ?? items.length);
        return;
      }

      // Representantes
      if (tipoEntidade === 'representantes') {
        const result = await actionListarRepresentantes({
          pagina,
          limite,
          busca: buscaParam,
        });
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Erro ao buscar representantes');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (result.data.data as any[]) ?? [];
        setPartes(items.map(representanteToEntityCard));
        setTotal(result.data.pagination?.total ?? items.length);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setPartes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [tipoEntidade, debouncedBusca, pagina, limite]);

  useEffect(() => {
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      fetchPartes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { partes, isLoading, error, total, refetch: fetchPartes };
}
