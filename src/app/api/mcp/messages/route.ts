/**
 * Endpoint de Mensagens MCP do Synthropic
 *
 * Endpoint alternativo para comunicação MCP via requisições individuais
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMcpServerManager } from '@/lib/mcp/server';
import { registerAllTools, areToolsRegistered } from '@/lib/mcp/registry';
import { registerAllResources } from '@/lib/mcp/resources-registry';
import { registerAllPrompts } from '@/lib/mcp/prompts-registry';
import { authenticateRequest as authenticateApiRequest } from '@/lib/auth/api-auth';
import { getCachedSchema, setCachedSchema, getCachedToolList, setCachedToolList } from '@/lib/mcp/cache';
import { checkQuota, incrementQuota } from '@/lib/mcp/quotas';
import type { RateLimitTier } from '@/lib/mcp/rate-limit';

/**
 * POST /api/mcp/messages - Processa uma mensagem MCP individual
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticação (suporta x-service-api-key, Bearer JWT e cookies)
    const authResult = await authenticateApiRequest(request);
    const userId = authResult.usuarioId || null;

    // Determinar tier baseado na fonte de autenticação
    let tier: RateLimitTier = 'anonymous';
    if (authResult.source === 'service') {
      tier = 'service';
    } else if (authResult.authenticated && userId) {
      tier = 'authenticated';
    }

    // Parsear corpo
    const body = await request.json();

    // Suporte a batch de mensagens
    const messages = Array.isArray(body) ? body : [body];
    const results: unknown[] = [];

    // Garantir que as ferramentas, resources e prompts estão registrados
    if (!areToolsRegistered()) {
      await registerAllTools();
      await registerAllResources();
      await registerAllPrompts();
    }

    const manager = getMcpServerManager();

    for (const message of messages) {
      const { method, params, id } = message;

      try {
        let result: unknown;

        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
              serverInfo: manager.getServerInfo(),
            };
            break;

          case 'tools/list': {
            // Tentar buscar do cache primeiro
            const cachedTools = await getCachedToolList();
            if (cachedTools) {
              result = { tools: cachedTools };
              break;
            }

            // Converter schemas Zod para JSON Schema com cache
            const tools = await Promise.all(
              manager.listTools().map(async (tool) => {
                // Tentar buscar schema do cache
                let inputSchema = await getCachedSchema(tool.name);

                if (!inputSchema) {
                  // Converter Zod para JSON Schema
                  const jsonSchema = manager.zodToJsonSchema(tool.schema);
                  inputSchema = {
                    type: 'object' as const,
                    properties: jsonSchema.properties,
                    required: jsonSchema.required,
                  };

                  // Armazenar no cache
                  await setCachedSchema(tool.name, inputSchema);
                }

                return {
                  name: tool.name,
                  description: tool.description,
                  inputSchema,
                };
              })
            );

            // Armazenar lista completa no cache
            await setCachedToolList(tools);

            result = { tools };
            break;
          }

          case 'tools/call': {
            const { name, arguments: args } = params || {};
            const tool = manager.getTool(name);

            if (!tool) {
              results.push({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32601,
                  message: `Ferramenta não encontrada: ${name}`,
                },
              });
              continue;
            }

            // Verificar autenticação
            // Service tier (userId = 'system') é permitido para ferramentas que requerem auth
            const isAuthenticated = authResult.authenticated && (userId || authResult.source === 'service');

            if (tool.requiresAuth && !isAuthenticated) {
              const errorMessage = authResult.error || 'Autenticação necessária para esta ferramenta';
              console.error(`[MCP Messages] Ferramenta ${name} requer autenticação, mas não foi autenticado`);
              console.error(`[MCP Messages] Motivo: ${errorMessage}`);
              console.error(`[MCP Messages] Auth status: authenticated=${authResult.authenticated}, source=${authResult.source}, userId=${userId}`);
              results.push({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32600,
                  message: errorMessage,
                  data: {
                    tool: name,
                    requiresAuth: true,
                    authSource: authResult.source || null,
                  },
                },
              });
              continue;
            }

            // Verificar quota antes da execução
            const quotaCheck = await checkQuota(userId, tier);
            if (!quotaCheck.allowed) {
              results.push({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32000,
                  message: quotaCheck.reason || 'Quota excedida',
                  data: {
                    retryAfter: quotaCheck.resetAt?.toISOString(),
                    remaining: quotaCheck.remaining,
                  },
                },
              });
              continue;
            }

            result = await manager.executeTool(name, args);

            // Incrementar quota após execução bem-sucedida
            const toolResult = result as { isError?: boolean };
            if (!toolResult.isError) {
              await incrementQuota(userId, tier);
            }

            break;
          }

          case 'ping':
            result = { pong: true, timestamp: Date.now() };
            break;

          default:
            results.push({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Método não suportado: ${method}`,
              },
            });
            continue;
        }

        results.push({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (error) {
        results.push({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Erro interno',
          },
        });
      }
    }

    // Retorna array se batch, objeto único caso contrário
    return NextResponse.json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    console.error('[MCP Messages] Erro:', error);

    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Erro ao processar mensagem',
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/mcp/messages - Retorna informações do servidor
 */
export async function GET(): Promise<NextResponse> {
  const manager = getMcpServerManager();

  return NextResponse.json({
    server: manager.getServerInfo(),
    tools: manager.listTools().length,
    status: 'online',
  });
}
