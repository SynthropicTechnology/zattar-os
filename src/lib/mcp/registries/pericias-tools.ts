/**
 * Registro de Ferramentas MCP - Perícias
 *
 * Tools disponíveis:
 * - listar_pericias: Lista perícias com filtros
 * - buscar_pericia_por_id: Busca perícia específica
 * - buscar_pericias_por_processo: Busca perícias por número de processo
 * - listar_especialidades_pericia: Lista especialidades disponíveis
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';
import type { CodigoTribunal, GrauTribunal } from '@/app/app/expedientes';
import type { SituacaoPericiaCodigo, PericiaSortBy } from '@/app/app/pericias';

/**
 * Registra ferramentas MCP do módulo Perícias
 */
export async function registerPericiasTools(): Promise<void> {
  const {
    actionListarPericias,
    actionObterPericia,
    actionListarEspecialidadesPericia,
  } = await import('@/app/app/pericias/actions/pericias-actions');

  /**
   * Lista perícias com filtros opcionais (TRT, grau, situação, responsável, prazo)
   */
  registerMcpTool({
    name: 'listar_pericias',
    description: 'Lista perícias com filtros opcionais (TRT, grau, situação, responsável, prazo)',
    feature: 'pericias',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de perícias'),
      busca: z.string().optional().describe('Busca textual por número de processo ou observações'),
      trt: z.string().optional().describe('Filtrar por TRT (ex: TRT15, TRT2)'),
      grau: z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior']).optional().describe('Filtrar por grau (primeiro_grau = 1º Grau, segundo_grau = 2º Grau, tribunal_superior = Tribunal Superior)'),
      situacao_codigo: z.enum(['S', 'L', 'C', 'F', 'P', 'R']).optional().describe('Situação (S=Aguardando Esclarecimentos, L=Aguardando Laudo, C=Cancelada, F=Finalizada, P=Laudo Juntado, R=Redesignada)'),
      responsavel_id: z.number().int().positive().optional().describe('ID do responsável'),
      sem_responsavel: z.boolean().optional().describe('Filtrar apenas perícias sem responsável'),
      especialidade_id: z.number().int().positive().optional().describe('ID da especialidade'),
      perito_id: z.number().int().positive().optional().describe('ID do perito'),
      laudo_juntado: z.boolean().optional().describe('Filtrar por laudo juntado'),
      prazo_entrega_inicio: z.string().optional().describe('Data de início do prazo de entrega (YYYY-MM-DD)'),
      prazo_entrega_fim: z.string().optional().describe('Data de fim do prazo de entrega (YYYY-MM-DD)'),
      segredo_justica: z.boolean().optional().describe('Filtrar por segredo de justiça'),
      prioridade_processual: z.boolean().optional().describe('Filtrar por prioridade processual'),
      arquivado: z.boolean().optional().describe('Filtrar por arquivado'),
      ordenar_por: z.enum(['prazo_entrega', 'data_criacao', 'situacao_codigo']).optional().describe('Campo para ordenação'),
      ordem: z.enum(['asc', 'desc']).default('asc').describe('Direção da ordenação'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPericias({
          pagina: args.pagina,
          limite: args.limite,
          busca: args.busca,
          trt: args.trt as CodigoTribunal | undefined,
          grau: args.grau as GrauTribunal | undefined,
          situacaoCodigo: args.situacao_codigo as SituacaoPericiaCodigo | undefined,
          responsavelId: args.responsavel_id,
          semResponsavel: args.sem_responsavel,
          especialidadeId: args.especialidade_id,
          peritoId: args.perito_id,
          laudoJuntado: args.laudo_juntado,
          prazoEntregaInicio: args.prazo_entrega_inicio,
          prazoEntregaFim: args.prazo_entrega_fim,
          segredoJustica: args.segredo_justica,
          prioridadeProcessual: args.prioridade_processual,
          arquivado: args.arquivado,
          ordenarPor: args.ordenar_por as PericiaSortBy | undefined,
          ordem: args.ordem,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar perícias');
      }
    },
  });

  /**
   * Busca perícia específica por ID
   */
  registerMcpTool({
    name: 'buscar_pericia_por_id',
    description: 'Busca perícia específica por ID',
    feature: 'pericias',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID da perícia'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterPericia(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar perícia');
      }
    },
  });

  /**
   * Busca perícias por número de processo (busca textual)
   */
  registerMcpTool({
    name: 'buscar_pericias_por_processo',
    description: 'Busca perícias por número de processo (busca textual)',
    feature: 'pericias',
    requiresAuth: true,
    schema: z.object({
      numero_processo: z.string().min(1).describe('Número do processo'),
      limite: z.number().min(1).max(100).default(10).describe('Número máximo de perícias'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPericias({
          busca: args.numero_processo,
          limite: args.limite,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar perícias por processo');
      }
    },
  });

  /**
   * Lista especialidades de perícia disponíveis no sistema
   */
  registerMcpTool({
    name: 'listar_especialidades_pericia',
    description: 'Lista especialidades de perícia disponíveis no sistema',
    feature: 'pericias',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarEspecialidadesPericia();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar especialidades de perícia');
      }
    },
  });
}
