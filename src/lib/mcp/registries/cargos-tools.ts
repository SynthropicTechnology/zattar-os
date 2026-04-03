/**
 * Registro de Ferramentas MCP - Cargos
 *
 * Tools disponíveis:
 * - listar_cargos: Lista cargos disponíveis
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Cargos
 */
export async function registerCargosTools(): Promise<void> {
  const {
    actionListarCargos,
  } = await import('@/app/(authenticated)/cargos/actions/cargos-actions');

  /**
   * Lista cargos disponíveis no sistema
   */
  registerMcpTool({
    name: 'listar_cargos',
    description: 'Lista cargos disponíveis no sistema',
    feature: 'cargos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de cargos'),
      busca: z.string().optional().describe('Busca textual por nome do cargo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarCargos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar cargos');
      }
    },
  });
}
