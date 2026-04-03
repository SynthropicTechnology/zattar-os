/**
 * Registro de Ferramentas MCP - Dashboard
 *
 * Tools disponíveis:
 * - obter_metricas_escritorio: Métricas gerais
 * - obter_dashboard_usuario: Dashboard personalizado
 */

import { z } from "zod";
import { registerMcpTool } from "../server";
import { actionResultToMcp } from "../utils";
import { errorResult } from "../types";
import type { ActionResult } from "@/lib/safe-action";

/**
 * Registra ferramentas MCP do módulo Dashboard
 */
export async function registerDashboardTools(): Promise<void> {
  const { actionObterMetricas } = await import(
    "@/app/(authenticated)/dashboard/actions/metricas-actions"
  );

  const { actionObterDashboard } = await import(
    "@/app/(authenticated)/dashboard/actions/dashboard-actions"
  );

  /**
   * Obtém métricas gerais do escritório (processos, receitas, despesas)
   */
  registerMcpTool({
    name: "obter_metricas_escritorio",
    description:
      "Obtém métricas gerais do escritório (processos, receitas, despesas)",
    feature: "dashboard",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionObterMetricas();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao obter métricas do escritório"
        );
      }
    },
  });

  /**
   * Obtém dashboard personalizado do usuário autenticado
   */
  registerMcpTool({
    name: "obter_dashboard_usuario",
    description: "Obtém dashboard personalizado do usuário autenticado",
    feature: "dashboard",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionObterDashboard();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao obter dashboard do usuário"
        );
      }
    },
  });
}
