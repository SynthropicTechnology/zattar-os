/**
 * Cache de Schemas MCP do Synthropic
 *
 * Implementa cache Redis para schemas de tools MCP,
 * melhorando performance de listagem de ferramentas.
 */

import { getCached, setCached, deleteCached, deletePattern } from "@/lib/redis";

// =============================================================================
// CONSTANTES
// =============================================================================

const MCP_CACHE_PREFIX = "mcp:";
const SCHEMA_CACHE_TTL = 3600; // 1 hora
const TOOL_LIST_CACHE_TTL = 300; // 5 minutos

// =============================================================================
// CACHE DE SCHEMAS
// =============================================================================

/**
 * Gera chave de cache para schema de tool
 */
function getSchemaKey(toolName: string): string {
  return `${MCP_CACHE_PREFIX}schema:${toolName}`;
}

/**
 * Busca schema de tool no cache
 */
export async function getCachedSchema(
  toolName: string
): Promise<object | null> {
  const key = getSchemaKey(toolName);
  return getCached<object>(key);
}

/**
 * Armazena schema de tool no cache
 */
export async function setCachedSchema(
  toolName: string,
  schema: object
): Promise<void> {
  const key = getSchemaKey(toolName);
  await setCached(key, schema, SCHEMA_CACHE_TTL);
}

/**
 * Invalida cache de schema de tool específica
 */
export async function invalidateSchemaCache(toolName?: string): Promise<void> {
  if (toolName) {
    await deleteCached(getSchemaKey(toolName));
  } else {
    // Invalidar todos os schemas
    await deletePattern(`${MCP_CACHE_PREFIX}schema:*`);
  }
}

// =============================================================================
// CACHE DE LISTA DE TOOLS
// =============================================================================

/**
 * Busca lista de tools no cache
 */
export async function getCachedToolList(): Promise<object[] | null> {
  return getCached<object[]>(`${MCP_CACHE_PREFIX}tools:list`);
}

/**
 * Armazena lista de tools no cache
 */
export async function setCachedToolList(tools: object[]): Promise<void> {
  await setCached(`${MCP_CACHE_PREFIX}tools:list`, tools, TOOL_LIST_CACHE_TTL);
}

/**
 * Invalida cache de lista de tools
 */
export async function invalidateToolListCache(): Promise<void> {
  await deleteCached(`${MCP_CACHE_PREFIX}tools:list`);
}

// =============================================================================
// CACHE DE RESOURCES
// =============================================================================

/**
 * Gera chave de cache para resource
 */
function getResourceKey(uri: string): string {
  return `${MCP_CACHE_PREFIX}resource:${encodeURIComponent(uri)}`;
}

/**
 * Busca resource no cache
 */
export async function getCachedResource<T>(uri: string): Promise<T | null> {
  const key = getResourceKey(uri);
  return getCached<T>(key);
}

/**
 * Armazena resource no cache
 */
export async function setCachedResource<T>(
  uri: string,
  data: T,
  ttl: number = 300
): Promise<void> {
  const key = getResourceKey(uri);
  await setCached(key, data, ttl);
}

/**
 * Invalida cache de resource
 */
export async function invalidateResourceCache(uri?: string): Promise<void> {
  if (uri) {
    await deleteCached(getResourceKey(uri));
  } else {
    await deletePattern(`${MCP_CACHE_PREFIX}resource:*`);
  }
}

// =============================================================================
// CACHE DE MÉTRICAS
// =============================================================================

/**
 * Incrementa contador de chamadas de tool
 */
export async function incrementToolCallCount(toolName: string): Promise<void> {
  const key = `${MCP_CACHE_PREFIX}metrics:calls:${toolName}`;
  const current = (await getCached<number>(key)) || 0;
  await setCached(key, current + 1, 86400); // 24 horas
}

/**
 * Registra duração de chamada de tool
 */
export async function recordToolDuration(
  toolName: string,
  durationMs: number
): Promise<void> {
  const key = `${MCP_CACHE_PREFIX}metrics:duration:${toolName}`;
  const current = (await getCached<number[]>(key)) || [];

  // Manter últimas 100 durações
  const updated = [...current.slice(-99), durationMs];
  await setCached(key, updated, 86400);
}

/**
 * Obtém métricas agregadas de tools
 */
export async function getToolMetrics(): Promise<
  Record<string, { calls: number; avgDuration: number }>
> {
  const metrics: Record<string, { calls: number; avgDuration: number }> = {};

  // Esta é uma implementação simplificada
  // Em produção, usar SCAN para iterar sobre keys
  return metrics;
}

// =============================================================================
// INVALIDAÇÃO EM LOTE
// =============================================================================

/**
 * Invalida todo o cache MCP
 */
export async function invalidateAllMcpCache(): Promise<void> {
  await deletePattern(`${MCP_CACHE_PREFIX}*`);
  console.log("[MCP Cache] Todo o cache MCP foi invalidado");
}

/**
 * Aquece o cache com dados frequentemente acessados
 */
export async function warmupCache(): Promise<void> {
  console.log("[MCP Cache] Iniciando warmup do cache...");

  // Aqui poderíamos pré-carregar schemas de tools mais usadas
  // e recursos frequentemente acessados

  console.log("[MCP Cache] Warmup concluído");
}
