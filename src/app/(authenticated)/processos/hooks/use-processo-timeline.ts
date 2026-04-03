/**
 * Hook para gerenciar consulta e captura de timeline de processo
 *
 * Este hook encapsula a lógica de:
 * 1. Buscar dados do processo (acervo)
 * 2. Verificar se timeline existe no PostgreSQL (acervo.timeline_jsonb)
 * 3. Acionar captura automática se necessário
 * 4. Polling durante a captura
 * 5. Gerenciar estados de loading e erro
 * 6. Suporte a timeline unificada (multi-instância)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProcessoUnificado } from '@/app/(authenticated)/processos';
import type { TimelineJSONB } from '@/app/(authenticated)/acervo';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { actionObterTimelinePorId, actionRecapturarTimeline } from '@/app/(authenticated)/acervo';
import { actionCapturarTimeline } from '@/app/(authenticated)/captura';
import type { CodigoTRT, GrauTRT } from '@/app/(authenticated)/captura';

/**
 * Item da timeline com metadados de origem (para modo unificado)
 */
export interface TimelineItemUnificado extends TimelineItemEnriquecido {
  grauOrigem?: GrauProcesso;
  trtOrigem?: string;
  instanciaId?: number;
}

/**
 * Metadados da timeline unificada
 */
export interface TimelineUnificadaMetadata {
  totalItens: number;
  totalDocumentos: number;
  totalMovimentos: number;
  instancias: {
    id: number;
    grau: GrauProcesso;
    trt: string;
    totalItensOriginal: number;
    totalMovimentosProprios?: number; // Apenas movimentos próprios (sem mala direta)
  }[];
  duplicatasRemovidas: number;
}

/**
 * Timeline com suporte a modo unificado
 */
export interface TimelineData {
  timeline: TimelineItemUnificado[];
  metadata?: TimelineUnificadaMetadata | TimelineJSONB['metadata'];
  unified: boolean;
}

interface ProcessoTimelineData {
  processo: ProcessoUnificado;
  timeline: TimelineData | null;
}

interface UseProcessoTimelineOptions {
  /** Usar timeline unificada (agregar todas as instâncias) */
  unified?: boolean;
}

interface UseProcessoTimelineReturn {
  /** Dados do processo */
  processo: ProcessoUnificado | null;
  /** Timeline do processo (se existir) */
  timeline: TimelineData | null;
  /** Carregando dados iniciais */
  isLoading: boolean;
  /** Capturando timeline no PJE */
  isCapturing: boolean;
  /** Erro ocorrido */
  error: Error | null;
  /** Re-buscar timeline */
  refetch: () => Promise<void>;
  /** Forçar recaptura da timeline (mesmo se já existir) */
  forceRecapture: () => Promise<void>;
  /** Se está usando modo unificado */
  isUnified: boolean;
}

const POLLING_INTERVAL = 5000; // 5 segundos
const MAX_POLLING_ATTEMPTS = 120; // 10 minutos (120 * 5s)

export function useProcessoTimeline(
  id: number,
  options: UseProcessoTimelineOptions = {}
): UseProcessoTimelineReturn {
  const { unified = true } = options; // Default: usar timeline unificada

  const [processo, setProcesso] = useState<ProcessoUnificado | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  /**
   * Buscar processo e timeline
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const result = await actionObterTimelinePorId(id, unified);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados do processo');
      }

      const data = result.data as ProcessoTimelineData;
      setProcesso(data.processo);
      setTimeline(data.timeline);

      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(errorObj);
      throw errorObj;
    }
  }, [id, unified]);

  /**
   * Acionar captura de timeline
   */
  const captureTimeline = useCallback(async () => {
    if (!processo) return;

    try {
      setIsCapturing(true);
      setError(null);

      console.log('[useProcessoTimeline] Iniciando captura de timeline', {
        processoId: processo.id,
        numeroProcesso: processo.numeroProcesso,
      });

      // Para captura individual, usar dados do processo principal
      // Nota: Para captura unificada, usar actionRecapturarTimeline
      const trtParaCaptura = processo.trt; // Usar trt atual (não origem)
      const grauParaCaptura = processo.grauAtual || 'primeiro_grau';

      const result = await actionCapturarTimeline({
        trtCodigo: String(trtParaCaptura) as CodigoTRT,
        grau: String(grauParaCaptura) as GrauTRT,
        processoId: String(processo.idPje),
        numeroProcesso: processo.numeroProcesso,
        advogadoId: processo.advogadoId,
        baixarDocumentos: true,
        filtroDocumentos: {
          apenasAssinados: false, // Baixar todos os documentos
          apenasNaoSigilosos: false, // Incluir sigilosos também
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao iniciar captura da timeline');
      }

      console.log('[useProcessoTimeline] Captura iniciada com sucesso');

      // Resetar contador de polling
      setPollingAttempts(0);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro ao capturar timeline');
      setError(errorObj);
      setIsCapturing(false);
      throw errorObj;
    }
  }, [processo]);

  /**
   * Polling para verificar se timeline foi capturada
   */
  const pollTimeline = useCallback(async () => {
    if (!isCapturing) return;

    try {
      const data = await fetchData();

      // Se timeline foi capturada, parar polling
      if (data.timeline) {
        console.log('[useProcessoTimeline] Timeline capturada com sucesso!');
        setIsCapturing(false);
        setPollingAttempts(0);
        return;
      }

      // Incrementar tentativas
      setPollingAttempts((prev) => prev + 1);

      // Verificar limite de tentativas
      if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
        throw new Error(
          'Timeout: A captura da timeline está demorando mais que o esperado. ' +
          'Por favor, tente novamente mais tarde.'
        );
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro no polling');
      setError(errorObj);
      setIsCapturing(false);
      setPollingAttempts(0);
    }
  }, [isCapturing, fetchData, pollingAttempts]);

  /**
   * Re-buscar dados (útil após erro)
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  /**
   * Forçar recaptura da timeline (mesmo se já existir)
   */
  const forceRecapture = useCallback(async () => {
    if (isCapturing) {
      console.log('[useProcessoTimeline] Captura já em andamento, ignorando');
      return;
    }

    console.log('[useProcessoTimeline] Forçando recaptura da timeline');

    // Limpar timeline atual para forçar nova captura
    setTimeline(null);
    setError(null);

    // Acionar recaptura de todas as instâncias do processo (1º, 2º, TST)
    try {
      setIsCapturing(true);
      setPollingAttempts(0);

      const result = await actionRecapturarTimeline(id);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao recapturar timeline');
      }

      console.log('[useProcessoTimeline] Recaptura enviada para todas as instâncias', result.data);
      // Polling continuará até timeline retornar
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro ao recapturar timeline');
      setError(errorObj);
      setIsCapturing(false);
      throw errorObj;
    }
  }, [id, isCapturing]);

  /**
   * Efeito: Carregar dados iniciais
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await fetchData();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchData]);

  /**
   * Efeito: Verificar se precisa capturar timeline
   */
  useEffect(() => {
    if (isLoading || isCapturing || error) return;
    if (!processo) return;
    if (timeline !== null) return; // Timeline já existe

    // Timeline não existe, iniciar captura
    console.log('[useProcessoTimeline] Timeline não encontrada, iniciando captura automática');
    captureTimeline();
  }, [processo, timeline, isLoading, isCapturing, error, captureTimeline]);

  /**
   * Efeito: Polling durante captura
   */
  useEffect(() => {
    if (!isCapturing) return;

    const intervalId = setInterval(() => {
      pollTimeline();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isCapturing, pollTimeline]);

  return {
    processo,
    timeline,
    isLoading,
    isCapturing,
    error,
    refetch,
    forceRecapture,
    isUnified: unified,
  };
}
