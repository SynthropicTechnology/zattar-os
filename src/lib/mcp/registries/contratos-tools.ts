/**
 * Registro de Ferramentas MCP - Contratos
 *
 * Tools disponíveis:
 * - listar_contratos: Lista contratos com filtros
 * - criar_contrato: Cria novo contrato
 * - atualizar_contrato: Atualiza contrato existente
 * - buscar_contrato_por_cliente: Busca contratos de um cliente
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Contratos
 */
export async function registerContratosTools(): Promise<void> {
  const {
    actionCriarContrato,
    actionListarContratos,
    actionAtualizarContrato,
    tipoContratoSchema,
    tipoCobrancaSchema,
    statusContratoSchema,
    papelContratualSchema,
  } = await import('@/app/(authenticated)/contratos');

  /**
   * Lista contratos do sistema com filtros por tipo, status, cliente
   */
  registerMcpTool({
    name: 'listar_contratos',
    description: 'Lista contratos do sistema com filtros por tipo, status, cliente',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de contratos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      tipo: tipoContratoSchema.optional().describe('Filtrar por tipo de contrato'),
      status: statusContratoSchema.optional().describe('Filtrar por status'),
      clienteId: z.number().optional().describe('Filtrar por ID do cliente'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarContratos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contratos');
      }
    },
  });

  /**
   * Cria novo contrato no sistema
   */
  registerMcpTool({
    name: 'criar_contrato',
    description: 'Cria novo contrato no sistema',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      segmentoId: z.number().int().positive().nullable().optional().describe('ID do segmento (opcional)'),
      tipoContrato: tipoContratoSchema.describe('Tipo do contrato'),
      tipoCobranca: tipoCobrancaSchema.describe('Tipo de cobrança'),
      clienteId: z.number().int().positive().describe('ID do cliente'),
      papelClienteNoContrato: papelContratualSchema.describe('Papel do cliente no contrato'),
      status: statusContratoSchema.optional().describe('Status do contrato'),
      cadastradoEm: z.string().optional().describe('Data de cadastro (YYYY-MM-DD)'),
      responsavelId: z.number().int().positive().nullable().optional().describe('ID do responsável (opcional)'),
      createdBy: z.number().int().positive().nullable().optional().describe('ID do criador (opcional)'),
      observacoes: z.string().nullable().optional().describe('Observações'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        formData.append('clienteId', String(args.clienteId));
        formData.append('tipoContrato', String(args.tipoContrato));
        formData.append('tipoCobranca', String(args.tipoCobranca));
        formData.append('papelClienteNoContrato', String(args.papelClienteNoContrato));
        if (args.status) formData.append('status', String(args.status));
        if (args.cadastradoEm) formData.append('cadastradoEm', String(args.cadastradoEm));
        if (args.segmentoId !== undefined && args.segmentoId !== null) formData.append('segmentoId', String(args.segmentoId));
        if (args.responsavelId !== undefined && args.responsavelId !== null) formData.append('responsavelId', String(args.responsavelId));
        if (args.createdBy !== undefined && args.createdBy !== null) formData.append('createdBy', String(args.createdBy));
        if (args.observacoes !== undefined) formData.append('observacoes', args.observacoes === null ? '' : String(args.observacoes));

        const result = await actionCriarContrato(null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar contrato');
      }
    },
  });

  /**
   * Atualiza contrato existente
   */
  registerMcpTool({
    name: 'atualizar_contrato',
    description: 'Atualiza contrato existente',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do contrato'),
      segmentoId: z.number().int().positive().nullable().optional().describe('ID do segmento (opcional)'),
      tipoContrato: tipoContratoSchema.optional().describe('Tipo do contrato'),
      tipoCobranca: tipoCobrancaSchema.optional().describe('Tipo de cobrança'),
      clienteId: z.number().int().positive().optional().describe('ID do cliente'),
      papelClienteNoContrato: papelContratualSchema.optional().describe('Papel do cliente no contrato'),
      status: statusContratoSchema.optional().describe('Status do contrato'),
      cadastradoEm: z.string().nullable().optional().describe('Data de cadastro (YYYY-MM-DD)'),
      responsavelId: z.number().int().positive().nullable().optional().describe('ID do responsável (opcional)'),
      observacoes: z.string().nullable().optional().describe('Observações'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        if (args.clienteId !== undefined) formData.append('clienteId', String(args.clienteId));
        if (args.tipoContrato !== undefined) formData.append('tipoContrato', String(args.tipoContrato));
        if (args.tipoCobranca !== undefined) formData.append('tipoCobranca', String(args.tipoCobranca));
        if (args.papelClienteNoContrato !== undefined) formData.append('papelClienteNoContrato', String(args.papelClienteNoContrato));
        if (args.status !== undefined) formData.append('status', String(args.status));
        if (args.cadastradoEm !== undefined) formData.append('cadastradoEm', args.cadastradoEm === null ? '' : String(args.cadastradoEm));
        if (args.segmentoId !== undefined && args.segmentoId !== null) formData.append('segmentoId', String(args.segmentoId));
        if (args.responsavelId !== undefined && args.responsavelId !== null) formData.append('responsavelId', String(args.responsavelId));
        if (args.observacoes !== undefined) formData.append('observacoes', args.observacoes === null ? '' : String(args.observacoes));

        const result = await actionAtualizarContrato(args.id, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar contrato');
      }
    },
  });

  /**
   * Busca contratos de um cliente específico
   */
  registerMcpTool({
    name: 'buscar_contrato_por_cliente',
    description: 'Busca contratos de um cliente específico',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      cliente_id: z.number().positive().describe('ID do cliente'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de contratos'),
      status: statusContratoSchema.optional().describe('Filtrar por status'),
    }),
    handler: async (args) => {
      try {
        const { cliente_id, limite, status } = args as {
          cliente_id: number;
          limite: number;
          status?: 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia'
        };
        const result = await actionListarContratos({
          clienteId: cliente_id,
          limite,
          status,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar contratos do cliente');
      }
    },
  });
}
