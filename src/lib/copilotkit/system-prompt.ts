/**
 * System Prompt do CopilotKit
 *
 * Define a personalidade e comportamento do assistente "Pedrinho"
 *
 * SYSTEM_PROMPT é o valor estático para uso em client components (ex: layout.tsx).
 * Para server components e API routes que precisam do valor dinâmico do DB,
 * importe getPromptContent de '@/lib/system-prompts/get-prompt' diretamente.
 */

import { DEFAULT_PROMPTS } from "@/lib/system-prompts/defaults";

/**
 * Valor estático do prompt para uso em client components.
 */
export const SYSTEM_PROMPT =
  DEFAULT_PROMPTS.copilotkit_pedrinho.conteudo;

/**
 * Configurações do CopilotKit
 */
export const COPILOTKIT_CONFIG = {
  runtimeUrl: "/api/copilotkit",
  sidebar: {
    defaultOpen: false,
  },
  labels: {
    title: "Pedrinho - Assistente Jurídico",
    placeholder: "Digite sua pergunta...",
    initial: "Olá! Como posso ajudar você hoje?",
  },
};
