/**
 * Service - System Prompts
 * Lógica de negócio para prompts de IA
 */

import * as repo from "./repository";
import {
  criarSystemPromptSchema,
  atualizarSystemPromptSchema,
  BUILT_IN_SLUGS,
  type CategoriaPrompt,
  type SystemPrompt,
} from "./domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar todos os prompts
 */
export async function listar(): Promise<SystemPrompt[]> {
  return repo.findAll();
}

/**
 * Listar prompts por categoria
 */
export async function listarPorCategoria(
  categoria: CategoriaPrompt
): Promise<SystemPrompt[]> {
  return repo.findByCategoria(categoria);
}

/**
 * Buscar prompt por slug
 */
export async function buscarPorSlug(
  slug: string
): Promise<SystemPrompt | null> {
  return repo.findBySlug(slug);
}

/**
 * Buscar prompt por ID
 */
export async function buscarPorId(id: string): Promise<SystemPrompt | null> {
  return repo.findById(id);
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar novo prompt
 */
export async function criar(params: unknown): Promise<SystemPrompt> {
  const validacao = criarSystemPromptSchema.safeParse(params);

  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  return repo.create(validacao.data);
}

/**
 * Atualizar prompt
 */
export async function atualizar(params: unknown): Promise<SystemPrompt> {
  const validacao = atualizarSystemPromptSchema.safeParse(params);

  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  const { id, ...updateData } = validacao.data;

  return repo.update(id, updateData);
}

/**
 * Deletar prompt (apenas custom, não built-in)
 */
export async function deletar(id: string): Promise<void> {
  const prompt = await repo.findById(id);

  if (!prompt) {
    throw new Error("Prompt não encontrado");
  }

  if (BUILT_IN_SLUGS.has(prompt.slug)) {
    throw new Error(
      "Não é possível deletar prompts built-in do sistema. Use a opção de restaurar padrão."
    );
  }

  return repo.remove(id);
}

/**
 * Ativar/desativar prompt
 */
export async function toggleAtivo(
  id: string,
  ativo: boolean
): Promise<SystemPrompt> {
  return repo.toggleAtivo(id, ativo);
}
