/**
 * PARTES CONTRARIAS REPOSITORY - Persistencia de Partes Contrarias
 *
 * Funcoes de acesso ao banco de dados para Partes Contrarias.
 * Extraido do repository monolitico para melhor organizacao.
 */

import { createDbClient } from '@/lib/supabase';
import { fromSnakeToCamel } from '@/lib/utils';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import type {
  ParteContraria,
  ParteContrariaComEndereco,
  CreateParteContrariaInput,
  UpdateParteContrariaInput,
  ListarPartesContrariasParams,
  ParteContrariaComEnderecoEProcessos,
  ProcessoRelacionado,
} from '../domain';
import { normalizarDocumento } from '../domain';
import { converterParaParteContraria } from './shared/converters';

const TABLE_PARTES_CONTRARIAS = 'partes_contrarias';

type ListarPartesContrariasParamsCompat = ListarPartesContrariasParams & {
  tipoPessoa?: string;
  cpfCnpj?: string;
  ordenarPor?: string;
};

function normalizeTipoPessoa(value: unknown): 'PF' | 'PJ' | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'PF') return 'PF';
  if (normalized === 'PJ') return 'PJ';
  return undefined;
}

function mapOrdenarPorToColumn(value: unknown): string {
  if (typeof value !== 'string') return 'created_at';
  switch (value) {
    case 'nomeCompleto':
      return 'nome_completo';
    case 'razaoSocial':
      return 'razao_social';
    case 'nomeFantasia':
      return 'nome_fantasia';
    case 'tipoPessoa':
      return 'tipo_pessoa';
    case 'createdAt':
      return 'created_at';
    case 'updatedAt':
      return 'updated_at';
    default:
      return value;
  }
}

function toDbInsertFromCompat(input: unknown): Record<string, unknown> {
  const data = (input ?? {}) as Record<string, unknown>;

  const tipoPessoa = normalizeTipoPessoa(data.tipoPessoa) ?? normalizeTipoPessoa(data.tipo_pessoa);
  const nomeCompleto = typeof data.nomeCompleto === 'string' ? data.nomeCompleto : undefined;
  const razaoSocial = typeof data.razaoSocial === 'string' ? data.razaoSocial : undefined;
  const nomeFantasia = typeof data.nomeFantasia === 'string' ? data.nomeFantasia : undefined;

  const payload: Record<string, unknown> = {
    tipo_pessoa: tipoPessoa ?? data.tipo_pessoa,
    nome_completo: nomeCompleto ?? data.nome_completo,
    razao_social: razaoSocial ?? data.razao_social,
    nome_fantasia: nomeFantasia ?? data.nome_fantasia,
    cpf: data.cpf ?? null,
    cnpj: data.cnpj ?? null,
    email: data.email ?? null,
    telefone: data.telefone ?? null,
    observacoes: data.observacoes ?? null,
    ativo: data.ativo ?? true,
  };

  return payload;
}

function toDbUpdateFromCompat(input: unknown): Record<string, unknown> {
  const data = (input ?? {}) as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.nomeCompleto !== undefined) payload.nome_completo = data.nomeCompleto;
  if (data.razaoSocial !== undefined) payload.razao_social = data.razaoSocial;
  if (data.nomeFantasia !== undefined) payload.nome_fantasia = data.nomeFantasia;
  if (data.email !== undefined) payload.email = data.email;
  if (data.telefone !== undefined) payload.telefone = data.telefone;
  if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
  if (data.cpf !== undefined) payload.cpf = data.cpf;
  if (data.cnpj !== undefined) payload.cnpj = data.cnpj;
  if (data.ativo !== undefined) payload.ativo = data.ativo;
  if (data.tipoPessoa !== undefined) payload.tipo_pessoa = normalizeTipoPessoa(data.tipoPessoa) ?? data.tipoPessoa;

  return payload;
}

/**
 * Busca uma parte contraria pelo ID
 */
export async function findParteContrariaById(id: number): Promise<Result<ParteContraria | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar parte contraria', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca uma parte contraria pelo CPF
 */
export async function findParteContrariaByCPF(cpf: string): Promise<Result<ParteContraria | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).select('*').eq('cpf', cpf).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar parte contraria por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca uma parte contraria pelo CNPJ
 */
export async function findParteContrariaByCNPJ(cnpj: string): Promise<Result<ParteContraria | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).select('*').eq('cnpj', cnpj).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar parte contraria por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista partes contrarias com filtros e paginacao
 */
export async function findAllPartesContrarias(
  params: ListarPartesContrariasParamsCompat = {}
): Promise<Result<PaginatedResponse<ParteContraria>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipoPessoa,
      situacao,
      busca,
      nome,
      cpf,
      cnpj,
      cpfCnpj,
      ordenar_por = 'created_at',
      ordenarPor,
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_PARTES_CONTRARIAS).select('*', { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    const tipoPessoaResolved = normalizeTipoPessoa(tipo_pessoa) ?? normalizeTipoPessoa(tipoPessoa);
    if (tipoPessoaResolved) query = query.eq('tipo_pessoa', tipoPessoaResolved);
    if (situacao) query = query.eq('situacao', situacao);
    if (nome) query = query.ilike('nome_completo', `%${nome}%`);
    if (cpf) query = query.eq('cpf', cpf);
    if (cnpj) query = query.eq('cnpj', cnpj);

    if (cpfCnpj) {
      const doc = cpfCnpj.trim();
      query = query.or(`cpf.ilike.%${doc}%,cnpj.ilike.%${doc}%`);
    }

    const ordenarPorResolved = (ordenarPor ?? ordenar_por) as unknown;
    const column = mapOrdenarPorToColumn(ordenarPorResolved);

    query = query.order(column, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    const paginated: PaginatedResponse<ParteContraria> = {
      data: (data || []).map((d) => fromSnakeToCamel(d as Record<string, unknown>) as unknown as ParteContraria),
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    };

    return {
      success: true,
      data: paginated,
      total,
      pagina,
      limite,
      totalPaginas: totalPages,
    } as Result<PaginatedResponse<ParteContraria>>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar partes contrarias', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca partes contrárias por termo (nome, CPF ou CNPJ) com endereço populado.
 * Retorna até `limite` resultados ordenados por nome.
 * Usada no typeahead de busca de parte contrária na assinatura digital.
 */
export async function searchPartesContrariaComEndereco(
  busca: string,
  limite = 10
): Promise<Result<ParteContrariaComEndereco[]>> {
  try {
    const db = createDbClient();
    const buscaTrimmed = busca.trim();

    if (buscaTrimmed.length < 2) {
      return ok([]);
    }

    const { data, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select(`*, endereco:enderecos(*)`)
      .or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      )
      .order('nome', { ascending: true })
      .limit(limite);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const results: ParteContrariaComEndereco[] = (data || []).map((row) => {
      const parteContraria = converterParaParteContraria(row as Record<string, unknown>);
      const enderecoRaw = row.endereco as Record<string, unknown> | null;

      return {
        ...parteContraria,
        endereco: enderecoRaw
          ? {
              id: enderecoRaw.id as number,
              cep: enderecoRaw.cep as string | null,
              logradouro: enderecoRaw.logradouro as string | null,
              numero: enderecoRaw.numero as string | null,
              complemento: enderecoRaw.complemento as string | null,
              bairro: enderecoRaw.bairro as string | null,
              municipio: enderecoRaw.municipio as string | null,
              estado_sigla: enderecoRaw.estado_sigla as string | null,
              pais: enderecoRaw.pais as string | null,
            }
          : null,
      } as ParteContrariaComEndereco;
    });

    return ok(results);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar partes contrárias', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista todas as partes contrarias com endereco e processos relacionados
 */
export async function findAllPartesContrariasComEnderecoEProcessos(
  params: ListarPartesContrariasParams = {}
): Promise<Result<PaginatedResponse<ParteContrariaComEnderecoEProcessos>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      situacao,
      busca,
      nome,
      cpf,
      cnpj,
      ordenar_por = 'created_at',
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_PARTES_CONTRARIAS).select(`*, endereco:enderecos(*)`, { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (tipo_pessoa) query = query.eq('tipo_pessoa', tipo_pessoa);
    if (situacao) query = query.eq('situacao', situacao);
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', normalizarDocumento(cpf));
    if (cnpj) query = query.eq('cnpj', normalizarDocumento(cnpj));

    query = query.order(ordenar_por, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    // Extrair IDs das partes contrarias para buscar processos
    const parteContrariaIds = (data || []).map((row) => row.id as number);
    const processosMap: Map<number, ProcessoRelacionado[]> = new Map();

    if (parteContrariaIds.length > 0) {
      const { data: processosData, error: processosError } = await db
        .from('processo_partes')
        .select(`
          entidade_id,
          processo_id,
          numero_processo,
          tipo_parte,
          polo,
          acervo:processo_id(
            nome_parte_autora,
            nome_parte_re,
            grau,
            codigo_status_processo,
            classe_judicial,
            data_proxima_audiencia,
            trt
          )
        `)
        .eq('tipo_entidade', 'parte_contraria')
        .in('entidade_id', parteContrariaIds);

      if (!processosError && processosData) {
        for (const processo of processosData) {
          const entidadeId = processo.entidade_id as number;
          const acervoRaw = (processo as { acervo?: unknown }).acervo;
          const acervo = Array.isArray(acervoRaw) ? acervoRaw[0] as Record<string, unknown> | undefined : acervoRaw as Record<string, unknown> | null | undefined;
          if (!processosMap.has(entidadeId)) {
            processosMap.set(entidadeId, []);
          }
          processosMap.get(entidadeId)!.push({
            processo_id: processo.processo_id as number,
            numero_processo: processo.numero_processo as string,
            tipo_parte: processo.tipo_parte as string,
            polo: processo.polo as string,
            nome_parte_autora: acervo?.nome_parte_autora as string | null | undefined,
            nome_parte_re: acervo?.nome_parte_re as string | null | undefined,
            grau: acervo?.grau as string | null | undefined,
            codigo_status_processo: acervo?.codigo_status_processo as string | null | undefined,
            classe_judicial: acervo?.classe_judicial as string | null | undefined,
            data_proxima_audiencia: acervo?.data_proxima_audiencia as string | null | undefined,
            trt: acervo?.trt as string | null | undefined,
          });
        }
      }
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    const partesContrariasComProcessos = (data || []).map((row) => {
      const parteContraria = converterParaParteContraria(row as Record<string, unknown>);
      const endereco = row.endereco as Record<string, unknown> | null;

      return {
        ...parteContraria,
        endereco: endereco
          ? {
              id: endereco.id as number,
              cep: endereco.cep as string | null,
              logradouro: endereco.logradouro as string | null,
              numero: endereco.numero as string | null,
              complemento: endereco.complemento as string | null,
              bairro: endereco.bairro as string | null,
              municipio: endereco.municipio as string | null,
              estado_sigla: endereco.estado_sigla as string | null,
              pais: endereco.pais as string | null,
            }
          : null,
        processos_relacionados: processosMap.get(parteContraria.id) || [],
      } as ParteContrariaComEnderecoEProcessos;
    });

    return ok({
      data: partesContrariasComProcessos,
      pagination: { page: pagina, limit: limite, total, totalPages, hasMore: pagina < totalPages },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar partes contrarias com endereco e processos', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Salva uma nova parte contraria no banco
 */
export async function saveParteContraria(input: CreateParteContrariaInput): Promise<Result<ParteContraria>> {
  try {
    const db = createDbClient();

    // Compatibilidade com fixtures/tests: aceitar input em camelCase (src/app/(authenticated)/partes/types)
    if (
      typeof (input as unknown as Record<string, unknown>)?.tipoPessoa === 'string' ||
      typeof (input as unknown as Record<string, unknown>)?.nomeCompleto === 'string'
    ) {
      const payload = toDbInsertFromCompat(input);
      const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).insert(payload).select().single();

      if (error) {
        if (error.code === '23505') {
          return err(appError('CONFLICT', 'Parte contraria duplicada', { code: error.code }));
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
      }

      return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
    }

    const dadosInsercao: Record<string, unknown> = {
      tipo_pessoa: input.tipo_pessoa,
      nome: input.nome.trim(),
      nome_social_fantasia: input.nome_social_fantasia?.trim() || null,
      emails: input.emails ?? null,
      ddd_celular: input.ddd_celular?.trim() || null,
      numero_celular: input.numero_celular?.trim() || null,
      ddd_residencial: input.ddd_residencial?.trim() || null,
      numero_residencial: input.numero_residencial?.trim() || null,
      ddd_comercial: input.ddd_comercial?.trim() || null,
      numero_comercial: input.numero_comercial?.trim() || null,
      // Sanitizar tipo_documento: banco aceita apenas 'CPF' ou 'CNPJ' (CHECK constraint)
      tipo_documento: (() => { const td = input.tipo_documento?.trim() || null; return td === 'CPF' || td === 'CNPJ' ? td : null; })(),
      status_pje: input.status_pje?.trim() || null,
      situacao_pje: input.situacao_pje?.trim() || null,
      login_pje: input.login_pje?.trim() || null,
      autoridade: input.autoridade ?? null,
      observacoes: input.observacoes?.trim() || null,
      dados_anteriores: null,
      endereco_id: input.endereco_id ?? null,
      ativo: input.ativo ?? true,
      created_by: input.created_by ?? null,
    };

    if (input.tipo_pessoa === 'pf') {
      dadosInsercao.cpf = input.cpf;
      dadosInsercao.rg = input.rg?.trim() || null;
      dadosInsercao.data_nascimento = input.data_nascimento || null;
      dadosInsercao.genero = input.genero?.trim() || null;
      dadosInsercao.estado_civil = input.estado_civil?.trim() || null;
      dadosInsercao.nacionalidade = input.nacionalidade?.trim() || null;
      dadosInsercao.sexo = input.sexo?.trim() || null;
      dadosInsercao.nome_genitora = input.nome_genitora?.trim() || null;
      dadosInsercao.naturalidade_id_pje = input.naturalidade_id_pje ?? null;
      dadosInsercao.naturalidade_municipio = input.naturalidade_municipio?.trim() || null;
      dadosInsercao.naturalidade_estado_id_pje = input.naturalidade_estado_id_pje ?? null;
      dadosInsercao.naturalidade_estado_sigla = input.naturalidade_estado_sigla?.trim() || null;
      dadosInsercao.uf_nascimento_id_pje = input.uf_nascimento_id_pje ?? null;
      dadosInsercao.uf_nascimento_sigla = input.uf_nascimento_sigla?.trim() || null;
      dadosInsercao.uf_nascimento_descricao = input.uf_nascimento_descricao?.trim() || null;
      dadosInsercao.pais_nascimento_id_pje = input.pais_nascimento_id_pje ?? null;
      dadosInsercao.pais_nascimento_codigo = input.pais_nascimento_codigo?.trim() || null;
      dadosInsercao.pais_nascimento_descricao = input.pais_nascimento_descricao?.trim() || null;
      dadosInsercao.escolaridade_codigo = input.escolaridade_codigo ?? null;
      dadosInsercao.situacao_cpf_receita_id = input.situacao_cpf_receita_id ?? null;
      dadosInsercao.situacao_cpf_receita_descricao = input.situacao_cpf_receita_descricao?.trim() || null;
      dadosInsercao.pode_usar_celular_mensagem = input.pode_usar_celular_mensagem ?? null;
    } else {
      dadosInsercao.cnpj = input.cnpj;
      dadosInsercao.inscricao_estadual = input.inscricao_estadual?.trim() || null;
      dadosInsercao.data_abertura = input.data_abertura || null;
      dadosInsercao.data_fim_atividade = input.data_fim_atividade || null;
      dadosInsercao.orgao_publico = input.orgao_publico ?? null;
      dadosInsercao.tipo_pessoa_codigo_pje = input.tipo_pessoa_codigo_pje?.trim() || null;
      dadosInsercao.tipo_pessoa_label_pje = input.tipo_pessoa_label_pje?.trim() || null;
      dadosInsercao.tipo_pessoa_validacao_receita = input.tipo_pessoa_validacao_receita?.trim() || null;
      dadosInsercao.ds_tipo_pessoa = input.ds_tipo_pessoa?.trim() || null;
      dadosInsercao.situacao_cnpj_receita_id = input.situacao_cnpj_receita_id ?? null;
      dadosInsercao.situacao_cnpj_receita_descricao = input.situacao_cnpj_receita_descricao?.trim() || null;
      dadosInsercao.ramo_atividade = input.ramo_atividade?.trim() || null;
      dadosInsercao.cpf_responsavel = input.cpf_responsavel?.trim() || null;
      dadosInsercao.oficial = input.oficial ?? null;
      dadosInsercao.ds_prazo_expediente_automatico = input.ds_prazo_expediente_automatico?.trim() || null;
      dadosInsercao.porte_codigo = input.porte_codigo ?? null;
      dadosInsercao.porte_descricao = input.porte_descricao?.trim() || null;
      dadosInsercao.ultima_atualizacao_pje = input.ultima_atualizacao_pje || null;
    }

    const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).insert(dadosInsercao).select().single();

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          return err(appError('CONFLICT', 'Parte contraria com este CPF ja cadastrada', { field: 'cpf' }));
        } else if (error.message.includes('cnpj')) {
          return err(appError('CONFLICT', 'Parte contraria com este CNPJ ja cadastrada', { field: 'cnpj' }));
        }
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao salvar parte contraria', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Atualiza uma parte contraria existente
 */
export async function updateParteContraria(
  id: number,
  input: UpdateParteContrariaInput,
  dadosAnteriores?: ParteContraria
): Promise<Result<ParteContraria>> {
  try {
    const db = createDbClient();

    // Compatibilidade com fixtures/tests: aceitar updates em camelCase (nomeCompleto, observacoes...)
    if (
      typeof (input as unknown as Record<string, unknown>)?.nomeCompleto === 'string' ||
      (input as unknown as Record<string, unknown>)?.observacoes !== undefined
    ) {
      const payload = toDbUpdateFromCompat(input);
      const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).update(payload).eq('id', id).select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          return err(appError('NOT_FOUND', `Parte contraria com ID ${id} nao encontrada`));
        }
        if (error.code === '23505') {
          return err(appError('CONFLICT', 'Parte contraria duplicada', { code: error.code }));
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
      }

      return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
    }

    const dadosAtualizacao: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dadosAnteriores) {
      dadosAtualizacao.dados_anteriores = dadosAnteriores;
    }

    // Campos base
    if (input.nome !== undefined) dadosAtualizacao.nome = input.nome.trim();
    if (input.nome_social_fantasia !== undefined) dadosAtualizacao.nome_social_fantasia = input.nome_social_fantasia?.trim() || null;
    if (input.emails !== undefined) dadosAtualizacao.emails = input.emails;
    if (input.ddd_celular !== undefined) dadosAtualizacao.ddd_celular = input.ddd_celular?.trim() || null;
    if (input.numero_celular !== undefined) dadosAtualizacao.numero_celular = input.numero_celular?.trim() || null;
    if (input.ddd_residencial !== undefined) dadosAtualizacao.ddd_residencial = input.ddd_residencial?.trim() || null;
    if (input.numero_residencial !== undefined) dadosAtualizacao.numero_residencial = input.numero_residencial?.trim() || null;
    if (input.ddd_comercial !== undefined) dadosAtualizacao.ddd_comercial = input.ddd_comercial?.trim() || null;
    if (input.numero_comercial !== undefined) dadosAtualizacao.numero_comercial = input.numero_comercial?.trim() || null;
    if (input.tipo_documento !== undefined) {
      const tipoDoc = input.tipo_documento?.trim() || null;
      dadosAtualizacao.tipo_documento = tipoDoc === 'CPF' || tipoDoc === 'CNPJ' ? tipoDoc : null;
    }
    if (input.status_pje !== undefined) dadosAtualizacao.status_pje = input.status_pje?.trim() || null;
    if (input.situacao_pje !== undefined) dadosAtualizacao.situacao_pje = input.situacao_pje?.trim() || null;
    if (input.login_pje !== undefined) dadosAtualizacao.login_pje = input.login_pje?.trim() || null;
    if (input.autoridade !== undefined) dadosAtualizacao.autoridade = input.autoridade;
    if (input.observacoes !== undefined) dadosAtualizacao.observacoes = input.observacoes?.trim() || null;
    if (input.endereco_id !== undefined) dadosAtualizacao.endereco_id = input.endereco_id;
    if (input.ativo !== undefined) dadosAtualizacao.ativo = input.ativo;
    if (input.cpf !== undefined) dadosAtualizacao.cpf = input.cpf;
    if (input.cnpj !== undefined) dadosAtualizacao.cnpj = input.cnpj;

    // Campos PF
    if (input.rg !== undefined) dadosAtualizacao.rg = input.rg?.trim() || null;
    if (input.data_nascimento !== undefined) dadosAtualizacao.data_nascimento = input.data_nascimento;
    if (input.genero !== undefined) dadosAtualizacao.genero = input.genero?.trim() || null;
    if (input.estado_civil !== undefined) dadosAtualizacao.estado_civil = input.estado_civil?.trim() || null;
    if (input.nacionalidade !== undefined) dadosAtualizacao.nacionalidade = input.nacionalidade?.trim() || null;
    if (input.sexo !== undefined) dadosAtualizacao.sexo = input.sexo?.trim() || null;
    if (input.nome_genitora !== undefined) dadosAtualizacao.nome_genitora = input.nome_genitora?.trim() || null;
    if (input.naturalidade_id_pje !== undefined) dadosAtualizacao.naturalidade_id_pje = input.naturalidade_id_pje;
    if (input.naturalidade_municipio !== undefined) dadosAtualizacao.naturalidade_municipio = input.naturalidade_municipio?.trim() || null;
    if (input.naturalidade_estado_id_pje !== undefined) dadosAtualizacao.naturalidade_estado_id_pje = input.naturalidade_estado_id_pje;
    if (input.naturalidade_estado_sigla !== undefined) dadosAtualizacao.naturalidade_estado_sigla = input.naturalidade_estado_sigla?.trim() || null;

    // Campos PJ
    if (input.inscricao_estadual !== undefined) dadosAtualizacao.inscricao_estadual = input.inscricao_estadual?.trim() || null;
    if (input.data_abertura !== undefined) dadosAtualizacao.data_abertura = input.data_abertura;
    if (input.data_fim_atividade !== undefined) dadosAtualizacao.data_fim_atividade = input.data_fim_atividade;
    if (input.orgao_publico !== undefined) dadosAtualizacao.orgao_publico = input.orgao_publico;
    if (input.tipo_pessoa_codigo_pje !== undefined) dadosAtualizacao.tipo_pessoa_codigo_pje = input.tipo_pessoa_codigo_pje?.trim() || null;

    const { data, error } = await db.from(TABLE_PARTES_CONTRARIAS).update(dadosAtualizacao).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', `Parte contraria com ID ${id} nao encontrada`));
      }
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          return err(appError('CONFLICT', 'Parte contraria com este CPF ja cadastrada', { field: 'cpf' }));
        } else if (error.message.includes('cnpj')) {
          return err(appError('CONFLICT', 'Parte contraria com este CNPJ ja cadastrada', { field: 'cnpj' }));
        }
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as ParteContraria);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao atualizar parte contraria', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de parte contraria por CPF
 */
export async function upsertParteContrariaByCPF(
  input: CreateParteContrariaInput
): Promise<Result<{ parteContraria: ParteContraria; created: boolean }>> {
  try {
    const cpf = (input as unknown as Record<string, unknown>)?.cpf;
    if (typeof cpf !== 'string' || !cpf.trim()) {
      return err(appError('VALIDATION_ERROR', 'CPF é obrigatório'));
    }

    const existingResult = await findParteContrariaByCPF(cpf);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateParteContraria(existingResult.data.id, input as UpdateParteContrariaInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      return {
        success: true,
        data: { parteContraria: updateResult.data, created: false },
        created: false,
      } as Result<{ parteContraria: ParteContraria; created: boolean }>;
    }

    const createResult = await saveParteContraria(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    return {
      success: true,
      data: { parteContraria: createResult.data, created: true },
      created: true,
    } as Result<{ parteContraria: ParteContraria; created: boolean }>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de parte contraria por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de parte contraria por CNPJ
 */
export async function upsertParteContrariaByCNPJ(
  input: CreateParteContrariaInput
): Promise<Result<{ parteContraria: ParteContraria; created: boolean }>> {
  try {
    const cnpj = (input as unknown as Record<string, unknown>)?.cnpj;
    if (typeof cnpj !== 'string' || !cnpj.trim()) {
      return err(appError('VALIDATION_ERROR', 'CNPJ é obrigatório'));
    }

    const existingResult = await findParteContrariaByCNPJ(cnpj);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateParteContraria(existingResult.data.id, input as UpdateParteContrariaInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      return {
        success: true,
        data: { parteContraria: updateResult.data, created: false },
        created: false,
      } as Result<{ parteContraria: ParteContraria; created: boolean }>;
    }

    const createResult = await saveParteContraria(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    return {
      success: true,
      data: { parteContraria: createResult.data, created: true },
      created: true,
    } as Result<{ parteContraria: ParteContraria; created: boolean }>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de parte contraria por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Soft delete de parte contraria (marca como inativo)
 */
/**
 * Conta o total de partes contrárias no banco
 */
export async function countPartesContrarias(): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar partes contrárias',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta partes contrárias criadas até uma data específica
 */
export async function countPartesContrariasAteData(dataLimite: Date): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select('*', { count: 'exact', head: true })
      .lte('created_at', dataLimite.toISOString());

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar partes contrárias até data',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta partes contrárias criadas entre duas datas (inclusive)
 */
export async function countPartesContrariasEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString());

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar partes contrárias entre datas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function softDeleteParteContraria(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_PARTES_CONTRARIAS).update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao deletar parte contraria', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Soft delete de múltiplas partes contrárias (marca como inativas)
 */
export async function softDeletePartesContrariasEmMassa(ids: number[]): Promise<Result<number>> {
  try {
    if (ids.length === 0) return ok(0);
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id');

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data?.length ?? 0);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao desativar partes contrárias em massa', undefined, error instanceof Error ? error : undefined)
    );
  }
}
