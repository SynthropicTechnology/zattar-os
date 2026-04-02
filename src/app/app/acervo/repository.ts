/**
 * Repository Layer for Acervo Feature
 * Data access and persistence operations
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';
import { getCached, setCached } from '@/lib/redis/cache-utils';
import { getAcervoListKey, getAcervoGroupKey } from '@/lib/redis/cache-keys';
import { logQuery } from '@/lib/supabase/query-logger';
import { converterParaAcervo } from './domain';
import {
  getAcervoColumnsBasic,
  getAcervoColumnsFull,
  getAcervoColumnsClienteCpf,
} from './domain';
import type {
  Acervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  AgrupamentoAcervo,
  ProcessoUnificado,
  ProcessoInstancia,
  ListarAcervoUnificadoResult,
  GrauAcervo,
  OrigemAcervo,
  ProcessoClienteCpfRow,
  TimelineJSONB,
} from './domain';

const ACERVO_TTL = 900; // 15 minutes
const ACERVO_UNIFICADO_TTL = 900; // 15 minutes

/**
 * Lists acervo with filters, pagination, and sorting
 */
export async function listarAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult> {
  const cacheKey = getAcervoListKey(params);
  const cached = await getCached<ListarAcervoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervo: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervo: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 2000); // Max 2000
  const offset = (pagina - 1) * limite;

  let query = supabase.from('acervo').select(getAcervoColumnsBasic(), { count: 'exact' });

  // Basic filters
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  // Responsible filter
  if (params.sem_responsavel === true) {
    query = query.is('responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('responsavel_id', params.responsavel_id);
    }
  }

  // Text search (multiple fields)
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%`
    );
  }

  // Specific field filters
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.nome_parte_autora) {
    query = query.ilike('nome_parte_autora', `%${params.nome_parte_autora}%`);
  }

  if (params.nome_parte_re) {
    query = query.ilike('nome_parte_re', `%${params.nome_parte_re}%`);
  }

  if (params.descricao_orgao_julgador) {
    query = query.ilike('descricao_orgao_julgador', `%${params.descricao_orgao_julgador}%`);
  }

  if (params.classe_judicial) {
    query = query.eq('classe_judicial', params.classe_judicial);
  }

  if (params.codigo_status_processo) {
    query = query.eq('codigo_status_processo', params.codigo_status_processo);
  }

  if (params.segredo_justica !== undefined) {
    query = query.eq('segredo_justica', params.segredo_justica);
  }

  if (params.juizo_digital !== undefined) {
    query = query.eq('juizo_digital', params.juizo_digital);
  }

  if (params.tem_associacao !== undefined) {
    query = query.eq('tem_associacao', params.tem_associacao);
  }

  // Date filters
  if (params.data_autuacao_inicio) {
    query = query.gte('data_autuacao', params.data_autuacao_inicio);
  }

  if (params.data_autuacao_fim) {
    query = query.lte('data_autuacao', params.data_autuacao_fim);
  }

  if (params.data_arquivamento_inicio) {
    query = query.gte('data_arquivamento', params.data_arquivamento_inicio);
  }

  if (params.data_arquivamento_fim) {
    query = query.lte('data_arquivamento', params.data_arquivamento_fim);
  }

  if (params.data_proxima_audiencia_inicio) {
    query = query.gte('data_proxima_audiencia', params.data_proxima_audiencia_inicio);
  }

  if (params.data_proxima_audiencia_fim) {
    query = query.lte('data_proxima_audiencia', params.data_proxima_audiencia_fim);
  }

  if (params.tem_proxima_audiencia === true) {
    query = query.not('data_proxima_audiencia', 'is', null);
  } else if (params.tem_proxima_audiencia === false) {
    query = query.is('data_proxima_audiencia', null);
  }

  // Sorting
  const ordenarPor = params.ordenar_por ?? 'data_autuacao';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await logQuery('acervo.listarAcervo', async () => {
    const result = await query;
    return result;
  });

  if (error) {
    throw new Error(`Erro ao listar acervo: ${error.message}`);
  }

  const processos = (data || []).map((item) => converterParaAcervo(item as unknown as Record<string, unknown>));
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAcervoResult = {
    processos,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result, ACERVO_TTL);
  return result;
}

/**
 * Lists acervo grouped by a specific field
 */
export async function listarAcervoAgrupado(
  params: ListarAcervoParams & { agrupar_por: string }
): Promise<ListarAcervoAgrupadoResult> {
  const cacheKey = getAcervoGroupKey(params);
  const cached = await getCached<ListarAcervoAgrupadoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervoAgrupado: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervoAgrupado: ${cacheKey}`);

  const supabase = createServiceClient();
  const incluirContagem = params.incluir_contagem !== false; // Default: true

  // Build base query with filters (no pagination)
  let query = supabase.from('acervo').select(getAcervoColumnsBasic());

  // Apply same filters as listarAcervo
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  if (params.sem_responsavel === true) {
    query = query.is('responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('responsavel_id', params.responsavel_id);
    }
  }

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%`
    );
  }

  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.nome_parte_autora) {
    query = query.ilike('nome_parte_autora', `%${params.nome_parte_autora}%`);
  }

  if (params.nome_parte_re) {
    query = query.ilike('nome_parte_re', `%${params.nome_parte_re}%`);
  }

  if (params.descricao_orgao_julgador) {
    query = query.ilike('descricao_orgao_julgador', `%${params.descricao_orgao_julgador}%`);
  }

  if (params.classe_judicial) {
    query = query.eq('classe_judicial', params.classe_judicial);
  }

  if (params.codigo_status_processo) {
    query = query.eq('codigo_status_processo', params.codigo_status_processo);
  }

  if (params.segredo_justica !== undefined) {
    query = query.eq('segredo_justica', params.segredo_justica);
  }

  if (params.juizo_digital !== undefined) {
    query = query.eq('juizo_digital', params.juizo_digital);
  }

  if (params.tem_associacao !== undefined) {
    query = query.eq('tem_associacao', params.tem_associacao);
  }

  // Date filters
  if (params.data_autuacao_inicio) {
    query = query.gte('data_autuacao', params.data_autuacao_inicio);
  }

  if (params.data_autuacao_fim) {
    query = query.lte('data_autuacao', params.data_autuacao_fim);
  }

  if (params.data_arquivamento_inicio) {
    query = query.gte('data_arquivamento', params.data_arquivamento_inicio);
  }

  if (params.data_arquivamento_fim) {
    query = query.lte('data_arquivamento', params.data_arquivamento_fim);
  }

  if (params.data_proxima_audiencia_inicio) {
    query = query.gte('data_proxima_audiencia', params.data_proxima_audiencia_inicio);
  }

  if (params.data_proxima_audiencia_fim) {
    query = query.lte('data_proxima_audiencia', params.data_proxima_audiencia_fim);
  }

  if (params.tem_proxima_audiencia === true) {
    query = query.not('data_proxima_audiencia', 'is', null);
  } else if (params.tem_proxima_audiencia === false) {
    query = query.is('data_proxima_audiencia', null);
  }

  // Fetch all data first
  const { data, error } = await logQuery('acervo.listarAcervoAgrupado', async () => {
    const result = await query;
    return result;
  });

  if (error) {
    throw new Error(`Erro ao listar acervo agrupado: ${error.message}`);
  }

  const processos = (data || []).map((item) => converterParaAcervo(item as unknown as Record<string, unknown>));

  // Group in memory
  const grupos = new Map<string, Acervo[]>();

  for (const processo of processos) {
    let chaveGrupo: string;

    switch (params.agrupar_por) {
      case 'trt':
        chaveGrupo = processo.trt;
        break;
      case 'grau':
        chaveGrupo = processo.grau;
        break;
      case 'origem':
        chaveGrupo = processo.origem;
        break;
      case 'responsavel_id':
        chaveGrupo = processo.responsavel_id?.toString() ?? 'sem_responsavel';
        break;
      case 'classe_judicial':
        chaveGrupo = processo.classe_judicial;
        break;
      case 'codigo_status_processo':
        chaveGrupo = String(processo.codigo_status_processo ?? 'sem_status');
        break;
      case 'orgao_julgador':
        chaveGrupo = processo.descricao_orgao_julgador;
        break;
      case 'mes_autuacao':
        // Extract month/year from filing date
        const dataAutuacao = new Date(processo.data_autuacao);
        chaveGrupo = `${dataAutuacao.getFullYear()}-${String(dataAutuacao.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'ano_autuacao':
        const dataAutuacaoAno = new Date(processo.data_autuacao);
        chaveGrupo = dataAutuacaoAno.getFullYear().toString();
        break;
      default:
        chaveGrupo = 'outros';
    }

    if (!grupos.has(chaveGrupo)) {
      grupos.set(chaveGrupo, []);
    }
    grupos.get(chaveGrupo)!.push(processo);
  }

  // Convert to response format
  const agrupamentos: AgrupamentoAcervo[] = Array.from(grupos.entries()).map(([grupo, processosGrupo]) => {
    const item: AgrupamentoAcervo = {
      grupo,
      quantidade: processosGrupo.length,
    };

    if (!incluirContagem) {
      item.processos = processosGrupo;
    }

    return item;
  });

  // Sort by quantity (descending)
  agrupamentos.sort((a, b) => b.quantidade - a.quantidade);

  const result: ListarAcervoAgrupadoResult = {
    agrupamentos,
    total: processos.length,
  };

  await setCached(cacheKey, result, ACERVO_TTL);
  return result;
}

/**
 * Converts JSONB instances from VIEW to ProcessoInstancia[]
 */
function converterInstances(instancesJson: unknown): ProcessoInstancia[] {
  if (!Array.isArray(instancesJson)) {
    return [];
  }

  return instancesJson.map((inst: Record<string, unknown>) => ({
    id: inst.id as number,
    origem: inst.origem as 'acervo_geral' | 'arquivado',
    trt: inst.trt as string,
    grau: inst.grau as GrauAcervo,
    numero_processo: inst.numero_processo as string,
    descricao_orgao_julgador: inst.descricao_orgao_julgador as string,
    classe_judicial: inst.classe_judicial as string,
    data_autuacao: inst.data_autuacao as string,
    data_arquivamento: (inst.data_arquivamento as string | null) ?? null,
    data_proxima_audiencia: (inst.data_proxima_audiencia as string | null) ?? null,
  }));
}

/**
 * Converts materialized VIEW data to ProcessoUnificado format
 */
function converterParaProcessoUnificado(data: Record<string, unknown>): ProcessoUnificado {
  return {
    numero_processo: data.numero_processo as string,
    trt: data.trt as string,
    nome_parte_autora: data.nome_parte_autora as string,
    nome_parte_re: data.nome_parte_re as string,
    segredo_justica: data.segredo_justica as boolean,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    tem_associacao: data.tem_associacao as boolean,
    instancias: converterInstances(data.instancias),
    data_autuacao_mais_antiga: data.data_autuacao_mais_antiga as string,
    data_proxima_audiencia: (data.data_proxima_audiencia as string | null) ?? null,
  };
}

/**
 * Lists unified acervo with filters, pagination, and sorting
 * Uses materialized VIEW acervo_unificado for efficient grouping in database
 */
export async function listarAcervoUnificado(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoUnificadoResult> {
  const cacheKey = getAcervoListKey({ ...params, unified: true });
  const cached = await getCached<ListarAcervoUnificadoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervoUnificado: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervoUnificado: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 2000); // Max 2000
  const offset = (pagina - 1) * limite;

  // Use materialized VIEW acervo_unificado
  // Select fields needed by converterParaProcessoUnificado
  const columnsUnificado = `
    numero_processo,
    trt,
    nome_parte_autora,
    nome_parte_re,
    segredo_justica,
    responsavel_id,
    tem_associacao,
    instancias,
    data_autuacao_mais_antiga,
    data_proxima_audiencia
  `.trim().replace(/\s+/g, ' ');
  let query = supabase.from('acervo_unificado').select(columnsUnificado, { count: 'exact' });

  // Apply filters (same as listarAcervo)
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau_atual', params.grau);
  }

  if (params.sem_responsavel === true) {
    query = query.is('responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('responsavel_id', params.responsavel_id);
    }
  }

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%`
    );
  }

  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.nome_parte_autora) {
    query = query.ilike('nome_parte_autora', `%${params.nome_parte_autora}%`);
  }

  if (params.nome_parte_re) {
    query = query.ilike('nome_parte_re', `%${params.nome_parte_re}%`);
  }

  if (params.descricao_orgao_julgador) {
    query = query.ilike('descricao_orgao_julgador', `%${params.descricao_orgao_julgador}%`);
  }

  if (params.classe_judicial) {
    query = query.eq('classe_judicial', params.classe_judicial);
  }

  if (params.codigo_status_processo) {
    query = query.eq('codigo_status_processo', params.codigo_status_processo);
  }

  if (params.segredo_justica !== undefined) {
    query = query.eq('segredo_justica', params.segredo_justica);
  }

  if (params.juizo_digital !== undefined) {
    query = query.eq('juizo_digital', params.juizo_digital);
  }

  if (params.tem_associacao !== undefined) {
    query = query.eq('tem_associacao', params.tem_associacao);
  }

  // Date filters
  if (params.data_autuacao_inicio) {
    query = query.gte('data_autuacao', params.data_autuacao_inicio);
  }

  if (params.data_autuacao_fim) {
    query = query.lte('data_autuacao', params.data_autuacao_fim);
  }

  if (params.data_arquivamento_inicio) {
    query = query.gte('data_arquivamento', params.data_arquivamento_inicio);
  }

  if (params.data_arquivamento_fim) {
    query = query.lte('data_arquivamento', params.data_arquivamento_fim);
  }

  if (params.data_proxima_audiencia_inicio) {
    query = query.gte('data_proxima_audiencia', params.data_proxima_audiencia_inicio);
  }

  if (params.data_proxima_audiencia_fim) {
    query = query.lte('data_proxima_audiencia', params.data_proxima_audiencia_fim);
  }

  if (params.tem_proxima_audiencia === true) {
    query = query.not('data_proxima_audiencia', 'is', null);
  } else if (params.tem_proxima_audiencia === false) {
    query = query.is('data_proxima_audiencia', null);
  }

  // Sorting
  const ordenarPor = params.ordenar_por ?? 'data_autuacao';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await logQuery('acervo.listarAcervoUnificado', async () => {
    const result = await query;
    return result;
  });

  if (error) {
    throw new Error(`Erro ao listar acervo unificado: ${error.message}`);
  }

  const processosUnificados = (data || []).map((item) => converterParaProcessoUnificado(item as unknown as Record<string, unknown>));
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAcervoUnificadoResult = {
    processos: processosUnificados,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result, ACERVO_UNIFICADO_TTL);
  return result;
}

/**
 * Finds an acervo process by ID
 */
export async function buscarAcervoPorId(id: number): Promise<Acervo | null> {
  const cacheKey = `acervo:id:${id}`;
  const cached = await getCached<Acervo>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for buscarAcervoPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarAcervoPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acervo')
    .select(getAcervoColumnsFull())
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar acervo: ${error.message}`);
  }

  if (!data) return null;
  const result = converterParaAcervo(data as unknown as Record<string, unknown>);
  if (result) {
    await setCached(cacheKey, result, ACERVO_TTL);
  }
  return result;
}

/**
 * Assigns responsible user to processes
 */
export async function atribuirResponsavel(
  processoIds: number[],
  responsavelId: number | null
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('acervo')
    .update({ responsavel_id: responsavelId })
    .in('id', processoIds);

  if (error) {
    throw new Error(`Erro ao atribuir responsável: ${error.message}`);
  }

  // Invalidate cache for affected processes
  await Promise.all(
    processoIds.map((id) => {
      const cacheKey = `acervo:id:${id}`;
      return setCached(cacheKey, null, 0); // Delete from cache
    })
  );
}

/**
 * Busca processos de um cliente pelo CPF
 * Utiliza a VIEW materializada 'view_processos_cliente_por_cpf' se disponível,
 * ou faz a query manual com JOINs
 */
export async function buscarProcessosClientePorCpf(
  cpf: string
): Promise<{ cliente: { id: number; nome: string; cpf: string; } | null; processos: ProcessoClienteCpfRow[] }> {
  const supabase = createServiceClient();
  const cpfLimpo = cpf.replace(/\D/g, '');

  const cpfLog = (sanitizeForLogs({ cpf: cpfLimpo }) as { cpf: string }).cpf;
  console.log(`🔍 [BuscarProcessosCPF] Buscando: ${cpfLog}`);

  // 1. Buscar Cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('cpf', cpfLimpo)
    .single();

  if (errorCliente || !cliente) {
    console.log('❌ [BuscarProcessosCPF] Cliente não encontrado');
    return { cliente: null, processos: [] };
  }

  // 2. Buscar participações
  const { data: participacoes, error: errorPart } = await supabase
    .from('processo_partes')
    .select('processo_id, tipo_parte, polo, principal')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', cliente.id);

  if (errorPart || !participacoes || participacoes.length === 0) {
    return {
      cliente: { id: cliente.id, nome: cliente.nome, cpf: cliente.cpf },
      processos: [],
    };
  }

  // 3. Buscar processos
  const processoIds = participacoes.map(p => p.processo_id);
  const { data: acervoData, error: errorAcervo } = await supabase
    .from('acervo')
    .select(getAcervoColumnsClienteCpf())
    .in('id', processoIds);

  if (errorAcervo || !acervoData) {
    throw new Error(`Erro ao buscar processes: ${errorAcervo?.message}`);
  }

  // 4. Join and Map
  const processos: ProcessoClienteCpfRow[] = (acervoData || []).map((processo) => {
    const processoTyped = processo as unknown as Record<string, unknown>;
    const part = participacoes.find(p => p.processo_id === processoTyped.id);
    return {
      cpf: cliente.cpf,
      cliente_nome: cliente.nome,
      cliente_id: cliente.id,
      tipo_parte: part?.tipo_parte || 'DESCONHECIDO',
      polo: part?.polo || 'DESCONHECIDO',
      parte_principal: part?.principal || false,
      processo_id: processoTyped.id as number,
      id_pje: processoTyped.id_pje?.toString() || '0',
      advogado_id: processoTyped.advogado_id as number,
      numero_processo: processoTyped.numero_processo as string,
      trt: processoTyped.trt as string,
      grau: processoTyped.grau as GrauAcervo,
      classe_judicial: processoTyped.classe_judicial as string,
      nome_parte_autora: processoTyped.nome_parte_autora as string,
      nome_parte_re: processoTyped.nome_parte_re as string,
      descricao_orgao_julgador: processoTyped.descricao_orgao_julgador as string,
      codigo_status_processo: processoTyped.codigo_status_processo as string,
      origem: processoTyped.origem as OrigemAcervo,
      data_autuacao: processoTyped.data_autuacao as string,
      data_arquivamento: processoTyped.data_arquivamento as string | null,
      data_proxima_audiencia: processoTyped.data_proxima_audiencia as string | null,
      segredo_justica: processoTyped.segredo_justica as boolean,
      timeline_jsonb: (processoTyped.timeline_jsonb as unknown as TimelineJSONB | null) ?? null,
    };
  });

  return {
    cliente: { id: cliente.id, nome: cliente.nome, cpf: cliente.cpf },
    processos,
  };
}

export async function refreshViewProcessosClienteCpf(): Promise<void> {
  const supabase = createServiceClient();
  await supabase.rpc('refresh_processos_cliente_por_cpf');
}
