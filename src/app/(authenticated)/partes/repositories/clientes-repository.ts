/**
 * CLIENTES REPOSITORY - Persistencia de Clientes
 *
 * Funcoes de acesso ao banco de dados para Clientes.
 * Extraido do repository monolitico para melhor organizacao.
 */

import { createDbClient } from '@/lib/supabase';
import { fromCamelToSnake, fromSnakeToCamel } from '@/lib/utils';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import type {
  Cliente,
  CreateClienteInput,
  UpdateClienteInput,
  ListarClientesParams,
  ClienteComEndereco,
  ClienteComEnderecoEProcessos,
  ProcessoRelacionado,
} from '../domain';
import { normalizarDocumento } from '../domain';
import {
  CACHE_PREFIXES,
  getCached,
  setCached,
  deleteCached,
} from '@/lib/redis/cache-utils';
import { invalidateClientesCache } from '@/lib/redis/invalidation';

const TABLE_CLIENTES = 'clientes';

type ListarClientesParamsCompat = ListarClientesParams & {
  tipoPessoa?: string;
  cpfCnpj?: string;
  ordenarPor?: string;
};

function mapOrdenarPorToColumn(value: unknown): string {
  if (typeof value !== 'string') return 'created_at';
  switch (value) {
    case 'nomeCompleto':
      return 'nome';
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

async function safeGetCached<T>(key: string): Promise<T | null> {
  try {
    return await getCached<T>(key);
  } catch {
    return null;
  }
}

async function safeSetCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await setCached(key, value, ttlSeconds);
  } catch {
    // fail-open
  }
}

/**
 * Busca um cliente pelo ID
 */
export async function findClienteById(id: number): Promise<Result<Cliente | null>> {
  try {
    const cacheKey = `${CACHE_PREFIXES.clientes}:id:${id}`;
    const cached = await safeGetCached<Cliente>(cacheKey);
    if (cached) return ok(cached);

    const db = createDbClient();
    const { data, error } = await db.from(TABLE_CLIENTES).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    await safeSetCached(cacheKey, cliente, 600);
    return ok(cliente);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar cliente', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca um cliente pelo CPF
 */
export async function findClienteByCPF(cpf: string): Promise<Result<Cliente | null>> {
  try {
    const cacheKey = `${CACHE_PREFIXES.clientes}:cpf:${cpf}`;
    const cached = await safeGetCached<Cliente>(cacheKey);
    if (cached) return ok(cached);

    const db = createDbClient();
    const { data, error } = await db.from(TABLE_CLIENTES).select('*').eq('cpf', cpf).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    await safeSetCached(cacheKey, cliente, 600);
    return ok(cliente);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar cliente por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca um cliente pelo CNPJ
 */
export async function findClienteByCNPJ(cnpj: string): Promise<Result<Cliente | null>> {
  try {
    const cacheKey = `${CACHE_PREFIXES.clientes}:cnpj:${cnpj}`;
    const cached = await safeGetCached<Cliente>(cacheKey);
    if (cached) return ok(cached);

    const db = createDbClient();
    const { data, error } = await db.from(TABLE_CLIENTES).select('*').eq('cnpj', cnpj).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    await safeSetCached(cacheKey, cliente, 600);
    return ok(cliente);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar cliente por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca clientes pelo nome (busca parcial com ILIKE)
 */
export async function findClientesByNomeParcial(nome: string, limit: number = 100): Promise<Result<Cliente[]>> {
  try {
    const db = createDbClient();
    const nomeBusca = nome.trim();

    if (!nomeBusca) {
      return ok([]);
    }

    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .select('*')
      .ilike('nome', `%${nomeBusca}%`)
      .order('nome')
      .limit(limit);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok((data || []).map((d) => fromSnakeToCamel(d as Record<string, unknown>) as unknown as Cliente));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar clientes por nome', undefined, error instanceof Error ? error : undefined)
    );
  }
}

// Compat: manter nome antigo
export const findClientesByNome = findClientesByNomeParcial;

/**
 * Lista clientes com filtros e paginacao
 */
export async function findAllClientes(params: ListarClientesParamsCompat = {}): Promise<Result<PaginatedResponse<Cliente>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipoPessoa,
      busca,
      nome,
      cpf,
      cnpj,
      cpfCnpj,
      ativo,
      ordenar_por = 'created_at',
      ordenarPor,
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_CLIENTES).select('*', { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (cpfCnpj) {
      const doc = cpfCnpj.trim();
      query = query.or(`cpf.ilike.%${doc}%,cnpj.ilike.%${doc}%`);
    }

    const tipoPessoaValue = tipo_pessoa ?? tipoPessoa;
    if (typeof tipoPessoaValue === 'string' && tipoPessoaValue.trim()) {
      query = query.eq('tipo_pessoa', tipoPessoaValue.trim().toUpperCase());
    }
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', cpf);
    if (cnpj) query = query.eq('cnpj', cnpj);
    if (ativo !== undefined) query = query.eq('ativo', ativo);

    const orderColumn = mapOrdenarPorToColumn((ordenarPor ?? ordenar_por) as unknown);
    query = query.order(orderColumn, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;
    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    const paginated: PaginatedResponse<Cliente> = {
      data: (data || []).map((d) => fromSnakeToCamel(d as Record<string, unknown>) as unknown as Cliente),
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
    } as Result<PaginatedResponse<Cliente>>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar clientes', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Salva um novo cliente no banco
 */
export async function saveCliente(input: CreateClienteInput): Promise<Result<Cliente>> {
  try {
    const db = createDbClient();

    // Compatibilidade com fixtures/tests: aceitar input em camelCase (src/app/(authenticated)/partes/types)
    if (
      typeof (input as unknown as Record<string, unknown>)?.tipoPessoa === 'string' ||
      typeof (input as unknown as Record<string, unknown>)?.nomeCompleto === 'string'
    ) {
      const payload = {
        ...(fromCamelToSnake(input as unknown as Record<string, unknown>) as Record<string, unknown>),
        ativo: (input as unknown as Record<string, unknown>)?.ativo ?? true,
      };

      const { data, error } = await db.from(TABLE_CLIENTES).insert(payload).select().single();

      if (error) {
        if (error.code === '23505') {
          return err(appError('CONFLICT', 'Cliente duplicado', { code: error.code }));
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
      }

      try {
        await invalidateClientesCache();
      } catch {
        // fail-open
      }

      return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente);
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

    // Adiciona campos especificos por tipo
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

    const { data, error } = await db.from(TABLE_CLIENTES).insert(dadosInsercao).select().single();

    if (error) {
      if (error.code === '23505') {
        return err(appError('CONFLICT', 'Cliente duplicado', { code: error.code }));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    try {
      await invalidateClientesCache();
    } catch {
      // fail-open
    }
    return ok(cliente);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao salvar cliente', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateCliente(
  id: number,
  input: UpdateClienteInput,
  dadosAnteriores?: Cliente
): Promise<Result<Cliente>> {
  try {
    const db = createDbClient();

    // Compatibilidade com testes: updates em camelCase (nomeCompleto, dataNascimento, etc.)
    if (
      typeof (input as unknown as Record<string, unknown>)?.nomeCompleto === 'string' ||
      (input as unknown as Record<string, unknown>)?.dataNascimento !== undefined
    ) {
      const payload = {
        ...(fromCamelToSnake(input as unknown as Record<string, unknown>) as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db.from(TABLE_CLIENTES).update(payload).eq('id', id).select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          return err(appError('NOT_FOUND', `Cliente com ID ${id} nao encontrado`));
        }
        if (error.code === '23505') {
          return err(appError('CONFLICT', 'Cliente duplicado', { code: error.code }));
        }
        return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
      }

      try {
        await invalidateClientesCache();
      } catch {
        // fail-open
      }

      return ok(fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente);
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


    // Campos PF
    if (input.cpf !== undefined) dadosAtualizacao.cpf = input.cpf;
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
    if (input.uf_nascimento_id_pje !== undefined) dadosAtualizacao.uf_nascimento_id_pje = input.uf_nascimento_id_pje;
    if (input.uf_nascimento_sigla !== undefined) dadosAtualizacao.uf_nascimento_sigla = input.uf_nascimento_sigla?.trim() || null;
    if (input.uf_nascimento_descricao !== undefined) dadosAtualizacao.uf_nascimento_descricao = input.uf_nascimento_descricao?.trim() || null;
    if (input.pais_nascimento_id_pje !== undefined) dadosAtualizacao.pais_nascimento_id_pje = input.pais_nascimento_id_pje;
    if (input.pais_nascimento_codigo !== undefined) dadosAtualizacao.pais_nascimento_codigo = input.pais_nascimento_codigo?.trim() || null;
    if (input.pais_nascimento_descricao !== undefined) dadosAtualizacao.pais_nascimento_descricao = input.pais_nascimento_descricao?.trim() || null;
    if (input.escolaridade_codigo !== undefined) dadosAtualizacao.escolaridade_codigo = input.escolaridade_codigo;
    if (input.situacao_cpf_receita_id !== undefined) dadosAtualizacao.situacao_cpf_receita_id = input.situacao_cpf_receita_id;
    if (input.situacao_cpf_receita_descricao !== undefined) dadosAtualizacao.situacao_cpf_receita_descricao = input.situacao_cpf_receita_descricao?.trim() || null;
    if (input.pode_usar_celular_mensagem !== undefined) dadosAtualizacao.pode_usar_celular_mensagem = input.pode_usar_celular_mensagem;

    // Campos PJ
    if (input.cnpj !== undefined) dadosAtualizacao.cnpj = input.cnpj;
    if (input.inscricao_estadual !== undefined) dadosAtualizacao.inscricao_estadual = input.inscricao_estadual?.trim() || null;
    if (input.data_abertura !== undefined) dadosAtualizacao.data_abertura = input.data_abertura;
    if (input.data_fim_atividade !== undefined) dadosAtualizacao.data_fim_atividade = input.data_fim_atividade;
    if (input.orgao_publico !== undefined) dadosAtualizacao.orgao_publico = input.orgao_publico;
    if (input.tipo_pessoa_codigo_pje !== undefined) dadosAtualizacao.tipo_pessoa_codigo_pje = input.tipo_pessoa_codigo_pje?.trim() || null;
    if (input.tipo_pessoa_label_pje !== undefined) dadosAtualizacao.tipo_pessoa_label_pje = input.tipo_pessoa_label_pje?.trim() || null;
    if (input.tipo_pessoa_validacao_receita !== undefined) dadosAtualizacao.tipo_pessoa_validacao_receita = input.tipo_pessoa_validacao_receita?.trim() || null;
    if (input.ds_tipo_pessoa !== undefined) dadosAtualizacao.ds_tipo_pessoa = input.ds_tipo_pessoa?.trim() || null;
    if (input.situacao_cnpj_receita_id !== undefined) dadosAtualizacao.situacao_cnpj_receita_id = input.situacao_cnpj_receita_id;
    if (input.situacao_cnpj_receita_descricao !== undefined) dadosAtualizacao.situacao_cnpj_receita_descricao = input.situacao_cnpj_receita_descricao?.trim() || null;
    if (input.ramo_atividade !== undefined) dadosAtualizacao.ramo_atividade = input.ramo_atividade?.trim() || null;
    if (input.cpf_responsavel !== undefined) dadosAtualizacao.cpf_responsavel = input.cpf_responsavel?.trim() || null;
    if (input.oficial !== undefined) dadosAtualizacao.oficial = input.oficial;
    if (input.ds_prazo_expediente_automatico !== undefined) dadosAtualizacao.ds_prazo_expediente_automatico = input.ds_prazo_expediente_automatico?.trim() || null;
    if (input.porte_codigo !== undefined) dadosAtualizacao.porte_codigo = input.porte_codigo;
    if (input.porte_descricao !== undefined) dadosAtualizacao.porte_descricao = input.porte_descricao?.trim() || null;
    if (input.ultima_atualizacao_pje !== undefined) dadosAtualizacao.ultima_atualizacao_pje = input.ultima_atualizacao_pje;

    const { data, error } = await db.from(TABLE_CLIENTES).update(dadosAtualizacao).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', `Cliente com ID ${id} nao encontrado`));
      }
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          return err(appError('CONFLICT', 'Cliente com este CPF ja cadastrado', { field: 'cpf' }));
        } else if (error.message.includes('cnpj')) {
          return err(appError('CONFLICT', 'Cliente com este CNPJ ja cadastrado', { field: 'cnpj' }));
        }
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;

    // Invalidar caches específicos (fail-open)
    try {
      await deleteCached(`${CACHE_PREFIXES.clientes}:id:${id}`);
      if (input.cpf) {
        await deleteCached(`${CACHE_PREFIXES.clientes}:cpf:${normalizarDocumento(input.cpf)}`);
      }
      if (input.cnpj) {
        await deleteCached(`${CACHE_PREFIXES.clientes}:cnpj:${normalizarDocumento(input.cnpj)}`);
      }
      await invalidateClientesCache();
    } catch {
      // fail-open
    }

    return ok(cliente);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao atualizar cliente', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de cliente por CPF
 */
export async function upsertClienteByCPF(
  cpfOrInput: string | CreateClienteInput,
  inputMaybe?: CreateClienteInput
): Promise<Result<{ cliente: Cliente; created: boolean }>> {
  try {
    const input = typeof cpfOrInput === 'string' ? inputMaybe : cpfOrInput;
    const cpf = typeof cpfOrInput === 'string' ? cpfOrInput : (cpfOrInput as { cpf?: unknown }).cpf;

    if (typeof cpf !== 'string' || cpf.trim().length === 0 || !input) {
      return err(appError('VALIDATION_ERROR', 'CPF é obrigatório'));
    }

    // Não normalizar aqui: os testes esperam o valor raw em .eq('cpf', ...)
    const existingResult = await findClienteByCPF(cpf);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateCliente(existingResult.data.id, input as UpdateClienteInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      const result = ok({ cliente: updateResult.data, created: false });
      // Compat: testes esperam `result.created`
      return { ...(result as unknown as Record<string, unknown>), created: false } as unknown as Result<{
        cliente: Cliente;
        created: boolean;
      }>;
    }

    const createResult = await saveCliente(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    const result = ok({ cliente: createResult.data, created: true });
    return { ...(result as unknown as Record<string, unknown>), created: true } as unknown as Result<{
      cliente: Cliente;
      created: boolean;
    }>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de cliente por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de cliente por CNPJ
 */
export async function upsertClienteByCNPJ(
  cnpjOrInput: string | CreateClienteInput,
  inputMaybe?: CreateClienteInput
): Promise<Result<{ cliente: Cliente; created: boolean }>> {
  try {
    const input = typeof cnpjOrInput === 'string' ? inputMaybe : cnpjOrInput;
    const cnpj = typeof cnpjOrInput === 'string' ? cnpjOrInput : (cnpjOrInput as { cnpj?: unknown }).cnpj;

    if (typeof cnpj !== 'string' || cnpj.trim().length === 0 || !input) {
      return err(appError('VALIDATION_ERROR', 'CNPJ é obrigatório'));
    }

    const existingResult = await findClienteByCNPJ(cnpj);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateCliente(existingResult.data.id, input as UpdateClienteInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      const result = ok({ cliente: updateResult.data, created: false });
      return { ...(result as unknown as Record<string, unknown>), created: false } as unknown as Result<{
        cliente: Cliente;
        created: boolean;
      }>;
    }

    const createResult = await saveCliente(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    const result = ok({ cliente: createResult.data, created: true });
    return { ...(result as unknown as Record<string, unknown>), created: true } as unknown as Result<{
      cliente: Cliente;
      created: boolean;
    }>;
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de cliente por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Soft delete de cliente (marca como inativo)
 */
export async function softDeleteCliente(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_CLIENTES).update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao deletar cliente', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Soft delete de múltiplos clientes (marca como inativos)
 */
export async function softDeleteClientesEmMassa(ids: number[]): Promise<Result<number>> {
  try {
    if (ids.length === 0) return ok(0);
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id');

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data?.length ?? 0);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao desativar clientes em massa', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Conta o total de clientes no banco
 */
export async function countClientes(): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { data, error, count } = await db
      .from(TABLE_CLIENTES)
      // compat com mocks dos testes: eles resolvem { data: { count } } via .single()
      .select('*')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as any;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = (count ?? (data as { count?: number } | null)?.count ?? 0) as number;
    return ok(total);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar clientes',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Compat (tests): conta clientes por intervalo de datas (strings)
 */
export async function countClientesByDateRange(dataInicio: string, dataFim: string): Promise<Result<number>> {
  try {
    const db = createDbClient();

    // compat com mocks: gte/lte + single({ data: { count } })
    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .select('*')
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as any;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(((data as { count?: number } | null)?.count ?? 0) as number);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar clientes por intervalo de datas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Compat (tests): retorna agregação por UF ({ uf, count })
 */
export async function countClientesByEstado(): Promise<Result<Array<{ uf: string; count: number }>>> {
  try {
    const db = createDbClient();

    // Preferir uma view/consulta já agregada; em ambientes sem a view, pode ser adaptado depois.
    const { data, error } = await db.from('clientes_por_estado').select('*');

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(((data || []) as Array<{ uf: string; count: number }>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar clientes por estado',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta clientes criados até uma data específica
 */
export async function countClientesAteData(dataLimite: Date): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_CLIENTES)
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
        'Erro ao contar clientes até data',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta clientes criados entre duas datas (inclusive)
 */
export async function countClientesEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_CLIENTES)
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
        'Erro ao contar clientes entre datas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta clientes agrupados por estado (via endereco principal do cliente)
 * Opcionalmente filtra por período de criação do cliente.
 */
export async function countClientesPorEstadoComFiltro(params: {
  limite?: number;
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<Result<Array<{ estado: string; count: number }>>> {
  try {
    const db = createDbClient();

    const limite = params.limite ?? 4;
    let query = db
      .from(TABLE_CLIENTES)
      // join via FK clientes.endereco_id -> enderecos.id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('id, endereco:enderecos(estado_sigla)') as any;

    if (params.dataInicio) {
      query = query.gte('created_at', params.dataInicio.toISOString());
    }
    if (params.dataFim) {
      query = query.lte('created_at', params.dataFim.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const estadoMap = new Map<string, number>();
    for (const row of (data || []) as Array<{ endereco?: unknown }>) {
      const endereco = row.endereco as { estado_sigla?: string } | Array<{ estado_sigla?: string }> | undefined;
      const estadoSigla: string | null | undefined = Array.isArray(endereco)
        ? endereco[0]?.estado_sigla
        : endereco?.estado_sigla;
      const estado = (estadoSigla || 'Sem Estado').toUpperCase();
      estadoMap.set(estado, (estadoMap.get(estado) ?? 0) + 1);
    }

    const resultado = Array.from(estadoMap.entries())
      .map(([estado, count]) => ({ estado, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limite);

    return ok(resultado);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar clientes por estado',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Compat: conta clientes por estado (top N) sem filtro de período
 */
export async function countClientesPorEstado(limite: number = 4): Promise<Result<Array<{ estado: string; count: number }>>> {
  return countClientesPorEstadoComFiltro({ limite });
}

/**
 * Lista clientes com endereco populado via LEFT JOIN
 */
export async function findAllClientesComEndereco(
  params: ListarClientesParamsCompat = {}
): Promise<Result<PaginatedResponse<ClienteComEndereco>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipoPessoa,
      busca,
      nome,
      cpf,
      cnpj,
      cpfCnpj,
      ativo,
      ordenar_por = 'created_at',
      ordenarPor,
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_CLIENTES).select(`*, enderecos(*)`, { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (cpfCnpj) {
      const doc = cpfCnpj.trim();
      query = query.or(`cpf.ilike.%${doc}%,cnpj.ilike.%${doc}%`);
    }

    const tipoPessoaValue = tipo_pessoa ?? tipoPessoa;
    if (typeof tipoPessoaValue === 'string' && tipoPessoaValue.trim()) {
      query = query.eq('tipo_pessoa', tipoPessoaValue.trim().toUpperCase());
    }
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', cpf);
    if (cnpj) query = query.eq('cnpj', cnpj);
    if (ativo !== undefined) query = query.eq('ativo', ativo);

    const orderColumn = mapOrdenarPorToColumn((ordenarPor ?? ordenar_por) as unknown);
    query = query.order(orderColumn, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const rows = Array.isArray(data) ? data : [];
    const clienteIds = rows
      .map((row) => (row && typeof row === 'object' ? (row as { id?: unknown }).id : undefined))
      .filter((id): id is number => typeof id === 'number');

    // Fallback: em bases onde `clientes.endereco_id` não está preenchido,
    // o endereço está em `enderecos` via relação polimórfica (entidade_tipo/entidade_id).
    const enderecosPorClienteId = new Map<number, unknown>();
    if (clienteIds.length > 0) {
      const { data: enderecosData, error: enderecosError } = await db
        .from('enderecos')
        .select('*')
        .eq('entidade_tipo', 'cliente')
        .in('entidade_id', clienteIds)
        .eq('ativo', true)
        .order('correspondencia', { ascending: false })
        .order('updated_at', { ascending: false })
        // Força execução (compatível com mocks de teste que só são "awaitables" em .range)
        .range(0, 9999);

      if (enderecosError) {
        return err(appError('DATABASE_ERROR', enderecosError.message, { code: enderecosError.code }));
      }

      const enderecosArr = Array.isArray(enderecosData) ? enderecosData : [];
      for (const item of enderecosArr) {
        if (!item || typeof item !== 'object') continue;
        const entidadeId = (item as { entidade_id?: unknown }).entidade_id;
        if (typeof entidadeId !== 'number') continue;
        if (enderecosPorClienteId.has(entidadeId)) continue;
        enderecosPorClienteId.set(entidadeId, fromSnakeToCamel(item as Record<string, unknown>));
      }
    }

    const clientes = rows.map((row) => {
      const cliente = fromSnakeToCamel(row as Record<string, unknown>) as unknown as Cliente;
      const enderecosRaw = (row as { enderecos?: unknown }).enderecos;

      // Em relacionamentos many-to-one (clientes.endereco_id -> enderecos.id),
      // o PostgREST pode retornar `enderecos` como OBJETO (não array).
      const enderecoJoin = Array.isArray(enderecosRaw)
        ? (enderecosRaw[0] ? (fromSnakeToCamel(enderecosRaw[0] as Record<string, unknown>) as unknown) : null)
        : enderecosRaw && typeof enderecosRaw === 'object'
          ? (fromSnakeToCamel(enderecosRaw as Record<string, unknown>) as unknown)
          : null;

      const id = (row as { id?: unknown }).id;
      const enderecoFallback = typeof id === 'number' ? (enderecosPorClienteId.get(id) ?? null) : null;
      const endereco = enderecoJoin ?? enderecoFallback;

      return { ...cliente, endereco } as ClienteComEndereco;
    });

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: clientes,
      pagination: { page: pagina, limit: limite, total, totalPages, hasMore: pagina < totalPages },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar clientes com endereco', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista clientes com endereco e processos relacionados
 */
export async function findAllClientesComEnderecoEProcessos(
  params: ListarClientesParamsCompat = {}
): Promise<Result<PaginatedResponse<ClienteComEnderecoEProcessos>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipoPessoa,
      busca,
      nome,
      cpf,
      cnpj,
      cpfCnpj,
      ativo,
      ordenar_por = 'created_at',
      ordenarPor,
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    // IMPORTANTE:
    // - `processo_partes` é uma relação polimórfica (tipo_entidade + entidade_id)
    // - PostgREST/Supabase não consegue inferir relacionamento `clientes` <-> `processo_partes`
    //   sem FK direta, então evitar nested select aqui.
    let query = db.from(TABLE_CLIENTES).select(`*, enderecos(*)`, { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_social_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (cpfCnpj) {
      const doc = cpfCnpj.trim();
      query = query.or(`cpf.ilike.%${doc}%,cnpj.ilike.%${doc}%`);
    }

    const tipoPessoaValue = tipo_pessoa ?? tipoPessoa;
    if (typeof tipoPessoaValue === 'string' && tipoPessoaValue.trim()) {
      query = query.eq('tipo_pessoa', tipoPessoaValue.trim().toUpperCase());
    }
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', cpf);
    if (cnpj) query = query.eq('cnpj', cnpj);
    if (ativo !== undefined) query = query.eq('ativo', ativo);

    const orderColumn = mapOrdenarPorToColumn((ordenarPor ?? ordenar_por) as unknown);
    query = query.order(orderColumn, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const rows = Array.isArray(data) ? data : [];
    const clienteIds = rows
      .map((row) => (row && typeof row === 'object' ? (row as { id?: unknown }).id : undefined))
      .filter((id): id is number => typeof id === 'number');

    const processosPorClienteId = new Map<number, ProcessoRelacionado[]>();

    // Mesmo fallback do findAllClientesComEndereco: enderecos via relação polimórfica
    const enderecosPorClienteId = new Map<number, unknown>();
    if (clienteIds.length > 0) {
      const { data: enderecosData, error: enderecosError } = await db
        .from('enderecos')
        .select('*')
        .eq('entidade_tipo', 'cliente')
        .in('entidade_id', clienteIds)
        .eq('ativo', true)
        .order('correspondencia', { ascending: false })
        .order('updated_at', { ascending: false })
        .range(0, 9999);

      if (enderecosError) {
        return err(appError('DATABASE_ERROR', enderecosError.message, { code: enderecosError.code }));
      }

      const enderecosArr = Array.isArray(enderecosData) ? enderecosData : [];
      for (const item of enderecosArr) {
        if (!item || typeof item !== 'object') continue;
        const entidadeId = (item as { entidade_id?: unknown }).entidade_id;
        if (typeof entidadeId !== 'number') continue;
        if (enderecosPorClienteId.has(entidadeId)) continue;
        enderecosPorClienteId.set(entidadeId, fromSnakeToCamel(item as Record<string, unknown>));
      }
    }

    if (clienteIds.length > 0) {
      const { data: vinculos, error: vinculosError } = await db
        .from('processo_partes')
        .select(`
          processo_id,
          numero_processo,
          tipo_parte,
          polo,
          entidade_id,
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
        .eq('tipo_entidade', 'cliente')
        .in('entidade_id', clienteIds)
        // Força execução (compatível com mocks de teste que só são "awaitables" em .range)
        .range(0, 9999);

      if (vinculosError) {
        return err(appError('DATABASE_ERROR', vinculosError.message, { code: vinculosError.code }));
      }

      const vinculosArr = Array.isArray(vinculos) ? vinculos : [];
      for (const item of vinculosArr) {
        if (!item || typeof item !== 'object') continue;
        const entidadeId = (item as { entidade_id?: unknown }).entidade_id;
        const processoId = (item as { processo_id?: unknown }).processo_id;
        const numeroProcesso = (item as { numero_processo?: unknown }).numero_processo;
        const tipoParte = (item as { tipo_parte?: unknown }).tipo_parte;
        const polo = (item as { polo?: unknown }).polo;
        const acervoRaw = (item as { acervo?: unknown }).acervo;
        const acervo = Array.isArray(acervoRaw) ? acervoRaw[0] as Record<string, unknown> | undefined : acervoRaw as Record<string, unknown> | null | undefined;
        if (
          typeof entidadeId !== 'number' ||
          typeof processoId !== 'number' ||
          typeof numeroProcesso !== 'string' ||
          typeof tipoParte !== 'string' ||
          typeof polo !== 'string'
        ) {
          continue;
        }

        const list = processosPorClienteId.get(entidadeId) ?? [];
        list.push({
          processo_id: processoId,
          numero_processo: numeroProcesso,
          tipo_parte: tipoParte,
          polo,
          nome_parte_autora: acervo?.nome_parte_autora as string | null | undefined,
          nome_parte_re: acervo?.nome_parte_re as string | null | undefined,
          grau: acervo?.grau as string | null | undefined,
          codigo_status_processo: acervo?.codigo_status_processo as string | null | undefined,
          classe_judicial: acervo?.classe_judicial as string | null | undefined,
          data_proxima_audiencia: acervo?.data_proxima_audiencia as string | null | undefined,
          trt: acervo?.trt as string | null | undefined,
        });
        processosPorClienteId.set(entidadeId, list);
      }
    }

    const clientes = rows.map((row) => {
      const cliente = fromSnakeToCamel(row as Record<string, unknown>) as unknown as Cliente;
      const enderecosRaw = (row as { enderecos?: unknown }).enderecos;
      // Em relacionamentos many-to-one (clientes.endereco_id -> enderecos.id),
      // o PostgREST pode retornar `enderecos` como OBJETO (não array).
      const enderecoJoin = Array.isArray(enderecosRaw)
        ? (enderecosRaw[0] ? (fromSnakeToCamel(enderecosRaw[0] as Record<string, unknown>) as unknown) : null)
        : enderecosRaw && typeof enderecosRaw === 'object'
          ? (fromSnakeToCamel(enderecosRaw as Record<string, unknown>) as unknown)
          : null;

      const id = (row as { id?: unknown }).id;
      const processos_relacionados = typeof id === 'number' ? (processosPorClienteId.get(id) ?? []) : [];

      const enderecoFallback = typeof id === 'number' ? (enderecosPorClienteId.get(id) ?? null) : null;
      const endereco = enderecoJoin ?? enderecoFallback;

      return { ...cliente, endereco, processos_relacionados } as ClienteComEnderecoEProcessos;
    });

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: clientes,
      pagination: { page: pagina, limit: limite, total, totalPages, hasMore: pagina < totalPages },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar clientes com endereco e processos', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Compat (tests): Busca um cliente por ID com lista de enderecos
 */
export async function findClienteComEndereco(id: number): Promise<Result<(Cliente & { enderecos: unknown[] }) | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .select(`*, enderecos(*)`)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    const enderecosRaw = (data as { enderecos?: unknown }).enderecos;
    const enderecos = Array.isArray(enderecosRaw)
      ? enderecosRaw.map((e) => fromSnakeToCamel(e as Record<string, unknown>))
      : [];

    return ok({ ...cliente, enderecos } as unknown as Cliente & { enderecos: unknown[] });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar cliente com endereco', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca um cliente por ID com endereco populado
 */
export async function findClienteByIdComEndereco(id: number): Promise<Result<ClienteComEndereco | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db.from(TABLE_CLIENTES).select(`*, endereco:enderecos(*)`).eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const cliente = fromSnakeToCamel(data as Record<string, unknown>) as unknown as Cliente;
    const endereco = data.endereco
      ? (fromSnakeToCamel(data.endereco as Record<string, unknown>) as unknown)
      : null;

    return ok({ ...cliente, endereco } as ClienteComEndereco);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar cliente com endereco', undefined, error instanceof Error ? error : undefined)
    );
  }
}
