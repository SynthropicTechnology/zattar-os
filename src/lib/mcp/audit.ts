/**
 * Auditoria de chamadas MCP do Synthropic
 *
 * Registra todas as chamadas MCP para fins de auditoria,
 * conformidade e análise de uso.
 */

import { createClient } from '@/lib/supabase/server';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

// =============================================================================
// TIPOS
// =============================================================================

export interface MCPAuditEntry {
  toolName?: string;
  resourceUri?: string;
  promptName?: string;
  userId?: number;
  connectionId?: string;
  arguments?: unknown;
  result?: unknown;
  success: boolean;
  errorMessage?: string;
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface MCPAuditQueryParams {
  toolName?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

// =============================================================================
// AUDITORIA
// =============================================================================

/**
 * Registra uma chamada MCP no log de auditoria
 */
export async function auditMcpCall(entry: MCPAuditEntry): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('mcp_audit_log').insert({
      tool_name: entry.toolName,
      resource_uri: entry.resourceUri,
      prompt_name: entry.promptName,
      usuario_id: entry.userId,
      connection_id: entry.connectionId,
      arguments: sanitizeForLogs(entry.arguments),
      result: sanitizeForLogs(entry.result),
      success: entry.success,
      error_message: entry.errorMessage,
      duration_ms: entry.durationMs,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });
  } catch (error) {
    // Não falhar a operação principal se auditoria falhar
    console.error('[MCP Audit] Erro ao registrar auditoria:', error);
  }
}

/**
 * Consulta log de auditoria
 */
export async function queryMcpAudit(params: MCPAuditQueryParams): Promise<{
  entries: MCPAuditEntry[];
  total: number;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('mcp_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.toolName) {
      query = query.eq('tool_name', params.toolName);
    }

    if (params.userId) {
      query = query.eq('usuario_id', params.userId);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    if (params.success !== undefined) {
      query = query.eq('success', params.success);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const entries: MCPAuditEntry[] = (data || []).map((row) => ({
      toolName: row.tool_name,
      resourceUri: row.resource_uri,
      promptName: row.prompt_name,
      userId: row.usuario_id,
      connectionId: row.connection_id,
      arguments: row.arguments,
      result: row.result,
      success: row.success,
      errorMessage: row.error_message,
      durationMs: row.duration_ms,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }));

    return {
      entries,
      total: count || 0,
    };
  } catch (error) {
    console.error('[MCP Audit] Erro ao consultar auditoria:', error);
    return {
      entries: [],
      total: 0,
    };
  }
}

// =============================================================================
// ESTATÍSTICAS
// =============================================================================

/**
 * Obtém estatísticas de uso MCP
 */
export async function getMcpUsageStats(params?: {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
}): Promise<{
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  topTools: Array<{ name: string; count: number }>;
  errorsByTool: Array<{ name: string; count: number }>;
}> {
  try {
    const supabase = await createClient();

    // Query para estatísticas gerais
    let statsQuery = supabase.from('mcp_audit_log').select('*');

    if (params?.startDate) {
      statsQuery = statsQuery.gte('created_at', params.startDate.toISOString());
    }

    if (params?.endDate) {
      statsQuery = statsQuery.lte('created_at', params.endDate.toISOString());
    }

    if (params?.userId) {
      statsQuery = statsQuery.eq('usuario_id', params.userId);
    }

    const { data: entries } = await statsQuery;

    if (!entries || entries.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        avgDuration: 0,
        topTools: [],
        errorsByTool: [],
      };
    }

    // Calcular estatísticas
    const totalCalls = entries.length;
    const successCount = entries.filter((e) => e.success).length;
    const successRate = successCount / totalCalls;
    const avgDuration =
      entries.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / totalCalls;

    // Top tools
    const toolCounts: Record<string, number> = {};
    const toolErrors: Record<string, number> = {};

    for (const entry of entries) {
      const name = entry.tool_name || 'unknown';
      toolCounts[name] = (toolCounts[name] || 0) + 1;
      if (!entry.success) {
        toolErrors[name] = (toolErrors[name] || 0) + 1;
      }
    }

    const topTools = Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const errorsByTool = Object.entries(toolErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalCalls,
      successRate,
      avgDuration,
      topTools,
      errorsByTool,
    };
  } catch (error) {
    console.error('[MCP Audit] Erro ao obter estatísticas:', error);
    return {
      totalCalls: 0,
      successRate: 0,
      avgDuration: 0,
      topTools: [],
      errorsByTool: [],
    };
  }
}

// =============================================================================
// LIMPEZA
// =============================================================================

/**
 * Remove entradas antigas do log de auditoria
 */
export async function cleanupOldAuditEntries(daysToKeep: number = 90): Promise<number> {
  try {
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { count } = await supabase
      .from('mcp_audit_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('*');

    console.log(`[MCP Audit] Removidas ${count || 0} entradas antigas`);
    return count || 0;
  } catch (error) {
    console.error('[MCP Audit] Erro ao limpar entradas antigas:', error);
    return 0;
  }
}
