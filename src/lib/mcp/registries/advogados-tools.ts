/**
 * Registro de Ferramentas MCP - Advogados
 *
 * Tools disponíveis:
 * - listar_advogados: Lista advogados com filtros
 * - buscar_advogado_por_id: Busca advogado específico
 * - buscar_advogado_por_oab: Busca advogado por OAB e UF
 * - listar_credenciais_advogado: Lista credenciais de um advogado
 * - listar_credenciais_tribunal: Lista credenciais por tribunal
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Advogados
 */
export async function registerAdvogadosTools(): Promise<void> {
  const {
    actionListarAdvogados,
    actionBuscarAdvogado,
  } = await import('@/app/(authenticated)/advogados/actions/advogados-actions');

  const {
    actionListarCredenciais,
  } = await import('@/app/(authenticated)/advogados/actions/credenciais-actions');

  /**
   * Lista advogados cadastrados no sistema com filtros opcionais
   */
  registerMcpTool({
    name: 'listar_advogados',
    description: 'Lista advogados cadastrados no sistema com filtros opcionais',
    feature: 'advogados',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de advogados'),
      busca: z.string().optional().describe('Busca textual por nome'),
      oab: z.string().optional().describe('Número OAB'),
      uf_oab: z.string().length(2).optional().describe('UF da OAB (ex: SP, RJ)'),
      com_credenciais: z.boolean().optional().describe('Incluir credenciais de tribunais'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAdvogados({
          pagina: args.pagina,
          limite: args.limite,
          busca: args.busca,
          oab: args.oab,
          uf_oab: args.uf_oab,
          com_credenciais: args.com_credenciais,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar advogados');
      }
    },
  });

  /**
   * Busca advogado específico por ID
   */
  registerMcpTool({
    name: 'buscar_advogado_por_id',
    description: 'Busca advogado específico por ID',
    feature: 'advogados',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do advogado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarAdvogado(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar advogado');
      }
    },
  });

  /**
   * Busca advogado por número OAB e UF
   */
  registerMcpTool({
    name: 'buscar_advogado_por_oab',
    description: 'Busca advogado por número OAB e UF',
    feature: 'advogados',
    requiresAuth: true,
    schema: z.object({
      oab: z.string().min(1).describe('Número OAB'),
      uf: z.string().length(2).describe('UF da OAB (ex: SP, RJ)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAdvogados({
          oab: args.oab,
          uf_oab: args.uf,
          limite: 1,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar advogado por OAB');
      }
    },
  });

  /**
   * Lista credenciais de tribunais de um advogado específico
   */
  registerMcpTool({
    name: 'listar_credenciais_advogado',
    description: 'Lista credenciais de tribunais de um advogado específico',
    feature: 'advogados',
    requiresAuth: true,
    schema: z.object({
      advogado_id: z.number().int().positive().describe('ID do advogado'),
      active: z.boolean().optional().describe('Filtrar apenas credenciais ativas'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarCredenciais({
          advogado_id: args.advogado_id,
          active: args.active,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar credenciais do advogado');
      }
    },
  });

  /**
   * Lista todas as credenciais disponíveis, opcionalmente filtradas por tribunal e grau
   */
  registerMcpTool({
    name: 'listar_credenciais_tribunal',
    description: 'Lista todas as credenciais disponíveis, opcionalmente filtradas por tribunal e grau',
    feature: 'advogados',
    requiresAuth: true,
    schema: z.object({
      active: z.boolean().optional().describe('Filtrar apenas credenciais ativas'),
      tribunal: z.string().optional().describe('Filtrar por tribunal (ex: TRT15, TRT2)'),
      grau: z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior']).optional().describe('Filtrar por grau (primeiro_grau = 1º Grau, segundo_grau = 2º Grau, tribunal_superior = Tribunal Superior)'),
    }),
    handler: async (args) => {
      try {
        let grauCredencial: '1' | '2' | undefined;
        if (args.grau === 'primeiro_grau') {
          grauCredencial = '1';
        } else if (args.grau === 'segundo_grau') {
          grauCredencial = '2';
        }

        const result = await actionListarCredenciais({
          active: args.active,
          tribunal: args.tribunal,
          grau: grauCredencial,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar credenciais');
      }
    },
  });
}
