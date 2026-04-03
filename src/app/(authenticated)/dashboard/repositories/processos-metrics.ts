/**
 * DASHBOARD FEATURE - Processos Metrics Repository
 *
 * Métricas e estatísticas de processos.
 * Responsabilidades:
 * - Resumo de processos do usuário
 * - Total de processos do escritório
 *
 * OTIMIZAÇÃO:
 * - buscarProcessosResumo: usa RPC count_processos_unicos para contagens (evita fetch all + dedup em JS)
 *   e busca dados brutos apenas para distribuição por grau/TRT
 * - buscarTotalProcessos: queries paralelizadas com Promise.all()
 */

import { createClient } from '@/lib/supabase/server';
import type { ProcessoResumo } from '../domain';

/**
 * Obtém resumo de processos do usuário
 *
 * IMPORTANTE: Contagem baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes
 * (1º grau, 2º grau/TRT, TST, STF).
 */
export async function buscarProcessosResumo(
  responsavelId?: number
): Promise<ProcessoResumo> {
  const supabase = await createClient();

  // Contagens via RPC (executadas no banco, sem limite de 1000 registros)
  // + dados brutos para distribuição — tudo em paralelo
  const [totalResult, ativosResult, arquivadosResult, { data, error }] =
    await Promise.all([
      supabase.rpc('count_processos_unicos', {
        p_origem: null,
        p_responsavel_id: responsavelId ?? null,
        p_data_inicio: null,
        p_data_fim: null,
      }),
      supabase.rpc('count_processos_unicos', {
        p_origem: 'acervo_geral',
        p_responsavel_id: responsavelId ?? null,
        p_data_inicio: null,
        p_data_fim: null,
      }),
      supabase.rpc('count_processos_unicos', {
        p_origem: 'arquivado',
        p_responsavel_id: responsavelId ?? null,
        p_data_inicio: null,
        p_data_fim: null,
      }),
      // Dados brutos apenas para distribuição (grau + TRT)
      (() => {
        let query = supabase
          .from('acervo')
          .select('numero_processo, grau, trt')
          .not('numero_processo', 'is', null)
          .neq('numero_processo', '');

        if (responsavelId) {
          query = query.eq('responsavel_id', responsavelId);
        }

        return query;
      })(),
    ]);

  if (error) {
    console.error('Erro ao buscar processos:', error);
    throw new Error(`Erro ao buscar processos: ${error.message}`);
  }

  const total = totalResult.error ? 0 : (totalResult.data as number) || 0;
  const ativos = ativosResult.error ? 0 : (ativosResult.data as number) || 0;
  const arquivados = arquivadosResult.error ? 0 : (arquivadosResult.data as number) || 0;

  // Distribuição por grau/TRT (processos únicos)
  const processos = (data || []).filter(
    (p): p is typeof p & { numero_processo: string } =>
      p.numero_processo !== null &&
      p.numero_processo !== undefined &&
      p.numero_processo.trim() !== ''
  );

  const processosPorGrau = new Map<string, Set<string>>();
  processos.forEach((p) => {
    const grauLabel = p.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
    if (!processosPorGrau.has(grauLabel)) {
      processosPorGrau.set(grauLabel, new Set());
    }
    processosPorGrau.get(grauLabel)!.add(p.numero_processo);
  });
  const porGrau = Array.from(processosPorGrau.entries()).map(([grau, processosSet]) => ({
    grau,
    count: processosSet.size,
  }));

  const processosPorTRT = new Map<string, Set<string>>();
  processos.forEach((p) => {
    const trt = p.trt?.replace('TRT', '') || 'N/A';
    if (!processosPorTRT.has(trt)) {
      processosPorTRT.set(trt, new Set());
    }
    processosPorTRT.get(trt)!.add(p.numero_processo);
  });
  const porTRT = Array.from(processosPorTRT.entries())
    .map(([trt, processosSet]) => ({ trt, count: processosSet.size }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    ativos,
    arquivados,
    porGrau,
    porTRT,
  };
}

/**
 * Obtém total de processos do escritório
 *
 * IMPORTANTE: Contagem baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes.
 */
export async function buscarTotalProcessos(): Promise<{
  total: number;
  ativos: number;
}> {
  const supabase = await createClient();

  // Queries em paralelo
  const [totalResult, ativosResult] = await Promise.all([
    supabase.rpc('count_processos_unicos', {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }),
    supabase.rpc('count_processos_unicos', {
      p_origem: 'acervo_geral',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }),
  ]);

  return {
    total: totalResult.error ? 0 : (totalResult.data as number) || 0,
    ativos: ativosResult.error ? 0 : (ativosResult.data as number) || 0,
  };
}
