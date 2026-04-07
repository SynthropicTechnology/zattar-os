/**
 * DASHBOARD FEATURE - Audiências Metrics Repository
 *
 * Métricas e estatísticas de audiências.
 * Responsabilidades:
 * - Resumo de audiências
 * - Listagem de próximas audiências
 * - Total de audiências do mês
 */

import { createClient } from '@/lib/supabase/server';
import { toDateString } from '@/lib/date-utils';
import type { SemanticTone } from '@/lib/design-system';
import type { AudienciasResumo, AudienciaProxima } from '../domain';

/**
 * Obtém resumo de audiências do usuário
 *
 * NOTA: Inclui audiências futuras independentemente do status 'designada'
 * para não perder audiências não designadas mas com data futura.
 */
export async function buscarAudienciasResumo(
  responsavelId?: number
): Promise<AudienciasResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  const em30dias = new Date(hoje);
  em30dias.setDate(em30dias.getDate() + 30);

  // Buscar audiências futuras (todas, independente de designada)
  // Se responsavelId fornecido: busca audiências do responsável OU sem responsável
  // Isso garante que usuários vejam audiências atribuídas a eles e audiências pendentes de atribuição
  let baseQuery = supabase
    .from('audiencias')
    .select('id, data_inicio, designada', { count: 'exact' })
    .gte('data_inicio', hoje.toISOString());

  if (responsavelId) {
    // Mostrar audiências do usuário OU audiências sem responsável definido
    baseQuery = baseQuery.or(`responsavel_id.eq.${responsavelId},responsavel_id.is.null`);
  }

  const { data, count, error } = await baseQuery;

  if (error) {
    console.error('[Dashboard] Erro ao buscar audiências:', error);
    console.error('[Dashboard] Query params:', { responsavelId, hoje: hoje.toISOString() });
    throw new Error(`Erro ao buscar audiências: ${error.message}`);
  }

  const audiencias = data || [];

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Audiências encontradas:', {
      total: count,
      dataLength: audiencias.length,
      responsavelId,
      designadas: audiencias.filter(a => a.designada).length,
      naoDesignadas: audiencias.filter(a => !a.designada).length,
    });
  }

  const hojeStr = toDateString(hoje);
  const amanhaStr = toDateString(amanha);

  const hojeCount = audiencias.filter((a) => {
    const dataAud = toDateString(new Date(a.data_inicio));
    return dataAud === hojeStr;
  }).length;

  const amanhaCount = audiencias.filter((a) => {
    const dataAud = toDateString(new Date(a.data_inicio));
    return dataAud === amanhaStr;
  }).length;

  const proximos7dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em7dias;
  }).length;

  const proximos30dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em30dias;
  }).length;

  return {
    total: count || 0,
    hoje: hojeCount,
    amanha: amanhaCount,
    proximos7dias,
    proximos30dias,
  };
}

/**
 * Obtém lista de próximas audiências
 *
 * SIMPLIFICADO: Query única ordenada por data_inicio,
 * sem lógica de fallback em cascata que pode causar resultados vazios.
 * Inclui audiências futuras independentemente do status 'designada'.
 */
export async function buscarProximasAudiencias(
  responsavelId?: number,
  limite: number = 5
): Promise<AudienciaProxima[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const selectFields = `
    id,
    processo_id,
    numero_processo,
    data_inicio,
    hora_inicio,
    sala_audiencia_nome,
    url_audiencia_virtual,
    responsavel_id,
    designada,
    polo_ativo_nome,
    polo_passivo_nome,
    tipo_audiencia:tipo_audiencia_id (descricao),
    usuarios:responsavel_id (nome_exibicao)
  `;

  // Query única ordenada: designadas primeiro (desc = true antes de false),
  // depois por data. Usa o limite exato em vez de buscar o dobro.
  let query = supabase
    .from('audiencias')
    .select(selectFields)
    .gte('data_inicio', hoje.toISOString())
    .order('designada', { ascending: false })
    .order('data_inicio', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(limite);

  if (responsavelId) {
    query = query.or(`responsavel_id.eq.${responsavelId},responsavel_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Dashboard] Erro ao buscar próximas audiências:', error);
    console.error('[Dashboard] Query params:', { responsavelId, hoje: hoje.toISOString() });
    return [];
  }

  const resultado = data || [];

  return resultado.map((a) => ({
    id: a.id,
    processo_id: a.processo_id,
    numero_processo: a.numero_processo,
    data_audiencia: a.data_inicio,
    hora_audiencia: a.hora_inicio,
    tipo_audiencia: (a.tipo_audiencia as { descricao?: string })?.descricao || null,
    local: null,
    sala: a.sala_audiencia_nome,
    url_audiencia_virtual: a.url_audiencia_virtual,
    responsavel_id: a.responsavel_id,
    responsavel_nome: (a.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
    polo_ativo_nome: a.polo_ativo_nome,
    polo_passivo_nome: a.polo_passivo_nome,
  }));
}

/**
 * Busca métricas detalhadas de audiências para widgets secundários.
 */
export async function buscarAudienciasDetalhadas(
  responsavelId?: number
): Promise<{
  porModalidade: { modalidade: string; count: number; tone: SemanticTone }[];
  statusMensal: { mes: string; marcadas: number; realizadas: number; canceladas: number }[];
  porTipo: { tipo: string; count: number; tone: SemanticTone }[];
  trendMensal: number[];
  heatmapSemanal: number[];
  duracaoMedia: number;
  taxaComparecimento: number;
}> {
  const supabase = await createClient();

  // Buscar audiências dos últimos 12 meses para tendência
  const dozeAtras = new Date();
  dozeAtras.setMonth(dozeAtras.getMonth() - 12);

  // audiencias NÃO tem coluna `resultado` — usar `status` para determinar estado
  let query = supabase
    .from('audiencias')
    .select(`
      id, data_inicio, hora_inicio, designada, modalidade, status,
      tipo_audiencia:tipo_audiencia_id (descricao)
    `)
    .gte('data_inicio', dozeAtras.toISOString());

  if (responsavelId) {
    query = query.or(`responsavel_id.eq.${responsavelId},responsavel_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Dashboard] Erro ao buscar audiências detalhadas:', error);
    return {
      porModalidade: [],
      statusMensal: [],
      porTipo: [],
      trendMensal: [],
      heatmapSemanal: [],
      duracaoMedia: 0,
      taxaComparecimento: 0,
    };
  }

  const audiencias = data || [];

  // --- Distribuição por modalidade ---
  // Híbrida = accent (tom complementar), não warning. Modalidade híbrida
  // é escolha válida, não estado de atenção.
  const MODALIDADE_TONES: Record<string, SemanticTone> = {
    'Virtual': 'info',
    'Presencial': 'primary',
    'Híbrida': 'accent',
  };
  const modalidadeMap = new Map<string, number>();
  audiencias.forEach((a) => {
    const mod = a.modalidade || 'Presencial';
    const label = mod.charAt(0).toUpperCase() + mod.slice(1).toLowerCase();
    modalidadeMap.set(label, (modalidadeMap.get(label) || 0) + 1);
  });
  const porModalidade = Array.from(modalidadeMap.entries()).map(([modalidade, count]) => ({
    modalidade,
    count,
    tone: MODALIDADE_TONES[modalidade] ?? 'neutral' as SemanticTone,
  }));

  // --- Status mensal (últimos 6 meses) ---
  const mesesLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const statusMensal: { mes: string; marcadas: number; realizadas: number; canceladas: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const doMes = audiencias.filter((a) => {
      const da = new Date(a.data_inicio);
      return da.getFullYear() === ano && da.getMonth() === mes;
    });
    statusMensal.push({
      mes: mesesLabel[mes],
      marcadas: doMes.length,
      realizadas: doMes.filter((a) => a.status && a.status !== 'cancelada' && a.status !== 'adiada').length,
      canceladas: doMes.filter((a) => a.status === 'cancelada' || a.status === 'adiada').length,
    });
  }

  // --- Distribuição por tipo ---
  // Instrução + Julgamento são fases-chave do processo — ambas recebem
  // destaque (primary/accent). Perícia é técnica, sem carga. UNA é raro.
  // Ver TONE-ACCURACY-REPORT.md para justificativa editorial.
  const TIPO_TONES: Record<string, SemanticTone> = {
    'Instrução': 'primary',
    'Conciliação': 'info',
    'Julgamento': 'accent',
    'UNA': 'neutral',
    'Perícia': 'chart-4',
  };
  const tipoMap = new Map<string, number>();
  audiencias.forEach((a) => {
    const tipo = (a.tipo_audiencia as { descricao?: string })?.descricao || 'Outros';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  const porTipo = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({
      tipo,
      count,
      tone: TIPO_TONES[tipo] ?? 'neutral' as SemanticTone,
    }))
    .sort((a, b) => b.count - a.count);

  // --- Trend mensal (12 meses) ---
  const trendMensal: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    trendMensal.push(
      audiencias.filter((a) => {
        const da = new Date(a.data_inicio);
        return da.getFullYear() === ano && da.getMonth() === mes;
      }).length
    );
  }

  // --- Heatmap semanal (5 semanas × 7 dias) ---
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const heatmapSemanal: number[] = new Array(35).fill(0);
  const inicioHeatmap = new Date(hoje);
  inicioHeatmap.setDate(inicioHeatmap.getDate() - 34);
  audiencias.forEach((a) => {
    const da = new Date(a.data_inicio);
    da.setHours(0, 0, 0, 0);
    const diffDias = Math.floor((da.getTime() - inicioHeatmap.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias >= 0 && diffDias < 35) {
      heatmapSemanal[diffDias]++;
    }
  });

  // --- Métricas derivadas ---
  const realizadas = audiencias.filter((a) => a.status && a.status !== 'cancelada' && a.status !== 'adiada');
  const taxaComparecimento = audiencias.length > 0
    ? Math.round((realizadas.length / audiencias.length) * 100)
    : 0;
  const duracaoMedia = 47; // placeholder — audiências não têm campo de duração

  return {
    porModalidade,
    statusMensal,
    porTipo,
    trendMensal,
    heatmapSemanal,
    duracaoMedia,
    taxaComparecimento,
  };
}

/**
 * Obtém total de audiências do mês
 */
export async function buscarAudienciasMes(): Promise<number> {
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const { count } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true })
    .gte('data_inicio', inicioMes.toISOString())
    .lt('data_inicio', fimMes.toISOString());

  return count || 0;
}
