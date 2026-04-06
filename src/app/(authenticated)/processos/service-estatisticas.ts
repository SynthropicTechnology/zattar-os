'use server';

import { createDbClient } from '@/lib/supabase';

export interface ProcessoStats {
  /** Total de processos únicos (acervo_unificado) */
  total: number;
  /** Processos em curso (origem = acervo_geral) */
  emCurso: number;
  /** Processos arquivados (origem = arquivado) */
  arquivados: number;
  /** Processos sem responsável atribuído */
  semResponsavel: number;
  /** Processos com audiência futura agendada */
  comAudienciaProxima: number;
}

/**
 * Obtém estatísticas agregadas do acervo de processos.
 * Consulta a view acervo_unificado (1 row = 1 processo único).
 */
export async function obterEstatisticasProcessos(): Promise<ProcessoStats> {
  const client = createDbClient();

  const [
    { count: total },
    { count: emCurso },
    { count: arquivados },
    { count: semResponsavel },
    { count: comAudiencia },
  ] = await Promise.all([
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).eq('origem', 'acervo_geral'),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).eq('origem', 'arquivado'),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).is('responsavel_id', null),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).not('data_proxima_audiencia', 'is', null).gte('data_proxima_audiencia', new Date().toISOString()),
  ]);

  return {
    total: total ?? 0,
    emCurso: emCurso ?? 0,
    arquivados: arquivados ?? 0,
    semResponsavel: semResponsavel ?? 0,
    comAudienciaProxima: comAudiencia ?? 0,
  };
}
