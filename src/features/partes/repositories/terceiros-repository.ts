/**
 * TERCEIROS REPOSITORY - Persistencia de Terceiros
 *
 * Funcoes de acesso ao banco de dados para Terceiros.
 * Extraido do repository monolitico para melhor organizacao.
 */

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import type {
  Terceiro,
  CreateTerceiroInput,
  UpdateTerceiroInput,
  ListarTerceirosParams,
  TerceiroComEnderecoEProcessos,
  ProcessoRelacionado,
} from '../domain';
import { normalizarDocumento } from '../domain';
import { converterParaTerceiro } from './shared/converters';

const TABLE_TERCEIROS = 'terceiros';

/**
 * Busca um terceiro pelo ID
 */
export async function findTerceiroById(id: number): Promise<Result<Terceiro | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_TERCEIROS).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaTerceiro(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar terceiro', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca um terceiro pelo CPF
 */
export async function findTerceiroByCPF(cpf: string): Promise<Result<Terceiro | null>> {
  try {
    const db = createDbClient();
    const cpfNormalizado = normalizarDocumento(cpf);

    const { data, error } = await db.from(TABLE_TERCEIROS).select('*').eq('cpf', cpfNormalizado).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    return ok(converterParaTerceiro(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar terceiro por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Busca um terceiro pelo CNPJ
 */
export async function findTerceiroByCNPJ(cnpj: string): Promise<Result<Terceiro | null>> {
  try {
    const db = createDbClient();
    const cnpjNormalizado = normalizarDocumento(cnpj);

    const { data, error } = await db.from(TABLE_TERCEIROS).select('*').eq('cnpj', cnpjNormalizado).maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    if (!data) {
      return ok(null);
    }

    return ok(converterParaTerceiro(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao buscar terceiro por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista terceiros com filtros e paginacao
 */
export async function findAllTerceiros(params: ListarTerceirosParams = {}): Promise<Result<PaginatedResponse<Terceiro>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipo_parte,
      polo,
      busca,
      nome,
      cpf,
      cnpj,
      ordenar_por = 'created_at',
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_TERCEIROS).select('*', { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (tipo_pessoa) query = query.eq('tipo_pessoa', tipo_pessoa);
    if (tipo_parte) query = query.eq('tipo_parte', tipo_parte);
    if (polo) query = query.eq('polo', polo);
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', normalizarDocumento(cpf));
    if (cnpj) query = query.eq('cnpj', normalizarDocumento(cnpj));

    query = query.order(ordenar_por, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: (data || []).map((d) => converterParaTerceiro(d as Record<string, unknown>)),
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar terceiros', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Lista terceiros com endereco e processos relacionados
 */
export async function findAllTerceirosComEnderecoEProcessos(
  params: ListarTerceirosParams = {}
): Promise<Result<PaginatedResponse<TerceiroComEnderecoEProcessos>>> {
  try {
    const db = createDbClient();
    const {
      pagina = 1,
      limite = 50,
      tipo_pessoa,
      tipo_parte,
      polo,
      situacao,
      busca,
      nome,
      cpf,
      cnpj,
      ordenar_por = 'created_at',
      ordem = 'desc',
    } = params;

    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_TERCEIROS).select(`*, endereco:enderecos(*)`, { count: 'exact' });

    if (busca) {
      const buscaTrimmed = busca.trim();
      query = query.or(
        `nome.ilike.%${buscaTrimmed}%,nome_fantasia.ilike.%${buscaTrimmed}%,cpf.ilike.%${buscaTrimmed}%,cnpj.ilike.%${buscaTrimmed}%`
      );
    }

    if (tipo_pessoa) query = query.eq('tipo_pessoa', tipo_pessoa);
    if (tipo_parte) query = query.eq('tipo_parte', tipo_parte);
    if (polo) query = query.eq('polo', polo);
    if (situacao) query = query.eq('situacao', situacao);
    if (nome) query = query.ilike('nome', `%${nome}%`);
    if (cpf) query = query.eq('cpf', normalizarDocumento(cpf));
    if (cnpj) query = query.eq('cnpj', normalizarDocumento(cnpj));

    query = query.order(ordenar_por, { ascending: ordem === 'asc' }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    // Extrair IDs dos terceiros para buscar processos
    const terceiroIds = (data || []).map((row) => row.id as number);
    const processosMap: Map<number, ProcessoRelacionado[]> = new Map();

    if (terceiroIds.length > 0) {
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
        .eq('tipo_entidade', 'terceiro')
        .in('entidade_id', terceiroIds);

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

    const terceirosComProcessos = (data || []).map((row) => {
      const terceiro = converterParaTerceiro(row as Record<string, unknown>);
      const endereco = row.endereco as Record<string, unknown> | null;

      return {
        ...terceiro,
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
            }
          : null,
        processos_relacionados: processosMap.get(terceiro.id) || [],
      } as TerceiroComEnderecoEProcessos;
    });

    return ok({
      data: terceirosComProcessos,
      pagination: { page: pagina, limit: limite, total, totalPages, hasMore: pagina < totalPages },
    });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao listar terceiros com endereco e processos', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Salva um novo terceiro no banco
 */
export async function saveTerceiro(input: CreateTerceiroInput): Promise<Result<Terceiro>> {
  try {
    const db = createDbClient();

    const dadosInsercao: Record<string, unknown> = {
      tipo_parte: input.tipo_parte,
      polo: input.polo,
      tipo_pessoa: input.tipo_pessoa,
      nome: input.nome.trim(),
      nome_fantasia: input.nome_fantasia?.trim() || null,
      emails: input.emails ?? null,
      ddd_celular: input.ddd_celular?.trim() || null,
      numero_celular: input.numero_celular?.trim() || null,
      ddd_residencial: input.ddd_residencial?.trim() || null,
      numero_residencial: input.numero_residencial?.trim() || null,
      ddd_comercial: input.ddd_comercial?.trim() || null,
      numero_comercial: input.numero_comercial?.trim() || null,
      principal: input.principal ?? null,
      autoridade: input.autoridade ?? null,
      endereco_desconhecido: input.endereco_desconhecido ?? null,
      status_pje: input.status_pje?.trim() || null,
      situacao_pje: input.situacao_pje?.trim() || null,
      login_pje: input.login_pje?.trim() || null,
      ordem: input.ordem ?? null,
      observacoes: input.observacoes?.trim() || null,
      dados_anteriores: null,
      ativo: input.ativo ?? true,
      endereco_id: input.endereco_id ?? null,
    };

    if (input.tipo_pessoa === 'pf') {
      dadosInsercao.cpf = normalizarDocumento(input.cpf);
      // Sanitizar tipo_documento: banco aceita apenas 'CPF' ou 'CNPJ' (CHECK constraint)
      const tipoDoc = input.tipo_documento?.trim() || null;
      dadosInsercao.tipo_documento = tipoDoc === 'CPF' || tipoDoc === 'CNPJ' ? tipoDoc : null;
      dadosInsercao.rg = input.rg?.trim() || null;
      dadosInsercao.sexo = input.sexo?.trim() || null;
      dadosInsercao.nome_genitora = input.nome_genitora?.trim() || null;
      dadosInsercao.data_nascimento = input.data_nascimento || null;
      dadosInsercao.genero = input.genero?.trim() || null;
      dadosInsercao.estado_civil = input.estado_civil?.trim() || null;
      dadosInsercao.nacionalidade = input.nacionalidade?.trim() || null;
      dadosInsercao.uf_nascimento_id_pje = input.uf_nascimento_id_pje ?? null;
      dadosInsercao.uf_nascimento_sigla = input.uf_nascimento_sigla?.trim() || null;
      dadosInsercao.uf_nascimento_descricao = input.uf_nascimento_descricao?.trim() || null;
      dadosInsercao.naturalidade_id_pje = input.naturalidade_id_pje ?? null;
      dadosInsercao.naturalidade_municipio = input.naturalidade_municipio?.trim() || null;
      dadosInsercao.naturalidade_estado_id_pje = input.naturalidade_estado_id_pje ?? null;
      dadosInsercao.naturalidade_estado_sigla = input.naturalidade_estado_sigla?.trim() || null;
      dadosInsercao.pais_nascimento_id_pje = input.pais_nascimento_id_pje ?? null;
      dadosInsercao.pais_nascimento_codigo = input.pais_nascimento_codigo?.trim() || null;
      dadosInsercao.pais_nascimento_descricao = input.pais_nascimento_descricao?.trim() || null;
      dadosInsercao.escolaridade_codigo = input.escolaridade_codigo ?? null;
      dadosInsercao.situacao_cpf_receita_id = input.situacao_cpf_receita_id ?? null;
      dadosInsercao.situacao_cpf_receita_descricao = input.situacao_cpf_receita_descricao?.trim() || null;
      dadosInsercao.pode_usar_celular_mensagem = input.pode_usar_celular_mensagem ?? null;
    } else {
      dadosInsercao.cnpj = normalizarDocumento(input.cnpj);
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
    }

    const { data, error } = await db.from(TABLE_TERCEIROS).insert(dadosInsercao).select().single();

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          return err(appError('CONFLICT', 'Terceiro com este CPF ja cadastrado', { field: 'cpf' }));
        } else if (error.message.includes('cnpj')) {
          return err(appError('CONFLICT', 'Terceiro com este CNPJ ja cadastrado', { field: 'cnpj' }));
        }
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaTerceiro(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao salvar terceiro', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Atualiza um terceiro existente
 */
export async function updateTerceiro(
  id: number,
  input: UpdateTerceiroInput,
  dadosAnteriores?: Terceiro
): Promise<Result<Terceiro>> {
  try {
    const db = createDbClient();

    const dadosAtualizacao: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dadosAnteriores) {
      dadosAtualizacao.dados_anteriores = dadosAnteriores;
    }

    // Campos base terceiro
    if (input.tipo_parte !== undefined) dadosAtualizacao.tipo_parte = input.tipo_parte;
    if (input.polo !== undefined) dadosAtualizacao.polo = input.polo;
    if (input.nome !== undefined) dadosAtualizacao.nome = input.nome.trim();
    if (input.nome_fantasia !== undefined) dadosAtualizacao.nome_fantasia = input.nome_fantasia?.trim() || null;
    if (input.emails !== undefined) dadosAtualizacao.emails = input.emails;
    if (input.ddd_celular !== undefined) dadosAtualizacao.ddd_celular = input.ddd_celular?.trim() || null;
    if (input.numero_celular !== undefined) dadosAtualizacao.numero_celular = input.numero_celular?.trim() || null;
    if (input.ddd_residencial !== undefined) dadosAtualizacao.ddd_residencial = input.ddd_residencial?.trim() || null;
    if (input.numero_residencial !== undefined) dadosAtualizacao.numero_residencial = input.numero_residencial?.trim() || null;
    if (input.ddd_comercial !== undefined) dadosAtualizacao.ddd_comercial = input.ddd_comercial?.trim() || null;
    if (input.numero_comercial !== undefined) dadosAtualizacao.numero_comercial = input.numero_comercial?.trim() || null;
    if (input.principal !== undefined) dadosAtualizacao.principal = input.principal;
    if (input.autoridade !== undefined) dadosAtualizacao.autoridade = input.autoridade;
    if (input.endereco_desconhecido !== undefined) dadosAtualizacao.endereco_desconhecido = input.endereco_desconhecido;
    if (input.status_pje !== undefined) dadosAtualizacao.status_pje = input.status_pje?.trim() || null;
    if (input.situacao_pje !== undefined) dadosAtualizacao.situacao_pje = input.situacao_pje?.trim() || null;
    if (input.login_pje !== undefined) dadosAtualizacao.login_pje = input.login_pje?.trim() || null;
    if (input.ordem !== undefined) dadosAtualizacao.ordem = input.ordem;
    if (input.observacoes !== undefined) dadosAtualizacao.observacoes = input.observacoes?.trim() || null;
    if (input.ativo !== undefined) dadosAtualizacao.ativo = input.ativo;
    if (input.endereco_id !== undefined) dadosAtualizacao.endereco_id = input.endereco_id;
    if (input.cpf !== undefined) dadosAtualizacao.cpf = normalizarDocumento(input.cpf);
    if (input.cnpj !== undefined) dadosAtualizacao.cnpj = normalizarDocumento(input.cnpj);

    // Campos PF
    if (input.tipo_documento !== undefined) {
      const tipoDoc = input.tipo_documento?.trim() || null;
      dadosAtualizacao.tipo_documento = tipoDoc === 'CPF' || tipoDoc === 'CNPJ' ? tipoDoc : null;
    }
    if (input.rg !== undefined) dadosAtualizacao.rg = input.rg?.trim() || null;
    if (input.sexo !== undefined) dadosAtualizacao.sexo = input.sexo?.trim() || null;
    if (input.nome_genitora !== undefined) dadosAtualizacao.nome_genitora = input.nome_genitora?.trim() || null;
    if (input.data_nascimento !== undefined) dadosAtualizacao.data_nascimento = input.data_nascimento;
    if (input.genero !== undefined) dadosAtualizacao.genero = input.genero?.trim() || null;
    if (input.estado_civil !== undefined) dadosAtualizacao.estado_civil = input.estado_civil?.trim() || null;
    if (input.nacionalidade !== undefined) dadosAtualizacao.nacionalidade = input.nacionalidade?.trim() || null;

    // Campos PJ
    if (input.inscricao_estadual !== undefined) dadosAtualizacao.inscricao_estadual = input.inscricao_estadual?.trim() || null;
    if (input.data_abertura !== undefined) dadosAtualizacao.data_abertura = input.data_abertura;
    if (input.data_fim_atividade !== undefined) dadosAtualizacao.data_fim_atividade = input.data_fim_atividade;
    if (input.orgao_publico !== undefined) dadosAtualizacao.orgao_publico = input.orgao_publico;

    const { data, error } = await db.from(TABLE_TERCEIROS).update(dadosAtualizacao).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', `Terceiro com ID ${id} nao encontrado`));
      }
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          return err(appError('CONFLICT', 'Terceiro com este CPF ja cadastrado', { field: 'cpf' }));
        } else if (error.message.includes('cnpj')) {
          return err(appError('CONFLICT', 'Terceiro com este CNPJ ja cadastrado', { field: 'cnpj' }));
        }
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaTerceiro(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao atualizar terceiro', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de terceiro por CPF
 */
export async function upsertTerceiroByCPF(
  cpf: string,
  input: CreateTerceiroInput
): Promise<Result<{ terceiro: Terceiro; created: boolean }>> {
  try {
    const cpfNormalizado = normalizarDocumento(cpf);
    const existingResult = await findTerceiroByCPF(cpfNormalizado);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateTerceiro(existingResult.data.id, input as UpdateTerceiroInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      return ok({ terceiro: updateResult.data, created: false });
    }

    const createResult = await saveTerceiro(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    return ok({ terceiro: createResult.data, created: true });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de terceiro por CPF', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Upsert de terceiro por CNPJ
 */
export async function upsertTerceiroByCNPJ(
  cnpj: string,
  input: CreateTerceiroInput
): Promise<Result<{ terceiro: Terceiro; created: boolean }>> {
  try {
    const cnpjNormalizado = normalizarDocumento(cnpj);
    const existingResult = await findTerceiroByCNPJ(cnpjNormalizado);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    if (existingResult.data) {
      const updateResult = await updateTerceiro(existingResult.data.id, input as UpdateTerceiroInput, existingResult.data);
      if (!updateResult.success) {
        return err(updateResult.error);
      }
      return ok({ terceiro: updateResult.data, created: false });
    }

    const createResult = await saveTerceiro(input);
    if (!createResult.success) {
      return err(createResult.error);
    }
    return ok({ terceiro: createResult.data, created: true });
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao fazer upsert de terceiro por CNPJ', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Soft delete de terceiro (marca como inativo)
 */
export async function softDeleteTerceiro(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_TERCEIROS).update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao deletar terceiro', undefined, error instanceof Error ? error : undefined)
    );
  }
}

/**
 * Conta o total de terceiros no banco
 */
export async function countTerceiros(): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_TERCEIROS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar terceiros',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Conta terceiros criados entre duas datas (inclusive)
 */
export async function countTerceirosEntreDatas(dataInicio: Date, dataFim: Date): Promise<Result<number>> {
  try {
    const db = createDbClient();
    const { count, error } = await db
      .from(TABLE_TERCEIROS)
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
        'Erro ao contar terceiros entre datas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Soft delete de múltiplos terceiros (marca como inativos)
 */
export async function softDeleteTerceirosEmMassa(ids: number[]): Promise<Result<number>> {
  try {
    if (ids.length === 0) return ok(0);
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_TERCEIROS)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id');

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data?.length ?? 0);
  } catch (error) {
    return err(
      appError('DATABASE_ERROR', 'Erro ao desativar terceiros em massa', undefined, error instanceof Error ? error : undefined)
    );
  }
}
