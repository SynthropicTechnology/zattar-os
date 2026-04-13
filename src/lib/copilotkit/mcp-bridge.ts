/**
 * MCP Bridge para CopilotKit v2
 *
 * Converte ferramentas MCP em ToolDefinition[] para o BuiltInAgent.
 * Usa Zod schemas nativamente (sem conversão manual de parâmetros).
 *
 * v2 simplifica drasticamente: `defineTool()` aceita Zod diretamente,
 * então a bridge agora é apenas um wrapper fino sobre o MCP registry.
 */

import { defineTool } from '@copilotkit/runtime/v2';
import type { MCPToolConfig } from '@/lib/mcp/types';
import { resolveToolPermission } from '@/lib/mcp/permission-map';
import { checkPermission } from '@/lib/auth/authorization';
import { createServiceClient } from '@/lib/supabase/service-client';

// ─── Tools destrutivas ──────────────────────────────────────────────

const DESTRUCTIVE_TOOLS = new Set([
  'excluir_conta',
  'excluir_lancamento',
  'cancelar_lancamento',
  'estornar_lancamento',
  'excluir_contrato',
  'resetar_senha',
  'desconciliar',
]);

// ─── Super Admin Check ─────────────────────────────────────────────

async function isSuperAdmin(usuarioId: number): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('usuarios')
    .select('is_super_admin')
    .eq('id', usuarioId)
    .single();
  return data?.is_super_admin ?? false;
}

// ─── Bridge Principal ───────────────────────────────────────────────

/**
 * Garante que as ferramentas MCP estão registradas.
 * Deve ser chamado ANTES de criar o BuiltInAgent.
 * É idempotente — seguro chamar múltiplas vezes.
 */
export async function ensureMcpToolsRegistered(): Promise<void> {
  const { registerAllTools, areToolsRegistered } = await import('@/lib/mcp/registry');
  if (!areToolsRegistered()) {
    await registerAllTools();
  }
}

/**
 * Converte todas as ferramentas MCP em ToolDefinition[] para o BuiltInAgent v2.
 * Usa Zod schemas nativamente — zero conversão manual.
 *
 * REQUER que ensureMcpToolsRegistered() tenha sido chamado antes.
 */
export function getMcpToolsAsDefinitions() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { listMcpTools, executeMcpTool } = require('@/lib/mcp/server') as {
    listMcpTools: () => MCPToolConfig[];
    executeMcpTool: (name: string, args: unknown) => Promise<{ content: { type: string; text?: string }[]; isError?: boolean; structuredContent?: Record<string, unknown> }>;
  };

  const allTools = listMcpTools();

  return allTools.map((tool) => {
    const isDestructive = DESTRUCTIVE_TOOLS.has(tool.name);
    const description = isDestructive
      ? `${tool.description}. ATENÇÃO: Ação destrutiva — use confirmar_acao ANTES de executar.`
      : tool.description;

    return defineTool({
      name: tool.name,
      description,
      parameters: tool.schema,
      execute: async (args: unknown) => {
        try {
          const result = await executeMcpTool(tool.name, args);

          if (result.isError) {
            const errorText = result.content
              .filter((c: { type: string }) => c.type === 'text')
              .map((c: { text?: string }) => c.text)
              .join('\n');
            return { error: true, message: errorText };
          }

          if (result.structuredContent) {
            return result.structuredContent;
          }

          const text = result.content
            .filter((c: { type: string }) => c.type === 'text')
            .map((c: { text?: string }) => c.text)
            .join('\n');

          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        } catch (error) {
          return {
            error: true,
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          };
        }
      },
    });
  });
}

/**
 * Filtra e converte ferramentas MCP para um usuário específico.
 * Aplica filtragem por permissão antes de converter para ToolDefinition[].
 *
 * Lógica:
 * - 'public' → sempre incluída
 * - 'admin' → incluída apenas se is_super_admin
 * - { recurso, operacao } → incluída se checkPermission() retorna true
 *
 * REQUER que ensureMcpToolsRegistered() tenha sido chamado antes.
 */
export async function getMcpToolsForUser(usuarioId: number) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { listMcpTools, executeMcpTool } = require('@/lib/mcp/server') as {
    listMcpTools: () => MCPToolConfig[];
    executeMcpTool: (name: string, args: unknown) => Promise<{ content: { type: string; text?: string }[]; isError?: boolean; structuredContent?: Record<string, unknown> }>;
  };

  const allTools = listMcpTools();
  const isAdmin = await isSuperAdmin(usuarioId);

  // Resolve permissões em paralelo
  const toolChecks = await Promise.all(
    allTools.map(async (tool) => {
      const perm = resolveToolPermission(tool);

      if (perm.type === 'public') return { tool, allowed: true };
      if (perm.type === 'admin') return { tool, allowed: isAdmin };
      // perm.type === 'check'
      const allowed = await checkPermission(usuarioId, perm.recurso, perm.operacao);
      return { tool, allowed };
    })
  );

  const allowedTools = toolChecks
    .filter((tc) => tc.allowed)
    .map((tc) => tc.tool);

  console.log(
    `[MCP Bridge] Usuário ${usuarioId}: ${allowedTools.length}/${allTools.length} tools autorizadas`
  );

  // Converter para ToolDefinition[] (mesma lógica de getMcpToolsAsDefinitions)
  return allowedTools.map((tool) => {
    const isDestructive = DESTRUCTIVE_TOOLS.has(tool.name);
    const description = isDestructive
      ? `${tool.description}. ATENÇÃO: Ação destrutiva — use confirmar_acao ANTES de executar.`
      : tool.description;

    return defineTool({
      name: tool.name,
      description,
      parameters: tool.schema,
      execute: async (args: unknown) => {
        try {
          const result = await executeMcpTool(tool.name, args);

          if (result.isError) {
            const errorText = result.content
              .filter((c: { type: string }) => c.type === 'text')
              .map((c: { text?: string }) => c.text)
              .join('\n');
            return { error: true, message: errorText };
          }

          if (result.structuredContent) {
            return result.structuredContent;
          }

          const text = result.content
            .filter((c: { type: string }) => c.type === 'text')
            .map((c: { text?: string }) => c.text)
            .join('\n');

          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        } catch (error) {
          return {
            error: true,
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          };
        }
      },
    });
  });
}
