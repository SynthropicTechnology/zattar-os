"use server";

/**
 * NOTIFICAÇÕES ACTIONS - Server Actions
 *
 * Server Actions para gerenciamento de notificações.
 * Usa authenticatedAction para garantir autenticação.
 */

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { invalidateNotificacoesCache } from "@/lib/redis/invalidation";
import * as service from "../service";
import type { ListarNotificacoesParams } from "../domain";
import { listarNotificacoesSchema } from "../domain";
import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

const idSchema = z.object({
  id: z.number().int().positive("ID deve ser um número positivo"),
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Lista notificações do usuário autenticado
 */
export const actionListarNotificacoes = authenticatedAction(
  listarNotificacoesSchema,
  async (input: ListarNotificacoesParams) => {
    const params: ListarNotificacoesParams = {
      ...input,
      pagina: input.pagina ?? 1,
      limite: input.limite ?? 20,
    };

    const result = await service.listarNotificacoes(params);

    if (result.success) {
      // Não revalidar path aqui para evitar re-render desnecessário
      // As notificações são atualizadas via Realtime
    }

    return result;
  }
);

/**
 * Conta notificações não lidas do usuário autenticado
 */
export const actionContarNotificacoesNaoLidas = authenticatedAction(
  z.object({}),
  async () => {
    const result = await service.contarNotificacoesNaoLidas();
    return result;
  }
);

/**
 * Marca notificação como lida
 */
export const actionMarcarNotificacaoComoLida = authenticatedAction(
  idSchema,
  async (input) => {
    const result = await service.marcarNotificacaoComoLida(input.id);

    if (result.success) {
      // Invalidar cache de notificações
      await invalidateNotificacoesCache();
      // Revalidar path do header para atualizar contador
      revalidatePath("/app", "layout");
    }

    return result;
  }
);

/**
 * Marca todas as notificações do usuário como lidas
 */
export const actionMarcarTodasComoLidas = authenticatedAction(
  z.object({}),
  async () => {
    const result = await service.marcarTodasComoLidas();

    if (result.success) {
      // Invalidar cache de notificações
      await invalidateNotificacoesCache();
      // Revalidar path do header para atualizar contador
      revalidatePath("/app", "layout");
    }

    return result;
  }
);

