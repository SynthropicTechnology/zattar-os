'use client';

/**
 * useAudienciasUnified — Hook unificado de data fetching para todas as views
 * ============================================================================
 * Centraliza fetch de audiências com range de datas baseado no viewMode.
 * Usado pelo AudienciasClient para alimentar todas as views.
 * ============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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

function getDateRange(viewMode: AudienciasViewMode, currentDate: Date) {
  switch (viewMode) {
    case 'quadro': {
      // Current month ± 1 month for mission view context
      const start = startOfMonth(subMonths(currentDate, 1));
      const end = endOfMonth(addMonths(currentDate, 1));
      return { start, end, limite: 500 };
    }
    case 'semana': {
      const start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
      return { start, end, limite: 200 };
    }
    case 'mes': {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end, limite: 500 };
    }
    case 'ano': {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      return { start, end, limite: 1000 };
    }
    case 'lista': {
      // Lista mostra tudo — sem range de data, paginação server-side
      return { start: null, end: null, limite: 200 };
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

  const searchDebounced = useDebounce(search, 400);

  const dateRange = useMemo(
    () => getDateRange(viewMode, currentDate),
    [viewMode, currentDate],
  );

  const fetchData = useCallback(async () => {
    if (!isClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarAudiencias({
        pagina: 1,
        limite: dateRange.limite,
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

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar audiências');
      }

      const payload = result.data;
      setAudiencias(payload.data as Audiencia[]);
      setTotal(payload.pagination?.total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar audiências';
      setError(msg);
      setAudiencias([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, searchDebounced, status, modalidade, trt, grau, responsavelId, tipoAudienciaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { audiencias, isLoading, error, total, refetch: fetchData };
}
