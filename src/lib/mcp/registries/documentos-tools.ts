/**
 * Registro de Ferramentas MCP - Documentos
 *
 * Tools disponíveis:
 * - listar_documentos: Lista documentos com filtros (pasta, tags, busca)
 * - buscar_documento_por_tags: Busca documentos por tags específicas
 * - listar_templates: Lista templates disponíveis com filtros
 * - usar_template: Cria documento a partir de template
 * - listar_categorias_templates: Lista categorias de templates
 * - listar_templates_mais_usados: Lista templates mais populares
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { actionResultToMcp } from '../utils';
import { errorResult } from '../types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Documentos
 */
export async function registerDocumentosTools(): Promise<void> {
  // Documentos
  const { actionListarDocumentos } = await import('@/app/(authenticated)/documentos/actions/documentos-actions');

  // Templates
  const {
    actionListarTemplates,
    actionUsarTemplate,
    actionListarCategorias,
    actionListarTemplatesMaisUsados,
  } = await import('@/app/(authenticated)/documentos/actions/templates-actions');

  /**
   * Lista documentos do sistema com filtros por pasta, tags e busca textual
   */
  registerMcpTool({
    name: 'listar_documentos',
    description: 'Lista documentos do sistema com filtros por pasta, tags e busca textual',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de documentos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      pasta_id: z.number().optional().describe('Filtrar por pasta'),
      tags: z.array(z.string()).optional().describe('Filtrar por tags'),
      busca: z.string().optional().describe('Busca textual por título ou conteúdo'),
    }),
    handler: async (args) => {
      try {
        const { limite, ...rest } = args;
        const result = await actionListarDocumentos({ ...rest, limit: limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar documentos');
      }
    },
  });

  /**
   * Busca documentos por tags específicas
   */
  registerMcpTool({
    name: 'buscar_documento_por_tags',
    description: 'Busca documentos por tags específicas',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      tags: z.array(z.string()).min(1).describe('Tags para buscar'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de documentos'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarDocumentos({ tags: args.tags, limit: args.limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar documentos por tags');
      }
    },
  });

  /**
   * Lista templates de documentos disponíveis com filtros por categoria e visibilidade
   */
  registerMcpTool({
    name: 'listar_templates',
    description: 'Lista templates de documentos disponíveis com filtros por categoria e visibilidade',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de templates'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      categoria: z.string().optional().describe('Filtrar por categoria'),
      visibilidade: z.enum(['publico', 'privado']).optional().describe('Filtrar por visibilidade'),
      busca: z.string().optional().describe('Busca textual por título'),
    }),
    handler: async (args) => {
      try {
        const { limite, ...rest } = args;
        const result = await actionListarTemplates({ ...rest, limit: limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates');
      }
    },
  });

  /**
   * Cria novo documento a partir de um template existente
   */
  registerMcpTool({
    name: 'usar_template',
    description: 'Cria novo documento a partir de um template existente',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      template_id: z.number().describe('ID do template a usar'),
      titulo: z.string().optional().describe('Título do novo documento (opcional)'),
      pasta_id: z.number().nullable().optional().describe('ID da pasta destino (null para raiz)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionUsarTemplate(args.template_id, {
          titulo: args.titulo,
          pasta_id: args.pasta_id,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao usar template');
      }
    },
  });

  /**
   * Lista todas as categorias de templates disponíveis
   */
  registerMcpTool({
    name: 'listar_categorias_templates',
    description: 'Lista todas as categorias de templates disponíveis',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarCategorias();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar categorias');
      }
    },
  });

  /**
   * Lista os templates mais utilizados no sistema
   */
  registerMcpTool({
    name: 'listar_templates_mais_usados',
    description: 'Lista os templates mais utilizados no sistema',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(50).default(10).describe('Número de templates a retornar'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTemplatesMaisUsados(args.limite);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates mais usados');
      }
    },
  });
}
