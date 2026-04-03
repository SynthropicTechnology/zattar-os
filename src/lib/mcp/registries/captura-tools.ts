/**
 * Registro de Ferramentas MCP - Captura
 *
 * Tools disponíveis:
 * - listar_capturas_cnj: Lista capturas do Comunica CNJ
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Captura
 */
export async function registerCapturaTools(): Promise<void> {
  const {
    actionListarComunicacoesCapturadas,
  } = await import('@/app/(authenticated)/captura/actions/comunica-cnj-actions');

  /**
   * Lista capturas do sistema Comunica CNJ
   */
  registerMcpTool({
    name: 'listar_capturas_cnj',
    description: 'Lista capturas do sistema Comunica CNJ',
    feature: 'captura',
    requiresAuth: true,
    schema: z.object({
      page: z.number().min(1).default(1).describe('Página'),
      limit: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      numeroProcesso: z.string().optional().describe('Filtrar por número do processo (CNJ)'),
      siglaTribunal: z.string().optional().describe('Sigla do tribunal (ex: TRT15)'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
      advogadoId: z.number().optional().describe('Filtrar por advogado'),
      expedienteId: z.number().optional().describe('Filtrar por expediente'),
      semExpediente: z.boolean().optional().describe('Apenas comunicações sem expediente vinculado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarComunicacoesCapturadas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar capturas CNJ');
      }
    },
  });
}
