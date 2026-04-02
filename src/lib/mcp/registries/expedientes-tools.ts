/**
 * Registro de Ferramentas MCP - Expedientes
 *
 * Tools disponíveis:
 * - listar_expedientes: Lista expedientes com filtros
 * - criar_expediente: Cria novo expediente
 * - baixar_expediente: Baixa/finaliza expediente
 * - reverter_baixa_expediente: Reverte baixa de expediente
 * - listar_expedientes_pendentes: Lista apenas pendentes
 * - transferir_responsavel_expediente: Transfere responsável (bulk)
 * - baixar_expedientes_em_massa: Baixa múltiplos expedientes (bulk)
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Expedientes
 */
export async function registerExpedientesTools(): Promise<void> {
  const {
    actionListarExpedientes,
    actionCriarExpediente,
    actionBaixarExpediente,
    actionReverterBaixa,
  } = await import('@/app/app/expedientes/actions');

  const {
    actionBulkTransferirResponsavel,
    actionBulkBaixar,
  } = await import('@/app/app/expedientes/actions-bulk');

  /**
   * Lista expedientes do sistema com filtros por responsável, prazo, tipo, processo
   */
  registerMcpTool({
    name: 'listar_expedientes',
    description: 'Lista expedientes do sistema com filtros por responsável, prazo, tipo, processo',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de expedientes'),
      pagina: z.number().min(1).default(1).describe('Página para paginação'),
      processoId: z.number().optional().describe('Filtrar por processo'),
      busca: z.string().optional().describe('Busca textual por descrição'),
      responsavelId: z.number().optional().describe('Filtrar por responsável (ID do usuário)'),
      semResponsavel: z.boolean().optional().describe('Filtrar expedientes sem responsável atribuído'),
      prazoVencido: z.boolean().optional().describe('Filtrar expedientes com prazo vencido'),
      dataPrazoLegalInicio: z.string().optional().describe('Data início do período de prazo legal (YYYY-MM-DD)'),
      dataPrazoLegalFim: z.string().optional().describe('Data fim do período de prazo legal (YYYY-MM-DD)'),
      semPrazo: z.boolean().optional().describe('Filtrar expedientes sem prazo definido'),
      baixado: z.boolean().optional().describe('Filtrar por expedientes baixados (true) ou não baixados (false)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarExpedientes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar expedientes');
      }
    },
  });

  /**
   * Cria novo expediente no sistema
   */
  registerMcpTool({
    name: 'criar_expediente',
    description: 'Cria novo expediente no sistema',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(1).describe('Número do processo (formato CNJ)'),
      trt: z.enum(['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24']).describe('Tribunal Regional do Trabalho'),
      grau: z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior']).describe('Grau do tribunal'),
      dataPrazoLegalParte: z.string().describe('Data do prazo legal (YYYY-MM-DD)'),
      origem: z.enum(['captura', 'manual', 'comunica_cnj']).default('manual').describe('Origem do expediente'),
      processoId: z.number().optional().describe('ID do processo vinculado'),
      responsavelId: z.number().optional().describe('ID do responsável'),
      tipoExpedienteId: z.number().optional().describe('ID do tipo de expediente'),
      observacoes: z.string().optional().describe('Observações adicionais'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const result = await actionCriarExpediente(null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar expediente');
      }
    },
  });

  /**
   * Baixa/finaliza expediente
   */
  registerMcpTool({
    name: 'baixar_expediente',
    description: 'Baixa/finaliza expediente',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do expediente'),
      protocoloId: z.string().optional().describe('ID do protocolo de baixa'),
      justificativaBaixa: z.string().optional().describe('Justificativa para baixa sem protocolo'),
      dataBaixa: z.string().optional().describe('Data da baixa (YYYY-MM-DD)'),
    }).refine(data => data.protocoloId || data.justificativaBaixa, {
      message: 'É necessário fornecer protocoloId ou justificativaBaixa',
    }),
    handler: async (args) => {
      try {
        const { id, protocoloId, justificativaBaixa, dataBaixa } = args;

        const formData = new FormData();
        formData.append('expedienteId', id.toString());
        if (protocoloId) formData.append('protocoloId', protocoloId);
        if (justificativaBaixa) formData.append('justificativaBaixa', justificativaBaixa);
        if (dataBaixa) formData.append('dataBaixa', dataBaixa);

        const result = await actionBaixarExpediente(null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao baixar expediente');
      }
    },
  });

  /**
   * Reverte a baixa/finalização de um expediente, retornando-o ao status pendente
   */
  registerMcpTool({
    name: 'reverter_baixa_expediente',
    description: 'Reverte a baixa/finalização de um expediente, retornando-o ao status pendente',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do expediente a reverter'),
    }),
    handler: async (args) => {
      try {
        const result = await actionReverterBaixa(args.id, null, new FormData());
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao reverter baixa do expediente');
      }
    },
  });

  /**
   * Transfere a responsabilidade de um ou mais expedientes para outro usuário
   */
  registerMcpTool({
    name: 'transferir_responsavel_expediente',
    description: 'Transfere a responsabilidade de um ou mais expedientes para outro usuário',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      expedienteIds: z.array(z.number()).min(1).describe('IDs dos expedientes a transferir'),
      responsavelId: z.number().nullable().describe('ID do novo responsável (null para remover responsável)'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        formData.append('responsavelId', args.responsavelId === null ? 'null' : String(args.responsavelId));

        const result = await actionBulkTransferirResponsavel(args.expedienteIds, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao transferir responsável');
      }
    },
  });

  /**
   * Baixa/finaliza múltiplos expedientes de uma vez com a mesma justificativa
   */
  registerMcpTool({
    name: 'baixar_expedientes_em_massa',
    description: 'Baixa/finaliza múltiplos expedientes de uma vez com a mesma justificativa',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      expedienteIds: z.array(z.number()).min(1).describe('IDs dos expedientes a baixar'),
      justificativaBaixa: z.string().min(1).describe('Justificativa para a baixa em massa'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        formData.append('justificativaBaixa', args.justificativaBaixa);

        const result = await actionBulkBaixar(args.expedienteIds, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao baixar expedientes em massa');
      }
    },
  });

  /**
   * Lista apenas expedientes pendentes
   */
  registerMcpTool({
    name: 'listar_expedientes_pendentes',
    description: 'Lista apenas expedientes pendentes',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de expedientes'),
      processoId: z.number().optional().describe('Filtrar por processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarExpedientes({ ...args, baixado: false });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar expedientes pendentes');
      }
    },
  });
}
