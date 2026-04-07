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
import type { SemanticTone } from '@/lib/design-system';
import type { ProcessoResumo } from '../domain';

// Mapeamentos status/segmento/aging → SemanticTone (sem cor literal).
// UI layer resolve via tokenForTone() do design system.
// Esta separação mantém o repository desacoplado do design system.
const STATUS_TONES: Record<string, SemanticTone> = {
  'Ativos': 'success',
  'Suspensos': 'warning',
  'Arquivados': 'neutral',
  'Em Recurso': 'info',
};

// Segmentos do direito usam tons CATEGÓRICOS (chart-*), não semânticos.
// Áreas de atuação são neutras — não devem carregar warning/destructive
// implícitos que sugiram "área de risco". Ver TONE-ACCURACY-REPORT.md.
const SEGMENTO_TONES: Record<string, SemanticTone> = {
  'Trabalhista': 'chart-1',
  'Cível': 'chart-2',
  'Previdenciário': 'chart-4',
  'Empresarial': 'chart-3',
  'Criminal': 'chart-5',
  'Outros': 'neutral',
};

const AGING_TONES: Record<string, SemanticTone> = {
  '< 1 ano': 'success',
  '1–2 anos': 'warning',
  '2–5 anos': 'chart-2',
  '> 5 anos': 'destructive',
};

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
 * Busca métricas detalhadas de processos para widgets secundários.
 * Retorna distribuição por status, segmento, aging e tendência mensal.
 */
export async function buscarProcessosDetalhados(
  responsavelId?: number
): Promise<{
  porStatus: { status: string; count: number; tone: SemanticTone }[];
  porSegmento: { segmento: string; count: number; tone: SemanticTone }[];
  aging: { faixa: string; count: number; tone: SemanticTone }[];
  tendenciaMensal: { mes: string; novos: number; resolvidos: number }[];
}> {
  const supabase = await createClient();

  // Buscar todos os processos (colunas que existem no schema)
  // acervo NÃO tem: status_acervo, area_juridica, data_distribuicao
  // Usa: origem (para status), classe_judicial (para segmento), data_autuacao (para aging)
  let query = supabase
    .from('acervo')
    .select('numero_processo, classe_judicial, data_autuacao, origem, created_at')
    .not('numero_processo', 'is', null)
    .neq('numero_processo', '');

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Dashboard] Erro ao buscar processos detalhados:', error);
    return { porStatus: [], porSegmento: [], aging: [], tendenciaMensal: [] };
  }

  const processos = data || [];

  // Deduplicar por numero_processo (pegar o registro mais recente)
  const porNumero = new Map<string, (typeof processos)[0]>();
  processos.forEach((p) => {
    if (p.numero_processo && !porNumero.has(p.numero_processo)) {
      porNumero.set(p.numero_processo, p);
    }
  });
  const unicos = Array.from(porNumero.values());

  // --- Distribuição por status (derivada de `origem`) ---
  const statusMap = new Map<string, number>();
  unicos.forEach((p) => {
    const origem = p.origem || 'acervo_geral';
    const statusLabel = origem === 'arquivado' ? 'Arquivados' : 'Ativos';
    statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);
  });
  const porStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    tone: STATUS_TONES[status] ?? 'neutral' as SemanticTone,
  }));

  // --- Distribuição por segmento (derivada de classe_judicial) ---
  const segmentoMap = new Map<string, number>();
  unicos.forEach((p) => {
    const classe = (p.classe_judicial || '').toLowerCase();
    let label: string;
    if (classe.includes('trabalhista') || classe.includes('reclamação')) label = 'Trabalhista';
    else if (classe.includes('cível') || classe.includes('cobrança') || classe.includes('indenizat')) label = 'Cível';
    else if (classe.includes('previdenciário') || classe.includes('benefício')) label = 'Previdenciário';
    else if (classe.includes('penal') || classe.includes('criminal')) label = 'Criminal';
    else if (classe) label = 'Outros';
    else label = 'Não classificado';
    segmentoMap.set(label, (segmentoMap.get(label) || 0) + 1);
  });
  const porSegmento = Array.from(segmentoMap.entries())
    .map(([segmento, count]) => ({
      segmento,
      count,
      tone: SEGMENTO_TONES[segmento] ?? 'chart-5' as SemanticTone,
    }))
    .sort((a, b) => b.count - a.count);

  // --- Aging por faixas de duração ---
  const agora = new Date();
  const agingMap = new Map<string, number>();
  unicos.forEach((p) => {
    const dataRef = p.data_autuacao || p.created_at;
    if (!dataRef) return;
    const meses = Math.floor((agora.getTime() - new Date(dataRef).getTime()) / (1000 * 60 * 60 * 24 * 30));
    let faixa: string;
    if (meses < 12) faixa = '< 1 ano';
    else if (meses < 24) faixa = '1–2 anos';
    else if (meses < 60) faixa = '2–5 anos';
    else faixa = '> 5 anos';
    agingMap.set(faixa, (agingMap.get(faixa) || 0) + 1);
  });
  const agingOrder = ['< 1 ano', '1–2 anos', '2–5 anos', '> 5 anos'];
  const aging = agingOrder
    .filter((faixa) => agingMap.has(faixa))
    .map((faixa) => ({
      faixa,
      count: agingMap.get(faixa) || 0,
      tone: AGING_TONES[faixa] ?? 'chart-5' as SemanticTone,
    }));

  // --- Tendência mensal (últimos 8 meses) ---
  const tendenciaMensal: { mes: string; novos: number; resolvidos: number }[] = [];
  const mesesLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const novos = processos.filter((p) => {
      const created = new Date(p.created_at);
      return created.getFullYear() === ano && created.getMonth() === mes;
    }).length;
    tendenciaMensal.push({
      mes: mesesLabel[mes],
      novos,
      resolvidos: 0, // Requer dados de encerramento que não estão no acervo
    });
  }

  return { porStatus, porSegmento, aging, tendenciaMensal };
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
