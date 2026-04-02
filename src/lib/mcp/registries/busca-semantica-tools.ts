/**
 * Registro de Ferramentas MCP - Busca Semântica
 *
 * Tools disponíveis:
 * - buscar_semantica: Busca semântica com IA (RAG)
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Busca Semântica
 */
export async function registerBuscaSemanticaTools(): Promise<void> {
  const {
    actionBuscarConhecimento,
  } = await import('@/lib/ai/actions/search-actions');

  /**
   * Realiza busca semântica com IA em documentos, processos e conhecimento do escritório
   */
  registerMcpTool({
    name: 'buscar_semantica',
    description: 'Realiza busca semântica com IA em documentos, processos e conhecimento do escritório',
    feature: 'busca',
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe('Pergunta ou termo de busca'),
      limite: z.number().min(1).max(20).default(5).describe('Número máximo de resultados'),
      contextos: z.array(z.string()).optional().describe('Tipos de entidade para filtrar (ex: processo, documento)'),
    }),
    handler: async (args) => {
      try {
        const { query, limite, contextos } = args as { query: string; limite: number; contextos?: string[] };
        const result = await actionBuscarConhecimento(
          query,
          {
            match_count: limite,
            match_threshold: 0.7,
            entity_type: contextos?.[0],
          }
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro na busca semântica');
      }
    },
  });
}
