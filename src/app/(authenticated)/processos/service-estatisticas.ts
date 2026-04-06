'use server';

import { createDbClient } from '@/lib/supabase';

export interface ProcessoStats {
  total: number;
  ativos: number;
  pendentes: number;
  emRecurso: number;
  arquivados: number;
  semResponsavel: number;
  comAudienciaProxima: number;
}

export async function obterEstatisticasProcessos(): Promise<ProcessoStats> {
  const client = createDbClient();

  const [
    { count: total },
    { count: ativos },
    { count: pendentes },
    { count: emRecurso },
    { count: arquivados },
    { count: semResponsavel },
    { count: comAudiencia },
  ] = await Promise.all([
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['ATIVO', 'DISTRIBUIDO', 'EM_ANDAMENTO']),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['PENDENTE', 'SUSPENSO']),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['EM_RECURSO']),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).eq('origem', 'arquivado'),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).is('responsavel_id', null),
    client.from('acervo_unificado').select('*', { count: 'exact', head: true }).not('data_proxima_audiencia', 'is', null).gte('data_proxima_audiencia', new Date().toISOString()),
  ]);

  return {
    total: total ?? 0,
    ativos: ativos ?? 0,
    pendentes: pendentes ?? 0,
    emRecurso: emRecurso ?? 0,
    arquivados: arquivados ?? 0,
    semResponsavel: semResponsavel ?? 0,
    comAudienciaProxima: comAudiencia ?? 0,
  };
}
