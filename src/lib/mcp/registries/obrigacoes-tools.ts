/**
 * Registro de Ferramentas MCP - Obrigações/Acordos
 *
 * Tools disponíveis:
 * - listar_acordos: Lista acordos
 * - buscar_acordos_por_cpf: Busca por CPF
 * - buscar_acordos_por_cnpj: Busca por CNPJ
 * - buscar_acordos_por_processo: Busca por número processual
 * - listar_repasses_pendentes: Lista repasses pendentes
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Obrigações
 */
export async function registerObrigacoesTools(): Promise<void> {
  const {
    actionListarAcordos,
    actionBuscarAcordosPorCPF,
    actionBuscarAcordosPorCNPJ,
    actionBuscarAcordosPorNumeroProcesso,
  } = await import('@/app/app/obrigacoes/actions/acordos');

  const {
    actionListarRepassesPendentes,
  } = await import('@/app/app/obrigacoes/actions/repasses');

  /**
   * Lista acordos/condenações do sistema com filtros
   */
  registerMcpTool({
    name: 'listar_acordos',
    description: 'Lista acordos/condenações do sistema com filtros',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de acordos'),
      processoId: z.number().optional().describe('Filtrar por processo'),
      tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']).optional().describe('Tipo de obrigação'),
      direcao: z.enum(['recebimento', 'pagamento']).optional().describe('Direção do pagamento'),
      status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional().describe('Filtrar por status'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
      busca: z.string().optional().describe('Busca textual'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAcordos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar acordos');
      }
    },
  });

  /**
   * Busca acordos vinculados a um cliente por CPF
   */
  registerMcpTool({
    name: 'buscar_acordos_por_cpf',
    description: 'Busca acordos vinculados a um cliente por CPF',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().regex(/^\d{11}$/).describe('CPF do cliente (11 dígitos, apenas números)'),
      tipo: z.enum(['acordo', 'condenacao']).optional().describe('Tipo de obrigação'),
      status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional().describe('Status do acordo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarAcordosPorCPF(args.cpf, args.tipo, args.status);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar acordos por CPF');
      }
    },
  });

  /**
   * Busca acordos vinculados a um cliente por CNPJ
   */
  registerMcpTool({
    name: 'buscar_acordos_por_cnpj',
    description: 'Busca acordos vinculados a um cliente por CNPJ',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().regex(/^\d{14}$/).describe('CNPJ do cliente (14 dígitos, apenas números)'),
      tipo: z.enum(['acordo', 'condenacao']).optional().describe('Tipo de obrigação'),
      status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional().describe('Status do acordo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarAcordosPorCNPJ(args.cnpj, args.tipo, args.status);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar acordos por CNPJ');
      }
    },
  });

  /**
   * Busca acordos e condenações de um processo específico pelo número processual CNJ
   */
  registerMcpTool({
    name: 'buscar_acordos_por_processo',
    description: 'Busca acordos e condenações de um processo específico pelo número processual CNJ',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      numero_processo: z.string().min(20).describe('Número do processo no formato CNJ (ex: 0001234-56.2023.5.15.0001)'),
      tipo: z.enum(['acordo', 'condenacao']).optional().describe('Tipo de obrigação'),
    }),
    handler: async (args) => {
      try {
        const { numero_processo, tipo } = args as { numero_processo: string; tipo?: 'acordo' | 'condenacao' };
        const result = await actionBuscarAcordosPorNumeroProcesso(numero_processo, tipo);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar acordos por processo');
      }
    },
  });

  /**
   * Lista repasses pendentes de pagamento
   */
  registerMcpTool({
    name: 'listar_repasses_pendentes',
    description: 'Lista repasses pendentes de pagamento',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      statusRepasse: z
        .enum(['nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado'])
        .optional()
        .describe('Status do repasse'),
      processoId: z.number().optional().describe('Filtrar por processo'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
      valorMinimo: z.number().optional().describe('Valor mínimo'),
      valorMaximo: z.number().optional().describe('Valor máximo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarRepassesPendentes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar repasses pendentes');
      }
    },
  });
}
