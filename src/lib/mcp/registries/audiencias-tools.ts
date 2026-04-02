/**
 * Registro de Ferramentas MCP - Audiências
 *
 * Tools disponíveis:
 * - listar_audiencias: Lista audiências com filtros
 * - atualizar_status_audiencia: Atualiza status
 * - listar_tipos_audiencia: Lista tipos disponíveis
 * - buscar_audiencias_por_cpf: Busca por CPF do cliente
 * - buscar_audiencias_por_cnpj: Busca por CNPJ do cliente
 * - buscar_audiencias_por_numero_processo: Busca por número processual
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { jsonResult, errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Audiências
 */
export async function registerAudienciasTools(): Promise<void> {
  const {
    actionListarAudiencias,
    actionAtualizarStatusAudiencia,
    actionListarTiposAudiencia,
    actionBuscarAudienciasPorNumeroProcesso,
  } = await import('@/features/audiencias/actions');

  const { StatusAudiencia, ModalidadeAudiencia, GrauTribunal, CODIGO_TRIBUNAL } = await import('@/features/audiencias/domain');

  /**
   * Lista audiências do sistema com filtros por data, tipo, status, processo
   */
  registerMcpTool({
    name: 'listar_audiencias',
    description: 'Lista audiências do sistema com filtros por data, tipo, status, processo',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
      busca: z.string().optional().describe('Busca textual'),
      trt: z.enum(CODIGO_TRIBUNAL).optional().describe('TRT (ex: TRT15)'),
      grau: z.nativeEnum(GrauTribunal).optional().describe('Grau do tribunal'),
      status: z.nativeEnum(StatusAudiencia).optional().describe('Status (M=Marcada, F=Finalizada, C=Cancelada)'),
      modalidade: z.nativeEnum(ModalidadeAudiencia).optional().describe('Modalidade da audiência'),
      tipoAudienciaId: z.number().optional().describe('ID do tipo de audiência'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAudiencias({
          pagina: args.pagina,
          limite: args.limite,
          busca: args.busca,
          trt: args.trt,
          grau: args.grau,
          status: args.status,
          modalidade: args.modalidade,
          tipoAudienciaId: args.tipoAudienciaId,
          dataInicioInicio: args.dataInicio,
          dataInicioFim: args.dataFim,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar audiências');
      }
    },
  });

  /**
   * Atualiza status de uma audiência
   */
  registerMcpTool({
    name: 'atualizar_status_audiencia',
    description: 'Atualiza status de uma audiência',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da audiência'),
      status: z.nativeEnum(StatusAudiencia).describe('Novo status (M=Marcada, F=Finalizada, C=Cancelada)'),
      statusDescricao: z.string().optional().describe('Descrição sobre a mudança de status'),
    }),
    handler: async (args) => {
      try {
        const { id, status, statusDescricao } = args;
        const result = await actionAtualizarStatusAudiencia(id, status, statusDescricao);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar status da audiência');
      }
    },
  });

  /**
   * Lista tipos de audiências disponíveis no sistema
   */
  registerMcpTool({
    name: 'listar_tipos_audiencia',
    description: 'Lista tipos de audiências disponíveis no sistema',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarTiposAudiencia();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tipos de audiência');
      }
    },
  });

  /**
   * Busca audiências vinculadas a um cliente por CPF
   */
  registerMcpTool({
    name: 'buscar_audiencias_por_cpf',
    description: 'Busca audiências vinculadas a um cliente por CPF',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
    }),
    handler: async (args) => {
      try {
        const limite = args.limite ?? 20;

        const { actionListarClientes } = await import('@/app/app/partes/server');
        const clienteResult = await actionListarClientes({ busca: args.cpf, limite: 1 });

        if (!clienteResult.success) {
          return actionResultToMcp(clienteResult as ActionResult<unknown>);
        }

        const clientes = clienteResult.data?.data ?? [];
        const cliente = clientes?.[0];

        if (!cliente?.id) {
          return errorResult('Cliente não encontrado com este CPF');
        }

        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cpf });

        if (!processosResult.success) {
          return jsonResult({ audiencias: [] });
        }

        const processos = (processosResult.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];

        const todasAudiencias: unknown[] = [];
        for (const processo of processos) {
          const numeroProcesso =
            (processo.numero_processo as string | undefined) ??
            (processo.numeroProcesso as string | undefined);

          if (!numeroProcesso) continue;

          const audienciasResult = await actionBuscarAudienciasPorNumeroProcesso(numeroProcesso);
          if (audienciasResult.success) {
            todasAudiencias.push(...(audienciasResult.data ?? []));
          }
        }

        return jsonResult({
          message: `${Math.min(todasAudiencias.length, limite)} audiência(s) encontrada(s)`,
          cpf: args.cpf,
          total: todasAudiencias.length,
          audiencias: todasAudiencias.slice(0, limite),
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por CPF');
      }
    },
  });

  /**
   * Busca audiências vinculadas a um cliente por CNPJ
   */
  registerMcpTool({
    name: 'buscar_audiencias_por_cnpj',
    description: 'Busca audiências vinculadas a um cliente por CNPJ',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
    }),
    handler: async (args) => {
      try {
        const limite = args.limite ?? 20;

        const { actionListarClientes } = await import('@/app/app/partes/server');
        const clienteResult = await actionListarClientes({ busca: args.cnpj, limite: 1 });

        if (!clienteResult.success) {
          return actionResultToMcp(clienteResult as ActionResult<unknown>);
        }

        const clientes = clienteResult.data?.data ?? [];
        const cliente = clientes?.[0];

        if (!cliente?.id) {
          return errorResult('Cliente não encontrado com este CNPJ');
        }

        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cnpj });

        if (!processosResult.success) {
          return jsonResult({ audiencias: [] });
        }

        const processos = (processosResult.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];

        const todasAudiencias: unknown[] = [];
        for (const processo of processos) {
          const numeroProcesso =
            (processo.numero_processo as string | undefined) ??
            (processo.numeroProcesso as string | undefined);

          if (!numeroProcesso) continue;

          const audienciasResult = await actionBuscarAudienciasPorNumeroProcesso(numeroProcesso);
          if (audienciasResult.success) {
            todasAudiencias.push(...(audienciasResult.data ?? []));
          }
        }

        return jsonResult({
          message: `${Math.min(todasAudiencias.length, limite)} audiência(s) encontrada(s)`,
          cnpj: args.cnpj,
          total: todasAudiencias.length,
          audiencias: todasAudiencias.slice(0, limite),
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por CNPJ');
      }
    },
  });

  /**
   * Busca audiências de um processo específico pelo número processual (formato CNJ)
   */
  registerMcpTool({
    name: 'buscar_audiencias_por_numero_processo',
    description: 'Busca audiências de um processo específico pelo número processual (formato CNJ)',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(1).describe('Número do processo (formato CNJ: 0000000-00.0000.0.00.0000)'),
      status: z.nativeEnum(StatusAudiencia).optional().describe('Filtrar por status: M=Marcada, F=Finalizada, C=Cancelada'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarAudienciasPorNumeroProcesso(args.numeroProcesso, args.status);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por número de processo');
      }
    },
  });
}
