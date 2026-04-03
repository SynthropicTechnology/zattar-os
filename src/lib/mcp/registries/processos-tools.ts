/**
 * Registro de Ferramentas MCP - Processos
 *
 * Tools disponíveis:
 * - listar_processos: Lista com filtros (TRT, status, grau, advogado)
 * - buscar_processos_por_cpf: Busca por CPF do cliente
 * - buscar_processos_por_cnpj: Busca por CNPJ do cliente
 * - buscar_processo_por_numero: Busca por número processual (CNJ)
 *
 * IMPORTANTE: As ferramentas MCP chamam os SERVICES diretamente,
 * não as Server Actions, pois a autenticação já foi validada
 * no endpoint MCP via Service API Key.
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Processos
 */
export async function registerProcessosTools(): Promise<void> {
  // Importar services diretamente (sem autenticação - já validada no MCP endpoint)
  const {
    listarProcessos,
    buscarTimeline,
    buscarProcessosPorClienteCPF,
    buscarProcessosPorClienteCNPJ,
  } = await import('@/app/(authenticated)/processos/service');

  /**
   * Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, período, busca textual)
   */
  registerMcpTool({
    name: 'listar_processos',
    description: 'Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, período, busca textual)',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de processos'),
      busca: z.string().optional().describe('Busca textual por número do processo ou partes'),
      trt: z.union([z.string(), z.array(z.string())]).optional().describe('Filtrar por TRT (ex: "TRT15")'),
      grau: z
        .enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior'])
        .optional()
        .describe('Filtrar por grau (primeiro_grau, segundo_grau, tribunal_superior)'),
      advogadoId: z.number().optional().describe('Filtrar por ID do advogado responsável'),
      unified: z.boolean().optional().default(true).describe('Retornar visão unificada (default: true)'),
    }),
    handler: async (args) => {
      try {
        const result = await listarProcessos(args);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        return jsonResult({
          message: `${result.data.pagination.total} processo(s) encontrado(s)`,
          ...result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar processos');
      }
    },
  });

  /**
   * Busca todos os processos vinculados a um cliente por CPF
   */
  registerMcpTool({
    name: 'buscar_processos_por_cpf',
    description: 'Busca todos os processos vinculados a um cliente por CPF',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(50).optional().describe('Número máximo de processos'),
    }),
    handler: async (args) => {
      try {
        const { cpf, limite } = args as { cpf: string; limite?: number };

        const result = await buscarProcessosPorClienteCPF(cpf, limite);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        const processos = result.data ?? [];
        const enriquecidos = await Promise.all(
          processos.map(async (p) => {
            if (!p?.id) return { processo: p, timeline: [] };
            const timelineResult = await buscarTimeline(p.id);
            const timeline = timelineResult?.success ? timelineResult.data : [];
            return { processo: p, timeline };
          })
        );

        return jsonResult({
          message: `${enriquecidos.length} processo(s) encontrado(s)`,
          cpf,
          total: enriquecidos.length,
          processos: enriquecidos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processos por CPF');
      }
    },
  });

  /**
   * Busca todos os processos vinculados a um cliente por CNPJ
   */
  registerMcpTool({
    name: 'buscar_processos_por_cnpj',
    description: 'Busca todos os processos vinculados a um cliente por CNPJ',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(50).optional().describe('Número máximo de processos'),
    }),
    handler: async (args) => {
      try {
        const { cnpj, limite } = args as { cnpj: string; limite?: number };

        const result = await buscarProcessosPorClienteCNPJ(cnpj, limite);

        if (!result.success) {
          return errorResult(result.error.message);
        }

        const processos = result.data ?? [];
        const enriquecidos = await Promise.all(
          processos.map(async (p) => {
            if (!p?.id) return { processo: p, timeline: [] };
            const timelineResult = await buscarTimeline(p.id);
            const timeline = timelineResult?.success ? timelineResult.data : [];
            return { processo: p, timeline };
          })
        );

        return jsonResult({
          message: `${enriquecidos.length} processo(s) encontrado(s)`,
          cnpj,
          total: enriquecidos.length,
          processos: enriquecidos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processos por CNPJ');
      }
    },
  });

  /**
   * Busca processo pelo número processual (formato CNJ ou simplificado)
   */
  registerMcpTool({
    name: 'buscar_processo_por_numero',
    description: 'Busca processo pelo número processual (formato CNJ ou simplificado)',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(7).describe('Número do processo (com ou sem formatação CNJ)'),
    }),
    handler: async (args) => {
      try {
        const { numeroProcesso } = args as { numeroProcesso: string };

        // Normalizar número de processo (remover formatação CNJ)
        const { normalizarNumeroProcesso } = await import('@/app/(authenticated)/processos/utils');
        const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso.trim());

        // Buscar processo via service
        const result = await listarProcessos({ numeroProcesso: numeroNormalizado, limite: 1 });

        if (!result.success) {
          return errorResult(result.error.message);
        }

        if (!result.data.data || result.data.data.length === 0) {
          return errorResult('Processo não encontrado');
        }

        const processo = result.data.data[0] as { id?: number };

        const timeline = processo?.id ? await buscarTimeline(processo.id) : null;

        return jsonResult({
          message: 'Processo encontrado',
          numeroProcesso,
          processo,
          timeline: timeline?.success ? timeline.data : [],
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processo por número');
      }
    },
  });
}
