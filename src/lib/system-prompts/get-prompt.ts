import "server-only";

/**
 * get-prompt - Utilitário server-only para buscar prompts do DB com fallback
 *
 * Usado pelas rotas de IA e server components para obter o conteúdo
 * de um prompt. Tenta buscar do banco de dados primeiro; se não existir
 * ou estiver inativo, usa o default hardcoded.
 */

import * as repo from "./repository";
import { DEFAULT_PROMPTS } from "./defaults";

/**
 * Busca o conteúdo de um prompt pelo slug.
 * Prioriza o valor do banco de dados (se ativo).
 * Faz fallback para o default hardcoded.
 *
 * @param slug - Slug do prompt (ex: 'plate_generate', 'copilotkit_pedrinho')
 * @returns O conteúdo do prompt
 */
export async function getPromptContent(slug: string): Promise<string> {
  try {
    const prompt = await repo.findBySlug(slug);

    if (prompt && prompt.ativo) {
      return prompt.conteudo;
    }
  } catch (error) {
    console.warn(
      `[SystemPrompts] Falha ao buscar prompt "${slug}" do DB, usando default`,
      error
    );
  }

  // Fallback para default hardcoded
  const defaultPrompt = DEFAULT_PROMPTS[slug];

  if (!defaultPrompt) {
    console.warn(
      `[SystemPrompts] Nenhum default encontrado para slug: ${slug}`
    );
    return "";
  }

  return defaultPrompt.conteudo;
}
