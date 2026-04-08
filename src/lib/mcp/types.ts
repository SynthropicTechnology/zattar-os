/**
 * Tipos para integração MCP do Synthropic
 */

import { z, type ZodSchema } from 'zod';

/**
 * Configuração de uma ferramenta MCP
 */
export interface MCPToolConfig<TArgs = unknown> {
  /** Nome da ferramenta (snake_case) */
  name: string;
  /** Descrição da ferramenta em português */
  description: string;
  /** Schema Zod para validação de parâmetros */
  schema: ZodSchema<TArgs>;
  /** Handler da ferramenta */
  handler: (args: TArgs) => Promise<MCPToolResult>;
  /** Feature de origem */
  feature: string;
  /** Se requer autenticação */
  requiresAuth: boolean;
}

/**
 * Resultado de uma ferramenta MCP
 */
export interface MCPToolResult {
  content: MCPContentBlock[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

/**
 * Bloco de conteúdo MCP
 */
export interface MCPContentBlock {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

/**
 * Metadados do servidor MCP
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
}

/**
 * Configuração do servidor MCP
 */
export interface MCPServerConfig {
  info: MCPServerInfo;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
}

/**
 * Estado de uma conexão MCP
 */
export interface MCPConnectionState {
  id: string;
  userId?: number;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * Registro de ferramenta para o registry
 */
export interface ToolRegistration {
  tool: MCPToolConfig;
  registered: boolean;
  registeredAt?: Date;
}

/**
 * Helper para criar resultado de texto
 */
export function textResult(text: string): MCPToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Helper para criar resultado JSON
 */
export function jsonResult(data: unknown): MCPToolResult {
  const base: MCPToolResult = {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    base.structuredContent = data as Record<string, unknown>;
  }

  return base;
}

/**
 * Helper para criar resultado de erro
 */
export function errorResult(message: string): MCPToolResult {
  return {
    content: [{ type: 'text', text: `Erro: ${message}` }],
    isError: true,
  };
}

/**
 * Schema para parâmetros de busca genérica
 */
export const buscaGenericaSchema = z.object({
  query: z.string().min(1).describe('Texto da busca'),
  limite: z.number().min(1).max(100).default(10).describe('Número máximo de resultados'),
  pagina: z.number().min(1).default(1).describe('Página de resultados'),
});

/**
 * Schema para parâmetros de listagem
 */
export const listagemSchema = z.object({
  limite: z.number().min(1).max(100).default(20).describe('Número máximo de itens'),
  offset: z.number().min(0).default(0).describe('Offset para paginação'),
  ordenarPor: z.string().optional().describe('Campo para ordenação'),
  ordenarDirecao: z.enum(['asc', 'desc']).default('desc').describe('Direção da ordenação'),
});

/**
 * Schema para parâmetros de busca por ID
 */
export const buscarPorIdSchema = z.object({
  id: z.number().int().positive().describe('ID do registro'),
});
