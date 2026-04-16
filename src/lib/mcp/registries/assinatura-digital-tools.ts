/**
 * Registro de Ferramentas MCP - Assinatura Digital
 *
 * Tools disponíveis:
 * - listar_templates_assinatura: Lista templates de assinatura
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Assinatura Digital
 */
export async function registerAssinaturaDigitalTools(): Promise<void> {
  const {
    listarTemplatesAction,
  } = await import('@/shared/assinatura-digital/actions');

  /**
   * Lista templates de assinatura digital disponíveis
   */
  registerMcpTool({
    name: 'listar_templates_assinatura',
    description: 'Lista templates de assinatura digital disponíveis',
    feature: 'assinatura-digital',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de templates'),
      segmento: z.string().optional().describe('Filtrar por segmento'),
    }),
    handler: async (args) => {
      try {
        const result = await listarTemplatesAction({
          segmento_id: args.segmento ? Number(args.segmento) : undefined,
          ativo: true,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates de assinatura');
      }
    },
  });
}
