/**
 * Registro de Ferramentas MCP - Acervo
 *
 * Tools disponíveis:
 * - listar_acervo: Lista processos do acervo
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Acervo
 */
export async function registerAcervoTools(): Promise<void> {
  const {
    actionListarAcervoUnificado,
  } = await import('@/app/app/acervo/actions/acervo-actions');

  /**
   * Lista processos do acervo com filtros
   */
  registerMcpTool({
    name: 'listar_acervo',
    description: 'Lista processos do acervo com filtros',
    feature: 'acervo',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de processos'),
      busca: z.string().optional().describe('Busca textual'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAcervoUnificado({
          pagina: args.pagina,
          limite: args.limite,
          busca: args.busca,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar acervo');
      }
    },
  });
}
