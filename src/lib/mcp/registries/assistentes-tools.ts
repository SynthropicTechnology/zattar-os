/**
 * Registro de Ferramentas MCP - Assistentes
 *
 * Tools disponíveis:
 * - listar_assistentes: Lista assistentes de IA
 */

import { z } from "zod";
import { registerMcpTool } from "../server";
import { actionResultToMcp } from "../utils";
import { errorResult } from "../types";
import type { ActionResult } from "@/lib/safe-action";

/**
 * Registra ferramentas MCP do módulo Assistentes
 */
export async function registerAssistentesTools(): Promise<void> {
  const { actionListarAssistentes } = await import(
    "@/app/(authenticated)/assistentes/feature/actions/assistentes-actions"
  );

  /**
   * Lista assistentes de IA disponíveis no sistema
   */
  registerMcpTool({
    name: "listar_assistentes",
    description: "Lista assistentes de IA disponíveis no sistema",
    feature: "assistentes",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de assistentes"),
      busca: z.string().optional().describe("Busca textual por nome"),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAssistentes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar assistentes"
        );
      }
    },
  });
}
