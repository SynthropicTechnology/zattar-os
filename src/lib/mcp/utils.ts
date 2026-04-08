/**
 * Utilitários para integração MCP do Synthropic
 */

import { type ZodSchema } from 'zod';
import type { MCPToolConfig, MCPToolResult, MCPContentBlock } from './types';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Converte resultado de Server Action para resultado MCP
 */
export function actionResultToMcp<T>(result: ActionResult<T>): MCPToolResult {
  if (result.success) {
    const structuredContent: Record<string, unknown> = {
      success: true,
      message: result.message || 'Operação realizada com sucesso',
      data: result.data as unknown,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            structuredContent,
            null,
            2
          ),
        },
      ],
      structuredContent,
    };
  }

  const structuredContent: Record<string, unknown> = {
    success: false,
    error: result.error as unknown,
    errors: result.errors as unknown,
    message: result.message as unknown,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          structuredContent,
          null,
          2
        ),
      },
    ],
    isError: true,
    structuredContent,
  };
}

/**
 * Cria configuração de ferramenta MCP a partir de uma Server Action
 */
export function createToolFromAction<TInput, TOutput>(params: {
  name: string;
  description: string;
  schema: ZodSchema<TInput>;
  action: (input: TInput) => Promise<ActionResult<TOutput>>;
  feature: string;
  requiresAuth?: boolean;
}): MCPToolConfig<TInput> {
  const { name, description, schema, action, feature, requiresAuth = true } = params;

  return {
    name,
    description,
    schema,
    feature,
    requiresAuth,
    handler: async (args: TInput) => {
      const validatedArgs = schema.parse(args);
      const result = await action(validatedArgs);
      return actionResultToMcp(result);
    },
  };
}

/**
 * Formata dados para exibição em texto
 */
export function formatDataAsText(data: unknown, indent: number = 0): string {
  const prefix = '  '.repeat(indent);

  if (data === null || data === undefined) {
    return `${prefix}(vazio)`;
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return `${prefix}${data}`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `${prefix}(lista vazia)`;
    }

    return data.map((item, i) => `${prefix}[${i}] ${formatDataAsText(item, indent + 1)}`).join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return `${prefix}(objeto vazio)`;
    }

    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${prefix}${key}:\n${formatDataAsText(value, indent + 1)}`;
        }
        return `${prefix}${key}: ${value}`;
      })
      .join('\n');
  }

  return `${prefix}${String(data)}`;
}

/**
 * Cria blocos de conteúdo para múltiplos itens
 */
export function createContentBlocks(items: Array<{ title: string; content: string }>): MCPContentBlock[] {
  return items.map(({ title, content }) => ({
    type: 'text' as const,
    text: `## ${title}\n\n${content}`,
  }));
}

/**
 * Trunca texto para limite de caracteres
 */
export function truncateText(text: string, maxLength: number = 1000): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formata lista de itens para exibição MCP
 */
export function formatListForMcp<T extends Record<string, unknown>>(
  items: T[],
  options: {
    titleField: keyof T;
    subtitleField?: keyof T;
    descriptionField?: keyof T;
    maxItems?: number;
  }
): string {
  const { titleField, subtitleField, descriptionField, maxItems = 20 } = options;

  const displayItems = items.slice(0, maxItems);

  let result = displayItems
    .map((item, index) => {
      let line = `${index + 1}. **${item[titleField]}**`;

      if (subtitleField && item[subtitleField]) {
        line += ` - ${item[subtitleField]}`;
      }

      if (descriptionField && item[descriptionField]) {
        line += `\n   ${truncateText(String(item[descriptionField]), 200)}`;
      }

      return line;
    })
    .join('\n\n');

  if (items.length > maxItems) {
    result += `\n\n... e mais ${items.length - maxItems} itens`;
  }

  return result;
}

/**
 * Extrai campos relevantes de um objeto para exibição resumida
 */
export function extractSummaryFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> {
  const summary: Partial<T> = {};

  for (const field of fields) {
    if (obj[field] !== undefined && obj[field] !== null) {
      summary[field] = obj[field];
    }
  }

  return summary;
}

/**
 * Valida se um objeto tem os campos obrigatórios
 */
export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): boolean {
  return requiredFields.every(
    (field) => obj[field] !== undefined && obj[field] !== null && obj[field] !== ''
  );
}

/**
 * Gera nome de ferramenta MCP padronizado
 */
export function generateToolName(feature: string, action: string): string {
  return `${feature.toLowerCase()}_${action.toLowerCase()}`.replace(/[^a-z0-9_]/g, '_');
}

/**
 * Gera descrição de ferramenta MCP padronizada
 */
export function generateToolDescription(
  action: 'listar' | 'buscar' | 'criar' | 'atualizar' | 'excluir' | 'outros',
  entity: string,
  details?: string
): string {
  const actionDescriptions: Record<string, string> = {
    listar: `Lista ${entity} do sistema`,
    buscar: `Busca ${entity} por ID ou critérios`,
    criar: `Cria novo(a) ${entity}`,
    atualizar: `Atualiza ${entity} existente`,
    excluir: `Exclui ${entity} do sistema`,
    outros: `Operação com ${entity}`,
  };

  let description = actionDescriptions[action] || `Operação com ${entity}`;

  if (details) {
    description += `. ${details}`;
  }

  return description;
}
