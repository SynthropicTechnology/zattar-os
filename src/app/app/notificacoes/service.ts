"use server";

/**
 * NOTIFICAÇÕES SERVICE - Camada de Regras de Negócio (Casos de Uso)
 *
 * Este arquivo contém a lógica de negócio para Notificações.
 *
 * CONVENÇÕES:
 * - Funções nomeadas como ações: listar, buscar, marcarComoLida
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError } from "@/types";
import { withCache, generateCacheKey, CACHE_PREFIXES } from '@/lib/redis/cache-utils';
import { createClient } from '@/lib/supabase/server';
import type {
  Notificacao,
  ListarNotificacoesParams,
  NotificacoesPaginadas,
  ContadorNotificacoes,
} from "./domain";
import { listarNotificacoesSchema } from "./domain";
import {
  findNotificacaoById,
  listarNotificacoes as listarNotificacoesRepo,
  contarNotificacoesNaoLidas as contarNotificacoesNaoLidasRepo,
  marcarNotificacaoComoLida as marcarNotificacaoComoLidaRepo,
  marcarTodasComoLidas as marcarTodasComoLidasRepo,
} from "./repository";

// =============================================================================
// SERVIÇOS - NOTIFICAÇÕES
// =============================================================================

/**
 * Lista notificações do usuário autenticado
 */
export async function listarNotificacoes(
  params: ListarNotificacoesParams
): Promise<Result<NotificacoesPaginadas>> {
  try {
    // Validar input
    const validation = listarNotificacoesSchema.safeParse(params);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return err(
        appError("VALIDATION_ERROR", firstError.message, {
          field: firstError.path.join("."),
          errors: validation.error.errors,
        })
      );
    }

    const dadosValidados = validation.data;

    // Buscar notificações
    const resultado = await listarNotificacoesRepo(dadosValidados);

    return ok(resultado);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Busca notificação por ID
 */
export async function buscarNotificacaoPorId(
  id: number
): Promise<Result<Notificacao | null>> {
  try {
    if (!id || id <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID deve ser um número positivo", {
          field: "id",
          valor: id,
        })
      );
    }

    const notificacao = await findNotificacaoById(id);

    return ok(notificacao);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Conta notificações não lidas do usuário autenticado
 * Cache é segregado por usuário para evitar contagens erradas entre contas
 */
export async function contarNotificacoesNaoLidas(): Promise<
  Result<ContadorNotificacoes>
> {
  try {
    // Fetch user ID para segregar cache por usuário
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return err(
        appError("UNAUTHORIZED", "Usuário não autenticado", {})
      );
    }
    
    // Buscar ID do usuário na tabela usuarios
    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (usuarioError || !usuarioData) {
      return err(
        appError("DATABASE_ERROR", "Usuário não encontrado", { error: usuarioError })
      );
    }
    
    const usuarioId = usuarioData.id;
    
    // Gerar chave de cache com usuarioId para segregação por usuário
    const cacheKey = generateCacheKey(CACHE_PREFIXES.notificacoes, { 
      action: 'contar_nao_lidas',
      usuarioId
    });
    
    const contador = await withCache(cacheKey, async () => {
      return await contarNotificacoesNaoLidasRepo();
    }, 30); // TTL 30 segundos

    return ok(contador);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Marca notificação como lida
 */
export async function marcarNotificacaoComoLida(
  id: number
): Promise<Result<Notificacao>> {
  try {
    if (!id || id <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID deve ser um número positivo", {
          field: "id",
          valor: id,
        })
      );
    }

    const notificacao = await marcarNotificacaoComoLidaRepo(id);

    return ok(notificacao);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function marcarTodasComoLidas(): Promise<Result<number>> {
  try {
    const quantidade = await marcarTodasComoLidasRepo();

    return ok(quantidade);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

