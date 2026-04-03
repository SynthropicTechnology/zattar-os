'use client';

/**
 * CONTRATOS FEATURE - Hooks para Tipos Configuráveis
 *
 * Hooks de dados para tipos de contrato, tipos de cobrança e pipelines.
 * Usa useState + useEffect + useCallback (sem react-query).
 */

import { useState, useEffect, useCallback } from 'react';
import type { ContratoTipo, ContratoTipoCobranca } from './types';
import type { ContratoPipeline } from '@/app/(authenticated)/contratos/pipelines/types';

// =============================================================================
// HOOK: useContratoTipos
// =============================================================================

interface UseContratoTiposParams {
  ativo?: boolean;
}

interface UseContratoTiposResult {
  data: ContratoTipo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContratoTipos(params?: UseContratoTiposParams): UseContratoTiposResult {
  const [data, setData] = useState<ContratoTipo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.ativo !== undefined) {
        searchParams.set('ativo', String(params.ativo));
      }
      const res = await fetch(`/api/contratos/tipos?${searchParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Erro ao carregar tipos de contrato');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [params?.ativo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// =============================================================================
// HOOK: useContratoTiposCobranca
// =============================================================================

interface UseContratoTiposCobrancaParams {
  ativo?: boolean;
}

interface UseContratoTiposCobrancaResult {
  data: ContratoTipoCobranca[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContratoTiposCobranca(params?: UseContratoTiposCobrancaParams): UseContratoTiposCobrancaResult {
  const [data, setData] = useState<ContratoTipoCobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.ativo !== undefined) {
        searchParams.set('ativo', String(params.ativo));
      }
      const res = await fetch(`/api/contratos/tipos-cobranca?${searchParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Erro ao carregar tipos de cobrança');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [params?.ativo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// =============================================================================
// HOOK: usePipelines
// =============================================================================

interface UsePipelinesParams {
  segmentoId?: number;
  ativo?: boolean;
}

interface UsePipelinesResult {
  data: ContratoPipeline[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePipelines(params?: UsePipelinesParams): UsePipelinesResult {
  const [data, setData] = useState<ContratoPipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.segmentoId !== undefined) {
        searchParams.set('segmentoId', String(params.segmentoId));
      }
      if (params?.ativo !== undefined) {
        searchParams.set('ativo', String(params.ativo));
      }
      const res = await fetch(`/api/contratos/pipelines?${searchParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Erro ao carregar pipelines');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [params?.segmentoId, params?.ativo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
