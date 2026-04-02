/**
 * Feature: System Prompts
 * Barrel exports
 *
 * IMPORTANT: Only export types, schemas, actions, and components here.
 * DO NOT export service or repository functions to avoid client/server boundary violations.
 */

// Domain - Types and Schemas (safe for client)
export type {
  SystemPrompt,
  CategoriaPrompt,
  CriarSystemPromptParams,
  AtualizarSystemPromptParams,
} from "./domain";

export {
  CATEGORIAS_PROMPT,
  LABELS_CATEGORIA,
  DESCRICOES_CATEGORIA,
  BUILT_IN_SLUGS,
  systemPromptSchema,
  criarSystemPromptSchema,
  atualizarSystemPromptSchema,
} from "./domain";

// Defaults (safe for client - used by "Restaurar Padrão" feature)
export { DEFAULT_PROMPTS } from "./defaults";

// Actions - Server Actions (safe for client)
export {
  actionListarSystemPrompts,
  actionListarPromptsPorCategoria,
  actionBuscarPromptPorSlug,
  actionBuscarPrompt,
  actionCriarSystemPrompt,
  actionAtualizarSystemPrompt,
  actionDeletarSystemPrompt,
  actionToggleAtivoPrompt,
  actionPersonalizarPromptBuiltIn,
} from "./actions/system-prompts-actions";

// Components (safe for client)
export { PromptsIAContent } from "./components/prompts-ia-content";

// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
// Import "get-prompt" directly for fetching prompt content in API routes
