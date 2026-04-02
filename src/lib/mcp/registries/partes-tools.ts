/**
 * Registro de Ferramentas MCP - Partes
 *
 * Tools disponíveis:
 * - listar_clientes: Lista clientes com filtros
 * - buscar_cliente_por_cpf: Busca cliente por CPF
 * - buscar_cliente_por_cnpj: Busca cliente por CNPJ
 * - listar_partes_contrarias: Lista partes contrárias
 * - listar_terceiros: Lista terceiros
 * - listar_representantes: Lista representantes (advogados)
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Partes
 */
export async function registerPartesTools(): Promise<void> {
  const {
    actionListarClientes,
    actionBuscarClientePorCPF,
    actionBuscarClientePorCNPJ,
    actionListarPartesContrarias,
    actionListarTerceiros,
    actionListarRepresentantes,
  } = await import('@/app/app/partes/server');

  /**
   * Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)
   */
  registerMcpTool({
    name: 'listar_clientes',
    description: 'Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de clientes'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou CPF/CNPJ'),
      tipo_pessoa: z.enum(['pf', 'pj']).optional().describe('Tipo de pessoa (pf=física, pj=jurídica)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarClientes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar clientes');
      }
    },
  });

  /**
   * Busca cliente por CPF com endereço e processos relacionados
   */
  registerMcpTool({
    name: 'buscar_cliente_por_cpf',
    description: 'Busca cliente por CPF com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cpf } = args as { cpf: string };
        const result = await actionBuscarClientePorCPF(cpf);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CPF');
      }
    },
  });

  /**
   * Busca cliente por CNPJ com endereço e processos relacionados
   */
  registerMcpTool({
    name: 'buscar_cliente_por_cnpj',
    description: 'Busca cliente por CNPJ com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cnpj } = args as { cnpj: string };
        const result = await actionBuscarClientePorCNPJ(cnpj);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CNPJ');
      }
    },
  });

  /**
   * Lista partes contrárias cadastradas no sistema
   */
  registerMcpTool({
    name: 'listar_partes_contrarias',
    description: 'Lista partes contrárias cadastradas no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarPartesContrarias({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar partes contrárias');
      }
    },
  });

  /**
   * Lista terceiros cadastrados no sistema
   */
  registerMcpTool({
    name: 'listar_terceiros',
    description: 'Lista terceiros cadastrados no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarTerceiros({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar terceiros');
      }
    },
  });

  /**
   * Lista representantes (advogados, procuradores) do sistema
   */
  registerMcpTool({
    name: 'listar_representantes',
    description: 'Lista representantes (advogados, procuradores) do sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou OAB'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarRepresentantes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar representantes');
      }
    },
  });
}
