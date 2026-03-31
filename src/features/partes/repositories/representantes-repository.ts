/**
 * Partes > Representantes > Repository
 *
 * Camada de acesso a dados para representantes (tabela public.representantes).
 * Mantém o contrato do antigo backend, porém dentro de features (FSD).
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  ListarRepresentantesResult,
  OperacaoRepresentanteResult,
  Representante,
  RepresentanteComEndereco,
  UpsertRepresentantePorCPFParams,
} from '../types/representantes';
import type { ProcessoRelacionado } from '../domain';

type Ordem = 'asc' | 'desc';

function normalizarCpf(cpf: string): string {
  return cpf.replace(/[.\-\s]/g, '');
}

function toOrder(ordem?: Ordem): boolean {
  return (ordem ?? 'asc') === 'asc';
}

function calcularPaginacao(pagina?: number, limite?: number) {
  const paginaFinal = pagina && pagina > 0 ? pagina : 1;
  const limiteFinal = limite && limite > 0 ? limite : 50;
  const offset = (paginaFinal - 1) * limiteFinal;
  return { pagina: paginaFinal, limite: limiteFinal, offset };
}

async function buscarPorId(id: number): Promise<Representante | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante: ${error.message}`);
  }

  return (data as unknown as Representante) || null;
}

export async function buscarRepresentantePorId(id: number): Promise<Representante | null> {
  return await buscarPorId(id);
}

export async function buscarRepresentantePorIdComEndereco(
  id: number
): Promise<RepresentanteComEndereco | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('representantes')
    .select('*, enderecos(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante com endereço: ${error.message}`);
  }

  return (data as unknown as RepresentanteComEndereco) || null;
}

export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante por CPF: ${error.message}`);
  }

  return (data as unknown as Representante) || null;
}

export async function listarRepresentantes(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  const supabase = createServiceClient();
  const { pagina, limite, offset } = calcularPaginacao(params.pagina, params.limite);

  let query = supabase
    .from('representantes')
    .select('*', { count: 'exact' });

  if (params.nome) query = query.ilike('nome', `%${params.nome}%`);
  if (params.cpf) query = query.eq('cpf', normalizarCpf(params.cpf));

  // Busca textual (nome, cpf, email). Evitamos operar em JSONB para performance/compatibilidade.
  if (params.busca) {
    const termo = params.busca.trim();
    if (termo) {
      query = query.or(
        `nome.ilike.%${termo}%,cpf.ilike.%${termo}%,email.ilike.%${termo}%`
      );
    }
  }

  // Filtro por OAB (melhor esforço via containment em JSONB).
  // OBS: contém exige match exato do objeto.
  if (params.oab) {
    const oab = params.oab.trim();
    if (oab) {
      // tenta como veio (ex: "MG128404")
      query = query.contains('oabs', [{ numero: oab }]);
    }
  }

  if (params.uf_oab) {
    const uf = params.uf_oab.trim().toUpperCase();
    if (uf) {
      query = query.contains('oabs', [{ uf }]);
    }
  }

  const ordenarPor = params.ordenar_por ?? 'nome';
  const ordemAsc = toOrder(params.ordem);

  query = query
    .order(ordenarPor, { ascending: ordemAsc })
    .range(offset, offset + limite - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Erro ao listar representantes: ${error.message}`);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return {
    representantes: (data as unknown as Representante[]) || [],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

export async function listarRepresentantesComEndereco(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  const supabase = createServiceClient();
  const { pagina, limite, offset } = calcularPaginacao(params.pagina, params.limite);

  let query = supabase
    .from('representantes')
    .select('*, enderecos(*)', { count: 'exact' });

  if (params.nome) query = query.ilike('nome', `%${params.nome}%`);
  if (params.cpf) query = query.eq('cpf', normalizarCpf(params.cpf));

  if (params.busca) {
    const termo = params.busca.trim();
    if (termo) {
      query = query.or(
        `nome.ilike.%${termo}%,cpf.ilike.%${termo}%,email.ilike.%${termo}%`
      );
    }
  }

  if (params.oab) {
    const oab = params.oab.trim();
    if (oab) query = query.contains('oabs', [{ numero: oab }]);
  }

  if (params.uf_oab) {
    const uf = params.uf_oab.trim().toUpperCase();
    if (uf) query = query.contains('oabs', [{ uf }]);
  }

  const ordenarPor = params.ordenar_por ?? 'nome';
  const ordemAsc = toOrder(params.ordem);

  query = query
    .order(ordenarPor, { ascending: ordemAsc })
    .range(offset, offset + limite - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Erro ao listar representantes com endereço: ${error.message}`);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return {
    representantes: ((data as unknown as RepresentanteComEndereco[]) || []) as unknown as Representante[],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Lista representantes com endereço e processos relacionados.
 * Busca processos em processo_partes com tipo_entidade = 'representante'.
 */
export async function listarRepresentantesComEnderecoEProcessos(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  const supabase = createServiceClient();

  // 1. Buscar representantes com endereço
  const result = await listarRepresentantesComEndereco(params);
  if (!result.representantes || result.representantes.length === 0) {
    return result;
  }

  // 2. Extrair IDs dos representantes
  const ids = result.representantes.map((r) => r.id);

  // 3. Buscar processos relacionados em processo_partes
  const { data: processos, error } = await supabase
    .from('processo_partes')
    .select('entidade_id, processo_id, numero_processo, tipo_parte, polo')
    .eq('tipo_entidade', 'representante')
    .in('entidade_id', ids);

  if (error) {
    console.error('Erro ao buscar processos de representantes:', error.message);
    // Retorna sem processos se houver erro
    return result;
  }

  // 4. Mapear processos para cada representante
  const processosMap = new Map<number, ProcessoRelacionado[]>();
  processos?.forEach((p) => {
    if (!processosMap.has(p.entidade_id)) {
      processosMap.set(p.entidade_id, []);
    }
    processosMap.get(p.entidade_id)!.push({
      processo_id: p.processo_id,
      numero_processo: p.numero_processo ?? '',
      tipo_parte: p.tipo_parte,
      polo: p.polo,
    });
  });

  // 5. Adicionar processos aos representantes
  const representantesComProcessos = result.representantes.map((rep) => ({
    ...rep,
    processos_relacionados: processosMap.get(rep.id) || [],
  }));

  return {
    ...result,
    representantes: representantesComProcessos as Representante[],
  };
}

export async function criarRepresentante(
  params: CriarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  const supabase = createServiceClient();
  const cpf = normalizarCpf(params.cpf);

  const insertData = {
      cpf,
      nome: params.nome.trim(),
      sexo: params.sexo ?? null,
      tipo: params.tipo ?? null,
      oabs: (params.oabs ?? []) as unknown as import('@/lib/supabase/database.types').Json,
      emails: params.emails ?? null,
      email: params.email ?? null,
      ddd_celular: params.ddd_celular ?? null,
      numero_celular: params.numero_celular ?? null,
      ddd_residencial: params.ddd_residencial ?? null,
      numero_residencial: params.numero_residencial ?? null,
      ddd_comercial: params.ddd_comercial ?? null,
      numero_comercial: params.numero_comercial ?? null,
      endereco_id: params.endereco_id ?? null,
      dados_anteriores: (params.dados_anteriores ?? null) as unknown as import('@/lib/supabase/database.types').Json,
    };

  const { data, error } = await supabase
    .from('representantes')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true, representante: data as Representante };
}

export async function atualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  const supabase = createServiceClient();
  const existente = await buscarPorId(params.id);

  if (!existente) {
    return { sucesso: false, erro: 'Representante não encontrado' };
  }

  const { id, ...patch } = params;

  const payload: Record<string, unknown> = {
    ...patch,
    // Auditoria: preserva snapshot anterior
    dados_anteriores: {
      ...existente,
      updated_at: existente.updated_at,
    },
    updated_at: new Date().toISOString(),
  };

  if (payload.cpf && typeof payload.cpf === 'string') payload.cpf = normalizarCpf(payload.cpf);
  if (payload.nome && typeof payload.nome === 'string') payload.nome = payload.nome.trim();

  const { data, error } = await supabase
    .from('representantes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true, representante: data as Representante };
}

export async function deletarRepresentante(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('representantes')
    .delete()
    .eq('id', id);

  if (error) return { sucesso: false, erro: error.message };
  return { sucesso: true };
}

/**
 * Exclui múltiplos representantes permanentemente (hard delete)
 */
export async function deletarRepresentantesEmMassa(ids: number[]): Promise<{ sucesso: boolean; total: number; erro?: string }> {
  if (ids.length === 0) return { sucesso: true, total: 0 };
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('representantes')
    .delete()
    .in('id', ids)
    .select('id');

  if (error) return { sucesso: false, total: 0, erro: error.message };
  return { sucesso: true, total: data?.length ?? 0 };
}

export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<{ sucesso: boolean; representante?: Representante; criado: boolean; erro?: string }> {
  const cpf = normalizarCpf(params.cpf);
  const existente = await buscarRepresentantePorCPF(cpf);

  if (existente) {
    const atualizado = await atualizarRepresentante({
      id: existente.id,
      cpf,
      nome: params.nome,
      sexo: params.sexo ?? null,
      tipo: params.tipo ?? null,
      oabs: params.oabs ?? [],
      emails: params.emails ?? null,
      email: params.email ?? null,
      ddd_celular: params.ddd_celular ?? null,
      numero_celular: params.numero_celular ?? null,
      ddd_residencial: params.ddd_residencial ?? null,
      numero_residencial: params.numero_residencial ?? null,
      ddd_comercial: params.ddd_comercial ?? null,
      numero_comercial: params.numero_comercial ?? null,
      endereco_id: params.endereco_id ?? null,
    });

    return {
      sucesso: atualizado.sucesso,
      representante: atualizado.representante,
      criado: false,
      erro: atualizado.erro,
    };
  }

  const criado = await criarRepresentante(params);
  return {
    sucesso: criado.sucesso,
    representante: criado.representante,
    criado: true,
    erro: criado.erro,
  };
}

export async function buscarRepresentantePorNome(nome: string): Promise<Representante[]> {
  const supabase = createServiceClient();
  const nomeTrim = nome.trim();

  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .ilike('nome', `%${nomeTrim}%`)
    .order('nome', { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data as unknown as Representante[]) || [];
}

export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Representante[]> {
  const supabase = createServiceClient();
  const oab = params.oab.trim();
  const uf = params.uf?.trim().toUpperCase();

  let query = supabase.from('representantes').select('*');

  if (uf) {
    query = query.contains('oabs', [{ uf, numero: oab }]);
  } else {
    query = query.contains('oabs', [{ numero: oab }]);
  }

  const { data, error } = await query.order('nome', { ascending: true }).limit(100);
  if (error) throw new Error(error.message);
  return (data as unknown as Representante[]) || [];
}

/**
 * Conta o total de representantes no banco
 */
export async function countRepresentantes(): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('representantes')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`Erro ao contar representantes: ${error.message}`);
  return count ?? 0;
}

/**
 * Conta representantes criados entre duas datas (inclusive)
 */
export async function countRepresentantesEntreDatas(dataInicio: Date, dataFim: Date): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('representantes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dataInicio.toISOString())
    .lte('created_at', dataFim.toISOString());

  if (error) throw new Error(`Erro ao contar representantes entre datas: ${error.message}`);
  return count ?? 0;
}


