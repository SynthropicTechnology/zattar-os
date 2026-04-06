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
  /** Processos com eventos pendentes (expedientes, audiências ou obrigações ativas) */
  comEventos: number;
  /** IDs dos processos com eventos pendentes — usado para filtragem client-side */
  processoIdsComEventos: number[];
}

/**
 * Obtém estatísticas agregadas do acervo de processos.
 * Consulta a view acervo_unificado (1 row = 1 processo único)
 * e tabelas de eventos para contagem de processos com pendências.
 */
export async function obterEstatisticasProcessos(): Promise<ProcessoStats> {
  const client = createDbClient();
  const now = new Date().toISOString();

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
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).not('data_proxima_audiencia', 'is', null).gte('data_proxima_audiencia', now),
  ]);

  // Contar processos distintos com eventos pendentes (audiências futuras OU expedientes não respondidos OU obrigações ativas)
  // Usa queries separadas por tabela e unifica os IDs no client
  const [
    { data: audProcessos },
    { data: expProcessos },
    { data: obgProcessos },
  ] = await Promise.all([
    client.from('audiencias').select('processo_id').eq('status', 'MARCADA').gte('data_inicio', now),
    client.from('expedientes').select('processo_id').is('baixado_em', null).not('data_prazo_legal_parte', 'is', null),
    client.from('acordos_condenacoes').select('processo_id').eq('ativo', true),
  ]);

  const processoIdsComEventos = new Set<number>();
  for (const row of audProcessos ?? []) {
    if (row.processo_id) processoIdsComEventos.add(row.processo_id);
  }
  for (const row of expProcessos ?? []) {
    if (row.processo_id) processoIdsComEventos.add(row.processo_id);
  }
  for (const row of obgProcessos ?? []) {
    if (row.processo_id) processoIdsComEventos.add(row.processo_id);
  }

  return {
    total: total ?? 0,
    emCurso: emCurso ?? 0,
    arquivados: arquivados ?? 0,
    semResponsavel: semResponsavel ?? 0,
    comAudienciaProxima: comAudiencia ?? 0,
    comEventos: processoIdsComEventos.size,
    processoIdsComEventos: Array.from(processoIdsComEventos),
  };
}
