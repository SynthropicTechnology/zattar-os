/**
 * Domain - System Prompts
 * Entidades, schemas e regras de negócio para prompts de IA
 */

import { z } from "zod";

// =============================================================================
// CATEGORIAS DE PROMPT
// =============================================================================

export const CATEGORIAS_PROMPT = {
  plate_ai: "plate_ai",
  copilotkit: "copilotkit",
  copilot: "copilot",
  custom: "custom",
} as const;

export type CategoriaPrompt = keyof typeof CATEGORIAS_PROMPT;

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

export const systemPromptSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(
      /^[a-z0-9_]+$/,
      "Slug deve conter apenas letras minúsculas, números e underscores"
    ),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  categoria: z.enum(["plate_ai", "copilotkit", "copilot", "custom"]),
  conteudo: z
    .string()
    .min(10, "Conteúdo do prompt deve ter no mínimo 10 caracteres"),
  ativo: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const criarSystemPromptSchema = systemPromptSchema;

export const atualizarSystemPromptSchema = systemPromptSchema.partial().extend({
  id: z.string().uuid(),
});

// =============================================================================
// TIPOS TYPESCRIPT
// =============================================================================

export interface SystemPrompt {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  categoria: CategoriaPrompt;
  conteudo: string;
  ativo: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by_auth_id?: string;
  updated_by_auth_id?: string;
}

export type CriarSystemPromptParams = z.infer<typeof criarSystemPromptSchema>;
export type AtualizarSystemPromptParams = z.infer<
  typeof atualizarSystemPromptSchema
>;

// =============================================================================
// CONSTANTES
// =============================================================================

export const LABELS_CATEGORIA: Record<CategoriaPrompt, string> = {
  plate_ai: "Editor de Documentos (IA)",
  copilotkit: "Assistente Pedrinho",
  copilot: "Copilot (Autocompletar)",
  custom: "Personalizado",
};

export const DESCRICOES_CATEGORIA: Record<CategoriaPrompt, string> = {
  plate_ai:
    "Prompts usados pelo editor de documentos para geração, edição e revisão jurídica",
  copilotkit:
    "Prompt de personalidade do assistente Pedrinho no chat lateral",
  copilot:
    "Prompt para sugestões inline de autocompletar texto no editor",
  custom: "Prompts personalizados criados pelo usuário",
};

/**
 * Slugs dos prompts built-in (não podem ser deletados)
 */
export const BUILT_IN_SLUGS = new Set([
  "plate_juridico_context",
  "plate_choose_tool",
  "plate_comment",
  "plate_generate",
  "plate_edit",
  "copilotkit_pedrinho",
  "copilot_inline",
]);
