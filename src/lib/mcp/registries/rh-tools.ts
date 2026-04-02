/**
 * Registro de Ferramentas MCP - RH
 *
 * Tools disponíveis:
 * - listar_salarios: Lista salários
 * - listar_folhas_pagamento: Lista folhas de pagamento
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo RH
 */
export async function registerRHTools(): Promise<void> {
  const {
    actionListarSalarios,
  } = await import('@/app/app/rh/actions/salarios-actions');

  const {
    actionListarFolhasPagamento,
  } = await import('@/app/app/rh/actions/folhas-pagamento-actions');

  /**
   * Lista salários de funcionários
   */
  registerMcpTool({
    name: 'listar_salarios',
    description: 'Lista salários de funcionários',
    feature: 'rh',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      funcionarioId: z.number().optional().describe('Filtrar por funcionário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarSalarios(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar salários');
      }
    },
  });

  /**
   * Lista folhas de pagamento
   */
  registerMcpTool({
    name: 'listar_folhas_pagamento',
    description: 'Lista folhas de pagamento',
    feature: 'rh',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      mesAno: z.string().optional().describe('Filtrar por mês/ano (YYYY-MM)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarFolhasPagamento(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar folhas de pagamento');
      }
    },
  });
}
