/**
 * Sistema de Prompts MCP do Synthropic
 *
 * Prompts são templates pré-configurados que geram mensagens
 * para uso com LLMs, incluindo contexto relevante do sistema.
 */

import { type ZodSchema } from "zod";

// =============================================================================
// TIPOS
// =============================================================================

export interface MCPPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MCPPromptConfig {
  name: string;
  description: string;
  arguments: ZodSchema;
  handler: (args: unknown) => Promise<MCPPromptResult>;
}

export interface MCPPromptResult {
  messages: MCPPromptMessage[];
  description?: string;
}

export interface MCPPromptListItem {
  name: string;
  description: string;
  arguments?: Record<string, unknown>;
}

// =============================================================================
// REGISTRY
// =============================================================================

const prompts = new Map<string, MCPPromptConfig>();

/**
 * Registra um prompt no sistema
 */
export function registerMcpPrompt(config: MCPPromptConfig): void {
  prompts.set(config.name, config);
  console.log(`[MCP Prompts] Registrado: ${config.name}`);
}

/**
 * Lista todos os prompts registrados
 */
export function listMcpPrompts(): MCPPromptListItem[] {
  return Array.from(prompts.values()).map((p) => ({
    name: p.name,
    description: p.description,
  }));
}

/**
 * Busca um prompt por nome
 */
export function getMcpPromptConfig(name: string): MCPPromptConfig | undefined {
  return prompts.get(name);
}

/**
 * Executa um prompt com argumentos
 */
export async function getMcpPrompt(
  name: string,
  args: unknown
): Promise<MCPPromptResult> {
  const prompt = prompts.get(name);

  if (!prompt) {
    throw new Error(`Prompt não encontrado: ${name}`);
  }

  // Validar argumentos
  const validated = prompt.arguments.parse(args);

  // Executar handler
  return prompt.handler(validated);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Cria um resultado de prompt simples
 */
export function createPromptResult(
  systemPrompt: string,
  userPrompt: string,
  description?: string
): MCPPromptResult {
  return {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    description,
  };
}

/**
 * Cria um resultado de prompt com múltiplas mensagens
 */
export function createMultiMessagePromptResult(
  messages: MCPPromptMessage[],
  description?: string
): MCPPromptResult {
  return {
    messages,
    description,
  };
}
