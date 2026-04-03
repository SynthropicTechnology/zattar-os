/**
 * Serviço de persistência para Plano de Contas
 * Gerencia operações de CRUD na tabela plano_contas
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import {
  getCached,
  setCached,
  CACHE_PREFIXES,
} from '@/lib/redis/cache-utils';
import {
  getPlanoContasListKey,
  getPlanoContasHierarquiaKey,
} from '@/lib/redis/cache-keys';
import { invalidatePlanoContasCache } from '@/lib/redis/invalidation';
import type {
  PlanoConta,
  PlanoContaComPai,
  PlanoContaHierarquico,
  CriarPlanoContaDTO,
  AtualizarPlanoContaDTO,
  ListarPlanoContasParams,
  ListarPlanoContasResponse,
  TipoContaContabil,
  NaturezaConta,
  NivelConta,
} from '@/app/(authenticated)/financeiro/domain/plano-contas';

// ============================================================================
// Tipos internos
// ============================================================================

interface PlanoContaRecord {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo_conta: TipoContaContabil;
  natureza: NaturezaConta;
  nivel: NivelConta;
  conta_pai_id: number | null;
  aceita_lancamento: boolean;
  ordem_exibicao: number | null;
  ativo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface PlanoContaRecordComPai extends PlanoContaRecord {
  conta_pai?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro do banco para interface PlanoConta
 */
const mapearPlanoConta = (registro: PlanoContaRecord): PlanoConta => {
  return {
    id: registro.id,
    codigo: registro.codigo,
    nome: registro.nome,
    descricao: registro.descricao || undefined,
    tipo: registro.tipo_conta,
    tipoConta: registro.tipo_conta,
    natureza: registro.natureza,
    nivel: registro.nivel,
    contaPaiId: registro.conta_pai_id || undefined,
    aceitaLancamento: registro.aceita_lancamento,
    ordemExibicao: registro.ordem_exibicao || undefined,
    ativo: registro.ativo,
    createdBy: registro.created_by || undefined,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro do banco com conta pai para interface PlanoContaComPai
 */
const mapearPlanoContaComPai = (registro: PlanoContaRecordComPai): PlanoContaComPai => {
  const planoConta = mapearPlanoConta(registro);
  return {
    ...planoConta,
    nomePai: registro.conta_pai?.nome,
  };
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Listar plano de contas com filtros e paginação
 */
export const listarPlanoContas = async (
  params: ListarPlanoContasParams
): Promise<ListarPlanoContasResponse> => {
  const cacheKey = getPlanoContasListKey(params);
  const cached = await getCached<ListarPlanoContasResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarPlanoContas: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarPlanoContas: ${cacheKey}`);

  const {
    pagina = 1,
    limite = 50,
    busca,
    tipoConta,
    nivel,
    ativo,
    contaPaiId,
    ordenarPor = 'codigo',
    ordem = 'asc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('plano_contas')
    .select(
      `
      *,
      conta_pai:plano_contas!conta_pai_id(id, codigo, nome)
    `,
      { count: 'exact' }
    );

  // Filtro de busca (código ou nome)
  if (busca) {
    query = query.or(`codigo.ilike.%${busca}%,nome.ilike.%${busca}%`);
  }

  // Filtro de tipo de conta
  if (tipoConta) {
    if (Array.isArray(tipoConta)) {
      query = query.in('tipo_conta', tipoConta);
    } else {
      query = query.eq('tipo_conta', tipoConta);
    }
  }

  // Filtro de nível
  if (nivel) {
    if (Array.isArray(nivel)) {
      query = query.in('nivel', nivel as unknown as number[]);
    } else {
      query = query.eq('nivel', nivel as unknown as number);
    }
  }

  // Filtro de ativo
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  // Filtro de conta pai
  if (contaPaiId !== undefined) {
    if (contaPaiId === null) {
      query = query.is('conta_pai_id', null);
    } else {
      query = query.eq('conta_pai_id', contaPaiId);
    }
  }

  // Mapeamento de campos para ordenação
  const ordenarPorMap: Record<string, string> = {
    codigo: 'codigo',
    nome: 'nome',
    ordem_exibicao: 'ordem_exibicao',
    created_at: 'created_at',
    updated_at: 'updated_at',
  };

  const campoOrdenacao = ordenarPorMap[ordenarPor] || 'codigo';
  query = query.order(campoOrdenacao, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar plano de contas: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarPlanoContasResponse = {
    items: (data || []).map((item) => mapearPlanoContaComPai(item as unknown as PlanoContaRecordComPai)),
    pagina,
    limite,
    total,
    totalPaginas,
  };

  await setCached(cacheKey, result, 900); // 15 minutos TTL
  return result;
};

/**
 * Buscar conta por ID
 */
export const buscarPlanoContaPorId = async (id: number): Promise<PlanoContaComPai | null> => {
  const cacheKey = `${CACHE_PREFIXES.planoContas}:id:${id}`;
  const cached = await getCached<PlanoContaComPai>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarPlanoContaPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarPlanoContaPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('plano_contas')
    .select(
      `
      *,
      conta_pai:plano_contas!conta_pai_id(id, codigo, nome)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar conta: ${error.message}`);
  }

  const result = mapearPlanoContaComPai(data as unknown as PlanoContaRecordComPai);
  await setCached(cacheKey, result, 900); // 15 minutos TTL
  return result;
};

/**
 * Buscar conta por código
 */
export const buscarPlanoContaPorCodigo = async (codigo: string): Promise<PlanoContaComPai | null> => {
  const cacheKey = `${CACHE_PREFIXES.planoContas}:codigo:${codigo}`;
  const cached = await getCached<PlanoContaComPai>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarPlanoContaPorCodigo: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarPlanoContaPorCodigo: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('plano_contas')
    .select(
      `
      *,
      conta_pai:plano_contas!conta_pai_id(id, codigo, nome)
    `
    )
    .eq('codigo', codigo)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar conta por código: ${error.message}`);
  }

  const result = mapearPlanoContaComPai(data as unknown as PlanoContaRecordComPai);
  await setCached(cacheKey, result, 900); // 15 minutos TTL
  return result;
};

/**
 * Listar plano de contas em estrutura hierárquica
 */
export const listarPlanoContasHierarquico = async (): Promise<PlanoContaHierarquico[]> => {
  const cacheKey = getPlanoContasHierarquiaKey();
  const cached = await getCached<PlanoContaHierarquico[]>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarPlanoContasHierarquico: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarPlanoContasHierarquico: ${cacheKey}`);

  const supabase = createServiceClient();

  // Buscar todas as contas ativas ordenadas por código
  const { data, error } = await supabase
    .from('plano_contas')
    .select('*')
    .eq('ativo', true)
    .order('codigo', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar plano de contas hierárquico: ${error.message}`);
  }

  // Converter registros para interface PlanoConta
  const contas = (data || []).map((item) => mapearPlanoConta(item as unknown as PlanoContaRecord));

  // Construir árvore hierárquica
  const contasMap = new Map<number, PlanoContaHierarquico>();
  const raizes: PlanoContaHierarquico[] = [];

  // Primeiro passo: criar mapa de todas as contas
  for (const conta of contas) {
    contasMap.set(conta.id, { ...conta, filhas: [] });
  }

  // Segundo passo: construir hierarquia
  for (const conta of contas) {
    const contaHierarquica = contasMap.get(conta.id)!;

    if (conta.contaPaiId) {
      const pai = contasMap.get(conta.contaPaiId);
      if (pai) {
        pai.filhas = pai.filhas || [];
        pai.filhas.push(contaHierarquica);
      }
    } else {
      raizes.push(contaHierarquica);
    }
  }

  await setCached(cacheKey, raizes, 900); // 15 minutos TTL
  return raizes;
};

// ============================================================================
// Operações de Escrita
// ============================================================================

/**
 * Criar nova conta no plano de contas
 */
export const criarPlanoConta = async (
  data: CriarPlanoContaDTO,
  usuarioId: number
): Promise<PlanoConta> => {
  const supabase = createServiceClient();

  // Determinar aceitaLancamento baseado no nível
  const aceitaLancamento = data.nivel === 'analitica';

  // Se tem conta pai, verificar se ela existe e é sintética
  if (data.contaPaiId) {
    const { data: contaPai, error: erroPai } = await supabase
      .from('plano_contas')
      .select('id, nivel')
      .eq('id', data.contaPaiId)
      .single();

    if (erroPai || !contaPai) {
      throw new Error('Conta pai não encontrada');
    }

    if ((contaPai.nivel as unknown as string) !== 'sintetica') {
      throw new Error('Conta pai deve ser sintética para receber contas filhas');
    }
  }

  const { data: registro, error } = await supabase
    .from('plano_contas')
    .insert({
      codigo: data.codigo.trim(),
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      tipo_conta: data.tipoConta,
      natureza: data.natureza,
      nivel: data.nivel as unknown as number,
      conta_pai_id: data.contaPaiId || null,
      aceita_lancamento: aceitaLancamento,
      ordem_exibicao: data.ordemExibicao || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      created_by: usuarioId,
    })
    .select()
    .single();

  if (error) {
    // Erro de unicidade no código
    if (error.code === '23505') {
      throw new Error('Código de conta já existe');
    }
    // Erro de violação de check (ciclo na hierarquia)
    if (error.message.includes('ciclo')) {
      throw new Error('Operação criaria ciclo na hierarquia do plano de contas');
    }
    throw new Error(`Erro ao criar conta: ${error.message}`);
  }

  const result = mapearPlanoConta(registro as unknown as PlanoContaRecord);
  await invalidatePlanoContasCache();
  return result;
};

/**
 * Atualizar conta existente
 */
export const atualizarPlanoConta = async (
  id: number,
  data: AtualizarPlanoContaDTO
): Promise<PlanoConta> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('plano_contas')
    .select('*')
    .eq('id', id)
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta não encontrada');
  }

  // Se está alterando conta pai, verificar se nova conta pai é sintética
  if (data.contaPaiId !== undefined && data.contaPaiId !== null) {
    const { data: contaPai, error: erroPai } = await supabase
      .from('plano_contas')
      .select('id, nivel')
      .eq('id', data.contaPaiId)
      .single();

    if (erroPai || !contaPai) {
      throw new Error('Nova conta pai não encontrada');
    }

    if ((contaPai.nivel as unknown as string) !== 'sintetica') {
      throw new Error('Nova conta pai deve ser sintética');
    }
  }

  const updateData: Partial<Omit<PlanoContaRecord, 'id'>> = {};

  if (data.nome !== undefined) {
    updateData.nome = data.nome.trim();
  }
  if (data.descricao !== undefined) {
    updateData.descricao = data.descricao?.trim() || null;
  }
  if (data.tipoConta !== undefined) {
    updateData.tipo_conta = data.tipoConta;
  }
  if (data.natureza !== undefined) {
    updateData.natureza = data.natureza;
  }
  if (data.contaPaiId !== undefined) {
    updateData.conta_pai_id = data.contaPaiId;
  }
  if (data.ordemExibicao !== undefined) {
    updateData.ordem_exibicao = data.ordemExibicao;
  }
  if (data.ativo !== undefined) {
    updateData.ativo = data.ativo;
  }

  const { data: registro, error } = await supabase
    .from('plano_contas')
    .update(updateData as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Código de conta já existe');
    }
    if (error.message.includes('ciclo')) {
      throw new Error('Operação criaria ciclo na hierarquia do plano de contas');
    }
    throw new Error(`Erro ao atualizar conta: ${error.message}`);
  }

  const result = mapearPlanoConta(registro as unknown as PlanoContaRecord);
  await invalidatePlanoContasCache();
  return result;
};

/**
 * Desativar conta (soft delete)
 */
export const desativarPlanoConta = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Verificar se conta tem filhos ativos
  const { count: filhosCount, error: erroFilhos } = await supabase
    .from('plano_contas')
    .select('*', { count: 'exact', head: true })
    .eq('conta_pai_id', id)
    .eq('ativo', true);

  if (erroFilhos) {
    throw new Error(`Erro ao verificar contas filhas: ${erroFilhos.message}`);
  }

  if (filhosCount && filhosCount > 0) {
    throw new Error('Não é possível desativar conta com contas filhas ativas');
  }

  // TODO: Verificar se conta tem lançamentos associados quando a tabela de lançamentos existir

  const { data, error } = await supabase
    .from('plano_contas')
    .update({ ativo: false })
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Erro ao desativar conta: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Conta não encontrada');
  }

  await invalidatePlanoContasCache();
};

/**
 * Ativar conta
 */
export const ativarPlanoConta = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Se conta tem pai, verificar se pai está ativo
  const { data: conta, error: erroConsulta } = await supabase
    .from('plano_contas')
    .select('conta_pai_id')
    .eq('id', id)
    .single();

  if (erroConsulta) {
    if (erroConsulta.code === 'PGRST116') {
      throw new Error('Conta não encontrada');
    }
    throw new Error(`Erro ao buscar conta: ${erroConsulta.message}`);
  }

  if (!conta) {
    throw new Error('Conta não encontrada');
  }

  if (conta.conta_pai_id) {
    const { data: contaPai, error: erroPai } = await supabase
      .from('plano_contas')
      .select('ativo')
      .eq('id', conta.conta_pai_id)
      .single();

    if (erroPai || !contaPai) {
      throw new Error('Conta pai não encontrada');
    }

    if (!contaPai.ativo) {
      throw new Error('Não é possível ativar conta quando a conta pai está inativa');
    }
  }

  const { data: updatedData, error } = await supabase
    .from('plano_contas')
    .update({ ativo: true })
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Erro ao ativar conta: ${error.message}`);
  }

  if (!updatedData || updatedData.length === 0) {
    throw new Error('Conta não encontrada');
  }

  await invalidatePlanoContasCache();
};

/**
 * Deletar conta permanentemente (apenas se não houver dependências)
 */
export const deletarPlanoConta = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Verificar se conta tem filhos
  const { count: filhosCount, error: erroFilhos } = await supabase
    .from('plano_contas')
    .select('*', { count: 'exact', head: true })
    .eq('conta_pai_id', id);

  if (erroFilhos) {
    throw new Error(`Erro ao verificar contas filhas: ${erroFilhos.message}`);
  }

  if (filhosCount && filhosCount > 0) {
    throw new Error('Não é possível deletar conta com contas filhas');
  }

  // TODO: Verificar se conta tem lançamentos quando tabela existir

  const { data, error } = await supabase
    .from('plano_contas')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Erro ao deletar conta: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Conta não encontrada');
  }

  await invalidatePlanoContasCache();
};

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Verificar se código já existe
 */
export const verificarCodigoExistente = async (
  codigo: string,
  excluirId?: number
): Promise<boolean> => {
  const supabase = createServiceClient();

  let query = supabase
    .from('plano_contas')
    .select('id', { count: 'exact', head: true })
    .eq('codigo', codigo);

  if (excluirId) {
    query = query.neq('id', excluirId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao verificar código: ${error.message}`);
  }

  return (count || 0) > 0;
};

/**
 * Contar contas filhas de uma conta
 */
export const contarContasFilhas = async (contaPaiId: number): Promise<number> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('plano_contas')
    .select('*', { count: 'exact', head: true })
    .eq('conta_pai_id', contaPaiId);

  if (error) {
    throw new Error(`Erro ao contar contas filhas: ${error.message}`);
  }

  return count || 0;
};

/**
 * Listar contas sintéticas ativas (para seletor de conta pai)
 */
export const listarContasSinteticas = async (): Promise<PlanoConta[]> => {
  const cacheKey = `${CACHE_PREFIXES.planoContas}:sinteticas`;
  const cached = await getCached<PlanoConta[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('plano_contas')
    .select('*')
    .eq('nivel', 'sintetica' as unknown as number)
    .eq('ativo', true)
    .order('codigo', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar contas sintéticas: ${error.message}`);
  }

  const result = (data || []).map((item) => mapearPlanoConta(item as unknown as PlanoContaRecord));
  await setCached(cacheKey, result, 900);
  return result;
};
