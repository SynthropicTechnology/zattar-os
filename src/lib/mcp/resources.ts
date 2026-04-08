/**
 * Sistema de Resources MCP do Synthropic
 *
 * Resources permitem expor dados estruturados (documentos, arquivos, processos)
 * para clientes MCP que podem acessá-los via URI.
 */

// import { z } from 'zod';

// =============================================================================
// TIPOS
// =============================================================================

export interface MCPResourceConfig {
  uri: string; // Ex: "synthropic://documentos/{id}"
  name: string;
  description: string;
  mimeType?: string;
  handler: (
    uri: string,
    params: Record<string, string>
  ) => Promise<MCPResourceResult>;
}

export interface MCPResourceResult {
  uri: string;
  mimeType: string;
  content: string | Buffer;
  metadata?: Record<string, unknown>;
}

export interface MCPResourceListItem {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// =============================================================================
// REGISTRY
// =============================================================================

const resources = new Map<string, MCPResourceConfig>();

/**
 * Registra um resource no sistema
 */
export function registerMcpResource(config: MCPResourceConfig): void {
  resources.set(config.uri, config);
  console.log(`[MCP Resources] Registrado: ${config.uri}`);
}

/**
 * Lista todos os resources registrados
 */
export function listMcpResources(): MCPResourceListItem[] {
  return Array.from(resources.values()).map((r) => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType,
  }));
}

/**
 * Extrai parâmetros de uma URI
 * Ex: "synthropic://documentos/123" com template "synthropic://documentos/{id}"
 * Retorna: { id: "123" }
 */
function extractParams(
  template: string,
  uri: string
): Record<string, string> | null {
  const templateParts = template.split("/");
  const uriParts = uri.split("/");

  if (templateParts.length !== uriParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < templateParts.length; i++) {
    const templatePart = templateParts[i];
    const uriPart = uriParts[i];

    if (templatePart.startsWith("{") && templatePart.endsWith("}")) {
      const paramName = templatePart.slice(1, -1);
      params[paramName] = uriPart;
    } else if (templatePart !== uriPart) {
      return null;
    }
  }

  return params;
}

/**
 * Encontra o resource que corresponde à URI
 */
function findMatchingResource(
  uri: string
): { resource: MCPResourceConfig; params: Record<string, string> } | null {
  for (const [template, resource] of resources) {
    const params = extractParams(template, uri);
    if (params !== null) {
      return { resource, params };
    }
  }
  return null;
}

/**
 * Busca um resource por URI
 */
export async function getMcpResource(uri: string): Promise<MCPResourceResult> {
  const match = findMatchingResource(uri);

  if (!match) {
    throw new Error(`Resource não encontrado: ${uri}`);
  }

  return match.resource.handler(uri, match.params);
}

/**
 * Verifica se uma URI corresponde a algum resource
 */
export function hasResource(uri: string): boolean {
  return findMatchingResource(uri) !== null;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Cria resultado de resource JSON
 */
export function jsonResourceResult(
  uri: string,
  data: unknown,
  metadata?: Record<string, unknown>
): MCPResourceResult {
  return {
    uri,
    mimeType: "application/json",
    content: JSON.stringify(data, null, 2),
    metadata,
  };
}

/**
 * Cria resultado de resource texto
 */
export function textResourceResult(
  uri: string,
  text: string,
  metadata?: Record<string, unknown>
): MCPResourceResult {
  return {
    uri,
    mimeType: "text/plain",
    content: text,
    metadata,
  };
}

/**
 * Cria resultado de resource binário
 */
export function binaryResourceResult(
  uri: string,
  buffer: Buffer,
  mimeType: string,
  metadata?: Record<string, unknown>
): MCPResourceResult {
  return {
    uri,
    mimeType,
    content: buffer,
    metadata,
  };
}
