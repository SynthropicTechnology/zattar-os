/**
 * CHATWOOT REPOSITORY - Persistência de Mapeamentos Partes-Chatwoot
 *
 * Funções de acesso ao banco de dados para as tabelas:
 * - partes_chatwoot (mapeamento parte local -> contato Chatwoot)
 * - conversas_chatwoot (rastreamento de conversas)
 * - usuarios_chatwoot (mapeamento usuário -> agente Chatwoot)
 */

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import type {
  PartesChatwoot,
  CreatePartesChatwootInput,
  UpdatePartesChatwootInput,
  ListarMapeamentosParams,
  TipoEntidadeChatwoot,
  ConversaChatwoot,
  CreateConversaChatwootInput,
  UpdateConversaChatwootInput,
  ListarConversasParams,
  UsuarioChatwoot,
  CreateUsuarioChatwootInput,
  UpdateUsuarioChatwootInput,
  ListarUsuariosParams,
} from './domain';

const TABLE_PARTES_CHATWOOT = 'partes_chatwoot';
const TABLE_CONVERSAS_CHATWOOT = 'conversas_chatwoot';
const TABLE_USUARIOS_CHATWOOT = 'usuarios_chatwoot';

// =============================================================================
// Buscar por ID
// =============================================================================

/**
 * Busca mapeamento pelo ID
 */
export async function findMapeamentoById(
  id: number
): Promise<Result<PartesChatwoot | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Buscar por Entidade Local
// =============================================================================

/**
 * Busca mapeamento por entidade local (tipo + ID)
 */
export async function findMapeamentoPorEntidade(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<PartesChatwoot | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .select('*')
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar mapeamento por entidade',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Buscar por Contato Chatwoot
// =============================================================================

/**
 * Busca mapeamento por ID do contato no Chatwoot
 */
export async function findMapeamentoPorChatwootId(
  chatwootContactId: number,
  chatwootAccountId?: number
): Promise<Result<PartesChatwoot | null>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_PARTES_CHATWOOT)
      .select('*')
      .eq('chatwoot_contact_id', chatwootContactId);

    if (chatwootAccountId) {
      query = query.eq('chatwoot_account_id', chatwootAccountId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar mapeamento por Chatwoot ID',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Listar Mapeamentos
// =============================================================================

/**
 * Lista mapeamentos com filtros e paginação
 */
export async function listarMapeamentos(
  params: ListarMapeamentosParams = {}
): Promise<Result<PaginatedResponse<PartesChatwoot>>> {
  const {
    limite = 20,
    offset = 0,
    tipo_entidade,
    sincronizado,
    chatwoot_account_id,
  } = params;

  try {
    const db = createDbClient();
    let query = db.from(TABLE_PARTES_CHATWOOT).select('*', { count: 'exact' });

    if (tipo_entidade) {
      query = query.eq('tipo_entidade', tipo_entidade);
    }

    if (sincronizado !== undefined) {
      query = query.eq('sincronizado', sincronizado);
    }

    if (chatwoot_account_id) {
      query = query.eq('chatwoot_account_id', chatwoot_account_id);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const page = Math.floor(offset / limite) + 1;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: (data ?? []) as PartesChatwoot[],
      pagination: {
        page,
        limit: limite,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar mapeamentos',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Criar Mapeamento
// =============================================================================

/**
 * Cria novo mapeamento parte-chatwoot
 */
export async function criarMapeamento(
  input: CreatePartesChatwootInput
): Promise<Result<PartesChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .insert({
        tipo_entidade: input.tipo_entidade,
        entidade_id: input.entidade_id,
        chatwoot_contact_id: input.chatwoot_contact_id,
        chatwoot_account_id: input.chatwoot_account_id,
        dados_sincronizados: input.dados_sincronizados ?? {},
        sincronizado: true,
        ultima_sincronizacao: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Verifica constraint de unicidade
      if (error.code === '23505') {
        return err(
          appError(
            'CONFLICT',
            'Mapeamento já existe para esta entidade ou contato',
            { code: error.code }
          )
        );
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Atualizar Mapeamento
// =============================================================================

/**
 * Atualiza mapeamento existente
 */
export async function atualizarMapeamento(
  id: number,
  input: UpdatePartesChatwootInput
): Promise<Result<PartesChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', 'Mapeamento não encontrado'));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza mapeamento por entidade local
 */
export async function atualizarMapeamentoPorEntidade(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number,
  input: UpdatePartesChatwootInput
): Promise<Result<PartesChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .update(input)
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', 'Mapeamento não encontrado'));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as PartesChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Remover Mapeamento
// =============================================================================

/**
 * Remove mapeamento pelo ID
 */
export async function removerMapeamento(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .delete()
      .eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove mapeamento por entidade local
 */
export async function removerMapeamentoPorEntidade(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PARTES_CHATWOOT)
      .delete()
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove mapeamento por contato Chatwoot
 */
export async function removerMapeamentoPorChatwootId(
  chatwootContactId: number,
  chatwootAccountId?: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_PARTES_CHATWOOT)
      .delete()
      .eq('chatwoot_contact_id', chatwootContactId);

    if (chatwootAccountId) {
      query = query.eq('chatwoot_account_id', chatwootAccountId);
    }

    const { error } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover mapeamento',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Contagem
// =============================================================================

/**
 * Conta mapeamentos com filtros
 */
export async function contarMapeamentos(
  params: Omit<ListarMapeamentosParams, 'limite' | 'offset'> = {}
): Promise<Result<number>> {
  const { tipo_entidade, sincronizado, chatwoot_account_id } = params;

  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_PARTES_CHATWOOT)
      .select('id', { count: 'exact', head: true });

    if (tipo_entidade) {
      query = query.eq('tipo_entidade', tipo_entidade);
    }

    if (sincronizado !== undefined) {
      query = query.eq('sincronizado', sincronizado);
    }

    if (chatwoot_account_id) {
      query = query.eq('chatwoot_account_id', chatwoot_account_id);
    }

    const { count, error } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(count ?? 0);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao contar mapeamentos',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Upsert
// =============================================================================

/**
 * Cria ou atualiza mapeamento por entidade local
 */
export async function upsertMapeamentoPorEntidade(
  input: CreatePartesChatwootInput
): Promise<Result<{ mapeamento: PartesChatwoot; criado: boolean }>> {
  // Primeiro, verifica se já existe
  const existente = await findMapeamentoPorEntidade(
    input.tipo_entidade,
    input.entidade_id
  );

  if (!existente.success) {
    return existente;
  }

  // Se existe, atualiza
  if (existente.data) {
    const atualizado = await atualizarMapeamento(existente.data.id, {
      ultima_sincronizacao: new Date().toISOString(),
      dados_sincronizados: input.dados_sincronizados,
      sincronizado: true,
      erro_sincronizacao: null,
    });

    if (!atualizado.success) {
      return atualizado;
    }

    return ok({ mapeamento: atualizado.data, criado: false });
  }

  // Se não existe, cria
  const criado = await criarMapeamento(input);

  if (!criado.success) {
    return criado;
  }

  return ok({ mapeamento: criado.data, criado: true });
}

// =============================================================================
// CONVERSAS CHATWOOT - Buscar
// =============================================================================

/**
 * Busca conversa pelo ID
 */
export async function findConversaById(
  id: bigint
): Promise<Result<ConversaChatwoot | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_CONVERSAS_CHATWOOT)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as ConversaChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca conversa por ID Chatwoot
 */
export async function findConversaPorChatwootId(
  chatwootConversationId: bigint,
  chatwootAccountId?: bigint
): Promise<Result<ConversaChatwoot | null>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_CONVERSAS_CHATWOOT)
      .select('*')
      .eq('chatwoot_conversation_id', chatwootConversationId);

    if (chatwootAccountId) {
      query = query.eq('chatwoot_account_id', chatwootAccountId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as ConversaChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar conversa por Chatwoot ID',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista conversas com filtros e paginação
 */
export async function listarConversas(
  params: ListarConversasParams = {}
): Promise<Result<PaginatedResponse<ConversaChatwoot>>> {
  const {
    limite = 20,
    offset = 0,
    status,
    sincronizado,
    chatwoot_account_id,
    mapeamento_partes_chatwoot_id,
  } = params;

  try {
    const db = createDbClient();
    let query = db.from(TABLE_CONVERSAS_CHATWOOT).select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (sincronizado !== undefined) {
      query = query.eq('sincronizado', sincronizado);
    }

    if (chatwoot_account_id) {
      query = query.eq('chatwoot_account_id', chatwoot_account_id);
    }

    if (mapeamento_partes_chatwoot_id) {
      query = query.eq('mapeamento_partes_chatwoot_id', mapeamento_partes_chatwoot_id);
    }

    query = query
      .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
      .range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const page = Math.floor(offset / limite) + 1;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: (data ?? []) as ConversaChatwoot[],
      pagination: {
        page,
        limit: limite,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar conversas',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Cria nova conversa
 */
export async function criarConversa(
  input: CreateConversaChatwootInput
): Promise<Result<ConversaChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_CONVERSAS_CHATWOOT)
      .insert({
        chatwoot_conversation_id: input.chatwoot_conversation_id,
        chatwoot_account_id: input.chatwoot_account_id,
        chatwoot_inbox_id: input.chatwoot_inbox_id,
        mapeamento_partes_chatwoot_id: input.mapeamento_partes_chatwoot_id,
        status: input.status ?? 'open',
        dados_sincronizados: input.dados_sincronizados ?? {},
        sincronizado: true,
        ultima_sincronizacao: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(
          appError(
            'CONFLICT',
            'Conversa já existe para este ID Chatwoot',
            { code: error.code }
          )
        );
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as ConversaChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza conversa existente
 */
export async function atualizarConversa(
  id: bigint,
  input: UpdateConversaChatwootInput
): Promise<Result<ConversaChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_CONVERSAS_CHATWOOT)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', 'Conversa não encontrada'));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as ConversaChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove conversa
 */
export async function removerConversa(id: bigint): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_CONVERSAS_CHATWOOT)
      .delete()
      .eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover conversa',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// USUARIOS CHATWOOT - Buscar
// =============================================================================

/**
 * Busca usuário pelo ID
 */
export async function findUsuarioById(
  id: bigint
): Promise<Result<UsuarioChatwoot | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar usuário',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca usuário por UUID local
 */
export async function findUsuarioPorUUID(
  usuarioId: string
): Promise<Result<UsuarioChatwoot | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar usuário por UUID',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca usuário por ID Chatwoot
 */
export async function findUsuarioPorChatwootId(
  chatwootAgentId: bigint,
  chatwootAccountId?: bigint
): Promise<Result<UsuarioChatwoot | null>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_USUARIOS_CHATWOOT)
      .select('*')
      .eq('chatwoot_agent_id', chatwootAgentId);

    if (chatwootAccountId) {
      query = query.eq('chatwoot_account_id', chatwootAccountId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar usuário por Chatwoot ID',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista usuários com filtros e paginação
 */
export async function listarUsuarios(
  params: ListarUsuariosParams = {}
): Promise<Result<PaginatedResponse<UsuarioChatwoot>>> {
  const {
    limite = 20,
    offset = 0,
    role,
    disponivel,
    chatwoot_account_id,
    sincronizado,
  } = params;

  try {
    const db = createDbClient();
    let query = db.from(TABLE_USUARIOS_CHATWOOT).select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (disponivel !== undefined) {
      query = query.eq('disponivel', disponivel);
    }

    if (chatwoot_account_id) {
      query = query.eq('chatwoot_account_id', chatwoot_account_id);
    }

    if (sincronizado !== undefined) {
      query = query.eq('sincronizado', sincronizado);
    }

    query = query
      .order('nome_chatwoot', { ascending: true })
      .range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const total = count ?? 0;
    const page = Math.floor(offset / limite) + 1;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: (data ?? []) as UsuarioChatwoot[],
      pagination: {
        page,
        limit: limite,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar usuários',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Cria novo usuário
 */
export async function criarUsuario(
  input: CreateUsuarioChatwootInput
): Promise<Result<UsuarioChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .insert({
        usuario_id: input.usuario_id,
        chatwoot_agent_id: input.chatwoot_agent_id,
        chatwoot_account_id: input.chatwoot_account_id,
        role: input.role ?? 'agent',
        skills: input.skills,
        email: input.email,
        nome_chatwoot: input.nome_chatwoot,
        max_conversas_simultaneas: input.max_conversas_simultaneas ?? 10,
        dados_sincronizados: input.dados_sincronizados ?? {},
        sincronizado: true,
        ultima_sincronizacao: new Date().toISOString(),
        disponivel: true,
        contador_conversas_ativas: 0n,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(
          appError(
            'CONFLICT',
            'Usuário já existe para este UUID ou Chatwoot ID',
            { code: error.code }
          )
        );
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar usuário',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza usuário existente
 */
export async function atualizarUsuario(
  id: bigint,
  input: UpdateUsuarioChatwootInput
): Promise<Result<UsuarioChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', 'Usuário não encontrado'));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar usuário',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza usuário por UUID local
 */
export async function atualizarUsuarioPorUUID(
  usuarioId: string,
  input: UpdateUsuarioChatwootInput
): Promise<Result<UsuarioChatwoot>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .update(input)
      .eq('usuario_id', usuarioId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err(appError('NOT_FOUND', 'Usuário não encontrado'));
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(data as UsuarioChatwoot);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar usuário',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca agentes disponíveis (para smart assignment)
 */
export async function listarAgentesDisponíveis(
  chatwootAccountId: bigint,
  params: { skills?: string[]; limite?: number } = {}
): Promise<Result<UsuarioChatwoot[]>> {
  const { skills, limite = 10 } = params;

  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_USUARIOS_CHATWOOT)
      .select('*')
      .eq('chatwoot_account_id', chatwootAccountId)
      .eq('disponivel', true)
      .eq('sincronizado', true);

    // Filtrar por skills (opcional)
    if (skills && skills.length > 0) {
      query = query.contains('skills', skills);
    }

    const { data, error } = await query
      .order('contador_conversas_ativas', { ascending: true })
      .limit(limite);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok((data ?? []) as UsuarioChatwoot[]);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar agentes disponíveis',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove usuário
 */
export async function removerUsuario(id: bigint): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_USUARIOS_CHATWOOT)
      .delete()
      .eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover usuário',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
