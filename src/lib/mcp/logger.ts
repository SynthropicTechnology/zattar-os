/**
 * Logger estruturado para MCP do Synthropic
 *
 * Implementa logging estruturado com Pino para operações MCP,
 * incluindo métricas de performance e auditoria.
 */

import { getLogger } from '@/lib/logger';

// =============================================================================
// TIPOS
// =============================================================================

export interface MCPLogContext {
  toolName?: string;
  resourceUri?: string;
  promptName?: string;
  userId?: number;
  connectionId?: string;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MCPConnectionLog {
  connectionId: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  duration?: number;
}

// =============================================================================
// LOGGER PRINCIPAL
// =============================================================================

const mcpLogger = getLogger({ component: 'mcp' });

// =============================================================================
// LOGS DE FERRAMENTAS
// =============================================================================

/**
 * Loga chamada de ferramenta MCP
 */
export function logMcpToolCall(context: MCPLogContext): void {
  const logData = {
    event: 'mcp_tool_call',
    tool: context.toolName,
    userId: context.userId,
    connectionId: context.connectionId,
    duration: context.duration,
    success: context.success,
    ...context.metadata,
  };

  if (context.success) {
    mcpLogger.info(logData, `Tool ${context.toolName} executada com sucesso em ${context.duration}ms`);
  } else {
    mcpLogger.error(
      { ...logData, error: context.error },
      `Erro ao executar tool ${context.toolName}: ${context.error}`
    );
  }
}

/**
 * Loga início de chamada de ferramenta
 */
export function logMcpToolStart(toolName: string, connectionId?: string, userId?: number): void {
  mcpLogger.debug(
    {
      event: 'mcp_tool_start',
      tool: toolName,
      connectionId,
      userId,
    },
    `Iniciando execução de ${toolName}`
  );
}

// =============================================================================
// LOGS DE RESOURCES
// =============================================================================

/**
 * Loga acesso a resource
 */
export function logMcpResourceAccess(context: MCPLogContext): void {
  const logData = {
    event: 'mcp_resource_access',
    uri: context.resourceUri,
    userId: context.userId,
    connectionId: context.connectionId,
    duration: context.duration,
    success: context.success,
  };

  if (context.success) {
    mcpLogger.info(logData, `Resource ${context.resourceUri} acessado com sucesso`);
  } else {
    mcpLogger.error(
      { ...logData, error: context.error },
      `Erro ao acessar resource ${context.resourceUri}: ${context.error}`
    );
  }
}

// =============================================================================
// LOGS DE PROMPTS
// =============================================================================

/**
 * Loga execução de prompt
 */
export function logMcpPromptExecution(context: MCPLogContext): void {
  const logData = {
    event: 'mcp_prompt_execution',
    prompt: context.promptName,
    userId: context.userId,
    connectionId: context.connectionId,
    duration: context.duration,
    success: context.success,
  };

  if (context.success) {
    mcpLogger.info(logData, `Prompt ${context.promptName} executado com sucesso`);
  } else {
    mcpLogger.error(
      { ...logData, error: context.error },
      `Erro ao executar prompt ${context.promptName}: ${context.error}`
    );
  }
}

// =============================================================================
// LOGS DE CONEXÃO
// =============================================================================

/**
 * Loga nova conexão MCP
 */
export function logMcpConnection(log: MCPConnectionLog): void {
  mcpLogger.info(
    {
      event: 'mcp_connection',
      connectionId: log.connectionId,
      userId: log.userId,
      ip: log.ip,
      userAgent: log.userAgent,
    },
    `Nova conexão MCP estabelecida: ${log.connectionId}`
  );
}

/**
 * Loga desconexão MCP
 */
export function logMcpDisconnection(log: MCPConnectionLog): void {
  mcpLogger.info(
    {
      event: 'mcp_disconnection',
      connectionId: log.connectionId,
      userId: log.userId,
      duration: log.duration,
    },
    `Conexão MCP encerrada: ${log.connectionId} (duração: ${log.duration}ms)`
  );
}

// =============================================================================
// LOGS DE RATE LIMIT
// =============================================================================

/**
 * Loga rate limit atingido
 */
export function logMcpRateLimitHit(
  identifier: string,
  tier: string,
  resetAt: Date
): void {
  mcpLogger.warn(
    {
      event: 'mcp_rate_limit_hit',
      identifier,
      tier,
      resetAt: resetAt.toISOString(),
    },
    `Rate limit atingido para ${identifier} (tier: ${tier})`
  );
}

// =============================================================================
// LOGS DE ERRO
// =============================================================================

/**
 * Loga erro genérico MCP
 */
export function logMcpError(
  error: Error,
  context?: Record<string, unknown>
): void {
  mcpLogger.error(
    {
      event: 'mcp_error',
      error: error.message,
      stack: error.stack,
      ...context,
    },
    `Erro MCP: ${error.message}`
  );
}

/**
 * Loga erro de autenticação
 */
export function logMcpAuthError(
  reason: string,
  context?: Record<string, unknown>
): void {
  mcpLogger.warn(
    {
      event: 'mcp_auth_error',
      reason,
      ...context,
    },
    `Erro de autenticação MCP: ${reason}`
  );
}

// =============================================================================
// LOGS DE MÉTRICAS
// =============================================================================

/**
 * Loga métricas de performance
 */
export function logMcpMetrics(metrics: {
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  topTools: string[];
}): void {
  mcpLogger.info(
    {
      event: 'mcp_metrics',
      ...metrics,
    },
    `Métricas MCP: ${metrics.totalCalls} chamadas, ${(metrics.successRate * 100).toFixed(1)}% sucesso, ${metrics.avgDuration.toFixed(0)}ms avg`
  );
}

// =============================================================================
// HELPER: TIMER
// =============================================================================

/**
 * Cria timer para medir duração de operações
 */
export function createMcpTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

// =============================================================================
// WRAPPER: LOG AUTOMÁTICO
// =============================================================================

/**
 * Wrapper que adiciona logging automático a uma função
 */
export function withMcpLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  toolName: string
): T {
  return (async (...args: Parameters<T>) => {
    const timer = createMcpTimer();
    logMcpToolStart(toolName);

    try {
      const result = await fn(...args);

      logMcpToolCall({
        toolName,
        duration: timer(),
        success: true,
      });

      return result;
    } catch (error) {
      logMcpToolCall({
        toolName,
        duration: timer(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }) as T;
}
