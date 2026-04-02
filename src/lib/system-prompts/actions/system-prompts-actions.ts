"use server";

/**
 * Server Actions - System Prompts
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
  criarSystemPromptSchema,
  atualizarSystemPromptSchema,
  BUILT_IN_SLUGS,
} from "../domain";
import { DEFAULT_PROMPTS } from "../defaults";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar todos os prompts
 */
export const actionListarSystemPrompts = authenticatedAction(
  z.void(),
  async () => {
    return service.listar();
  }
);

/**
 * Listar prompts por categoria
 */
export const actionListarPromptsPorCategoria = authenticatedAction(
  z.object({
    categoria: z.enum(["plate_ai", "copilotkit", "copilot", "custom"]),
  }),
  async ({ categoria }) => {
    return service.listarPorCategoria(categoria);
  }
);

/**
 * Buscar prompt por slug
 */
export const actionBuscarPromptPorSlug = authenticatedAction(
  z.object({ slug: z.string() }),
  async ({ slug }) => {
    const data = await service.buscarPorSlug(slug);

    if (!data) {
      throw new Error("Prompt não encontrado");
    }

    return data;
  }
);

/**
 * Buscar prompt por ID
 */
export const actionBuscarPrompt = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }) => {
    const data = await service.buscarPorId(id);

    if (!data) {
      throw new Error("Prompt não encontrado");
    }

    return data;
  }
);

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar novo prompt
 */
export const actionCriarSystemPrompt = authenticatedAction(
  criarSystemPromptSchema,
  async (data) => {
    const result = await service.criar(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Atualizar prompt
 */
export const actionAtualizarSystemPrompt = authenticatedAction(
  atualizarSystemPromptSchema,
  async (data) => {
    const result = await service.atualizar(data);
    revalidatePath("/app/configuracoes");
    return result;
  }
);

/**
 * Deletar prompt
 */
export const actionDeletarSystemPrompt = authenticatedAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }) => {
    await service.deletar(id);
    revalidatePath("/app/configuracoes");
  }
);

/**
 * Ativar/desativar prompt
 */
export const actionToggleAtivoPrompt = authenticatedAction(
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
 * Personalizar prompt built-in: copia o default para o banco para edição
 */
export const actionPersonalizarPromptBuiltIn = authenticatedAction(
  z.object({ slug: z.string() }),
  async ({ slug }) => {
    if (!BUILT_IN_SLUGS.has(slug)) {
      throw new Error("Este slug não é um prompt built-in do sistema.");
    }

    const defaultPrompt = DEFAULT_PROMPTS[slug];
    if (!defaultPrompt) {
      throw new Error(`Nenhum default encontrado para o slug: ${slug}`);
    }

    // Verificar se já existe no banco (evitar duplicata)
    const existing = await service.buscarPorSlug(slug);
    if (existing) {
      return existing;
    }

    const result = await service.criar({
      slug,
      nome: defaultPrompt.nome,
      descricao: defaultPrompt.descricao,
      categoria: defaultPrompt.categoria,
      conteudo: defaultPrompt.conteudo,
      ativo: true,
    });

    revalidatePath("/app/configuracoes");
    return result;
  }
);
