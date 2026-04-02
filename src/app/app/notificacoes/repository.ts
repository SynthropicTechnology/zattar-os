/**
 * NOTIFICAÇÕES REPOSITORY - Camada de Persistência
 *
 * Este arquivo contém funções de acesso ao banco de dados para Notificações.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 * - NUNCA importar React/Next.js aqui
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Notificacao,
  ListarNotificacoesParams,
  NotificacoesPaginadas,
  ContadorNotificacoes,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_NOTIFICACOES = "notificacoes";
const TABLE_USUARIOS = "usuarios";

// =============================================================================
// CONVERSORES
// =============================================================================

/**
 * Converte dados do banco (snake_case) para entidade Notificacao (camelCase)
 */
function converterParaNotificacao(
  data: Record<string, unknown>
): Notificacao {
  return {
    id: data.id as number,
    usuario_id: data.usuario_id as number,
    tipo: data.tipo as Notificacao["tipo"],
    titulo: data.titulo as string,
    descricao: data.descricao as string,
    entidade_tipo: data.entidade_tipo as Notificacao["entidade_tipo"],
    entidade_id: data.entidade_id as number,
    lida: (data.lida as boolean) ?? false,
    lida_em: (data.lida_em as string) || null,
    dados_adicionais: (data.dados_adicionais as Record<string, unknown>) || {},
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// =============================================================================
// OPERAÇÕES CRUD
// =============================================================================

/**
 * Busca notificação por ID
 */
export async function findNotificacaoById(
  id: number
): Promise<Notificacao | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NOTIFICACOES)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Erro ao buscar notificação: ${error.message}`);
  }

  return data ? converterParaNotificacao(data) : null;
}

/**
 * Lista notificações do usuário autenticado com paginação
 */
export async function listarNotificacoes(
  params: ListarNotificacoesParams
): Promise<NotificacoesPaginadas> {
  const supabase = await createClient();

  // Buscar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar ID do usuário na tabela usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from(TABLE_USUARIOS)
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (usuarioError || !usuarioData) {
    throw new Error("Usuário não encontrado");
  }

  const usuarioId = usuarioData.id;

  // Construir query
  let query = supabase
    .from(TABLE_NOTIFICACOES)
    .select("*", { count: "exact" })
    .eq("usuario_id", usuarioId)
    .order("created_at", { ascending: false });

  // Aplicar filtros
  if (params.lida !== undefined) {
    query = query.eq("lida", params.lida);
  }

  if (params.tipo) {
    query = query.eq("tipo", params.tipo);
  }

  // Aplicar paginação
  const { pagina = 1, limite = 20 } = params;
  const from = (pagina - 1) * limite;
  const to = from + limite - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar notificações: ${error.message}`);
  }

  const notificacoes = (data || []).map(converterParaNotificacao);
  const total = count || 0;
  const total_paginas = Math.ceil(total / limite);

  return {
    notificacoes,
    total,
    pagina,
    limite,
    total_paginas,
  };
}

/**
 * Conta notificações não lidas do usuário autenticado
 */
export async function contarNotificacoesNaoLidas(): Promise<ContadorNotificacoes> {
  const supabase = await createClient();

  // Buscar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar ID do usuário na tabela usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from(TABLE_USUARIOS)
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (usuarioError || !usuarioData) {
    throw new Error("Usuário não encontrado");
  }

  const usuarioId = usuarioData.id;

  // Buscar total de não lidas
  const { count: total, error: totalError } = await supabase
    .from(TABLE_NOTIFICACOES)
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .eq("lida", false);

  if (totalError) {
    throw new Error(`Erro ao contar notificações: ${totalError.message}`);
  }

  // Buscar contagem por tipo
  const { data: porTipoData, error: porTipoError } = await supabase
    .from(TABLE_NOTIFICACOES)
    .select("tipo")
    .eq("usuario_id", usuarioId)
    .eq("lida", false);

  if (porTipoError) {
    throw new Error(
      `Erro ao contar notificações por tipo: ${porTipoError.message}`
    );
  }

  const por_tipo: Record<string, number> = {
    processo_atribuido: 0,
    processo_movimentacao: 0,
    audiencia_atribuida: 0,
    audiencia_alterada: 0,
    expediente_atribuido: 0,
    expediente_alterado: 0,
    prazo_vencendo: 0,
    prazo_vencido: 0,
  };

  (porTipoData || []).forEach((item) => {
    const tipo = item.tipo as keyof typeof por_tipo;
    if (tipo in por_tipo) {
      por_tipo[tipo] = (por_tipo[tipo] || 0) + 1;
    }
  });

  return {
    total: total || 0,
    por_tipo: por_tipo as ContadorNotificacoes["por_tipo"],
  };
}

/**
 * Marca notificação como lida
 */
export async function marcarNotificacaoComoLida(
  id: number
): Promise<Notificacao> {
  const supabase = await createClient();

  // Buscar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar ID do usuário na tabela usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from(TABLE_USUARIOS)
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (usuarioError || !usuarioData) {
    throw new Error("Usuário não encontrado");
  }

  const usuarioId = usuarioData.id;

  // Verificar se a notificação pertence ao usuário
  const notificacao = await findNotificacaoById(id);
  if (!notificacao || notificacao.usuario_id !== usuarioId) {
    throw new Error("Notificação não encontrada ou não pertence ao usuário");
  }

  // Atualizar notificação
  const { data, error } = await supabase
    .from(TABLE_NOTIFICACOES)
    .update({
      lida: true,
      lida_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("usuario_id", usuarioId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
  }

  return converterParaNotificacao(data);
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function marcarTodasComoLidas(): Promise<number> {
  const supabase = await createClient();

  // Buscar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar ID do usuário na tabela usuarios
  const { data: usuarioData, error: usuarioError } = await supabase
    .from(TABLE_USUARIOS)
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (usuarioError || !usuarioData) {
    throw new Error("Usuário não encontrado");
  }

  const usuarioId = usuarioData.id;

  // Atualizar todas as notificações não lidas
  const { data, error } = await supabase
    .from(TABLE_NOTIFICACOES)
    .update({
      lida: true,
      lida_em: new Date().toISOString(),
    })
    .eq("usuario_id", usuarioId)
    .eq("lida", false)
    .select("id");

  if (error) {
    throw new Error(
      `Erro ao marcar todas as notificações como lidas: ${error.message}`
    );
  }

  return data?.length || 0;
}

