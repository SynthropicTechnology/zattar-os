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

  // Query única: buscar próximas audiências ordenadas por data
  // Se responsavelId fornecido: busca audiências do responsável OU sem responsável
  let query = supabase
    .from('audiencias')
    .select(selectFields)
    .gte('data_inicio', hoje.toISOString())
    .order('data_inicio', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(limite * 2); // Busca o dobro para filtrar depois

  if (responsavelId) {
    // Mostrar audiências do usuário OU audiências sem responsável definido
    query = query.or(`responsavel_id.eq.${responsavelId},responsavel_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Dashboard] Erro ao buscar próximas audiências:', error);
    console.error('[Dashboard] Query params:', { responsavelId, hoje: hoje.toISOString() });
    return [];
  }

  const audiencias = data || [];

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Próximas audiências encontradas:', {
      total: audiencias.length,
      responsavelId,
      designadas: audiencias.filter(a => a.designada).length,
    });
  }

  // Priorizar designadas, mas incluir não-designadas se necessário
  const designadas = audiencias.filter(a => a.designada);
  const naoDesignadas = audiencias.filter(a => !a.designada);

  // Combinar: primeiro as designadas, depois as não-designadas
  const resultado = [...designadas, ...naoDesignadas].slice(0, limite);

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
