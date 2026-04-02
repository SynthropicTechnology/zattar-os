"use server";

/**
 * Server Actions - Integrações
 *
 * IMPORTANTE: `authenticatedAction` já embala o retorno do handler em
 * `{ success: true, data: <retorno> }`. Os handlers devem retornar
 * apenas os dados brutos, sem wrapper adicional.
 */

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { z } from "zod";
import * as service from "../service";
import {
  criarIntegracaoSchema,
  atualizarIntegracaoSchema,
  twofauthConfigSchema,
  chatwootConfigSchema,
  dyteConfigSchema,
  editorIAConfigSchema,
} from "../domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar todas as integrações
 */
export const actionListarIntegracoes = authenticatedAction(
  z.void(),
  async () => {
    return service.listar();
  }
);

/**
 * Listar integrações por tipo
 */
export const actionListarIntegracoesPorTipo = authenticatedAction(
  z.object({ tipo: z.enum(["twofauth", "zapier", "dify", "webhook", "api", "chatwoot", "dyte", "editor_ia"]) }),
  async ({ tipo }) => {
    return service.listarPorTipo(tipo);
  }
);

/**
 * Buscar integração por ID
 */
export const actionBuscarIntegracao = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }) => {
    const data = await service.buscarPorId(id);

    if (!data) {
      throw new Error("Integração não encontrada");
    }

    return data;
  }
);

/**
 * Buscar configuração do 2FAuth
 */
export const actionBuscarConfig2FAuth = authenticatedAction(
  z.object({}),
  async () => {
    return service.buscarConfig2FAuth();
  }
);

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar nova integração
 */
export const actionCriarIntegracao = authenticatedAction(
  criarIntegracaoSchema,
  async (data) => {
    const result = await service.criar(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar integração
 */
export const actionAtualizarIntegracao = authenticatedAction(
  atualizarIntegracaoSchema,
  async (data) => {
    const result = await service.atualizar(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Deletar integração
 */
export const actionDeletarIntegracao = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }) => {
    await service.deletar(id);
    revalidatePath("/app/configuracoes");
  }
);

/**
 * Ativar/desativar integração
 */
export const actionToggleAtivoIntegracao = authenticatedAction(
  z.object({
    id: z.string().uuid(),
    ativo: z.boolean(),
  }),
  async ({ id, ativo }) => {
    const result = await service.toggleAtivo(id, ativo);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar configuração do 2FAuth
 */
export const actionAtualizarConfig2FAuth = authenticatedAction(
  twofauthConfigSchema,
  async (data) => {
    const result = await service.atualizarConfig2FAuth(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar configuração do Chatwoot
 */
export const actionAtualizarConfigChatwoot = authenticatedAction(
  chatwootConfigSchema,
  async (data) => {
    const result = await service.atualizarConfigChatwoot(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar configuração do Dyte
 */
export const actionAtualizarConfigDyte = authenticatedAction(
  dyteConfigSchema,
  async (data) => {
    const result = await service.atualizarConfigDyte(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar configuração do Editor de Texto IA
 */
export const actionAtualizarConfigEditorIA = authenticatedAction(
  editorIAConfigSchema,
  async (data) => {
    const { invalidateEditorIAConfigCache } = await import("@/lib/ai-editor/config");
    const result = await service.atualizarConfigEditorIA(data);
    invalidateEditorIAConfigCache();
    revalidatePath("/app/configuracoes");
    return result;
  }
);
