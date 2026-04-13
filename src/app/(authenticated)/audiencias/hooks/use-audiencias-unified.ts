'use client';

/**
 * useAudienciasUnified — Hook unificado de data fetching para todas as views
 * ============================================================================
 * Centraliza fetch de audiências com range de datas baseado no viewMode.
 * Usado pelo AudienciasClient para alimentar todas as views.
 *
 * Retorna `total` real do Supabase (via count: 'exact') independente do limite
 * de dados retornados, permitindo KPIs corretos no client.
 * ============================================================================
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  addMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import type { Audiencia, CodigoTribunal } from '../domain';
import { StatusAudiencia, ModalidadeAudiencia, GrauTribunal } from '../domain';
import { actionListarAudiencias } from '../actions';

// ─── Types ────────────────────────────────────────────────────────────────

export type AudienciasViewMode = 'quadro' | 'semana' | 'mes' | 'ano' | 'lista';

export interface UseAudienciasUnifiedParams {
  viewMode: AudienciasViewMode;
  currentDate: Date;
  search?: string;
  status?: StatusAudiencia;
  modalidade?: ModalidadeAudiencia;
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  responsavelId?: number;
  tipoAudienciaId?: number;
}

export interface UseAudienciasUnifiedResult {
  audiencias: Audiencia[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Sem limite artificial por view — o Supabase retorna o total real via
 * count: 'exact' e o service limita a AUDIENCIAS_LIMITE_MAXIMO (10000).
 * Para a lista usamos paginação real server-side.
 */
function getDateRange(viewMode: AudienciasViewMode, currentDate: Date) {
  switch (viewMode) {
    case 'quadro': {
      const start = startOfMonth(subMonths(currentDate, 1));
      const end = endOfMonth(addMonths(currentDate, 1));
      return { start, end };
    }
    case 'semana': {
      const start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
      return { start, end };
    }
    case 'mes': {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
    case 'ano': {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      return { start, end };
    }
    case 'lista': {
      return { start: null, end: null };
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

const isClient = typeof window !== 'undefined';

export function useAudienciasUnified(params: UseAudienciasUnifiedParams): UseAudienciasUnifiedResult {
  const { viewMode, currentDate, search, status, modalidade, trt, grau, responsavelId, tipoAudienciaId } = params;
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evitar chamadas duplicadas (Strict Mode / re-renders rápidos)
  const abortRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  const searchDebounced = useDebounce(search, 400);

  const dateRange = useMemo(
    () => getDateRange(viewMode, currentDate),
    [viewMode, currentDate],
  );

  // Chave estável para detectar se os parâmetros realmente mudaram
  const paramsKey = useMemo(
    () => JSON.stringify({
      start: dateRange.start?.toISOString() ?? null,
      end: dateRange.end?.toISOString() ?? null,
      search: searchDebounced,
      status, modalidade, trt, grau, responsavelId, tipoAudienciaId,
    }),
    [dateRange, searchDebounced, status, modalidade, trt, grau, responsavelId, tipoAudienciaId],
  );

  const fetchData = useCallback(async () => {
    if (!isClient) return;

    // Cancelar chamada anterior pendente
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const currentFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarAudiencias({
        pagina: 1,
        limite: 10000,
        busca: searchDebounced || undefined,
        status: status || undefined,
        modalidade: modalidade || undefined,
        trt: trt || undefined,
        grau: grau || undefined,
        responsavelId: responsavelId || undefined,
        tipoAudienciaId: tipoAudienciaId || undefined,
        dataInicioInicio: dateRange.start?.toISOString(),
        dataInicioFim: dateRange.end?.toISOString(),
      });

      // Se outra chamada já foi disparada, descartar este resultado
      if (currentFetchId !== fetchIdRef.current) return;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar audiências');
      }

      const payload = result.data;
      setAudiencias(payload.data as Audiencia[]);
      setTotal(payload.pagination?.total ?? 0);
    } catch (fetchErr) {
      if (currentFetchId !== fetchIdRef.current) return;
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Erro ao buscar audiências';
      setError(msg);
      setAudiencias([]);
      setTotal(0);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- paramsKey encapsula todas as deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { audiencias, isLoading, error, total, refetch: fetchData };
}
