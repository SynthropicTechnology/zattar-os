/**
 * Endpoint MCP Principal do Synthropic
 *
 * Implementa comunicação Server-Sent Events (SSE) para o protocolo MCP
 */

import { NextRequest, NextResponse } from 'next/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { getMcpServerManager } from '@/lib/mcp/server';
import { registerAllTools, areToolsRegistered } from '@/lib/mcp/registry';
import { registerAllResources } from '@/lib/mcp/resources-registry';
import { registerAllPrompts } from '@/lib/mcp/prompts-registry';
import { authenticateRequest as authenticateApiRequest } from '@/lib/auth/api-auth';
import { checkEndpointRateLimit, checkToolRateLimit, getRateLimitHeaders, type RateLimitTier } from '@/lib/mcp/rate-limit';
import { getClientIp } from '@/lib/utils/get-client-ip';
import { recordSuspiciousActivity } from '@/lib/security/ip-blocking';
import { logMcpConnection } from '@/lib/mcp/logger';
import { getCachedSchema, setCachedSchema, getCachedToolList, setCachedToolList } from '@/lib/mcp/cache';
import { checkQuota, incrementQuota } from '@/lib/mcp/quotas';
import { getCorsHeaders, getPreflightCorsHeaders } from '@/lib/cors/config';

// Armazena conexões ativas
const activeConnections = new Map<string, {
  transport: SSEServerTransport;
  userId: number | null;
  connectedAt: Date;
}>();

/**
 * GET /api/mcp - Inicia conexão SSE com o servidor MCP
 */
export async function GET(request: NextRequest): Promise<Response> {
  console.log('[MCP API] Nova conexão SSE recebida');

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

  // Obter identificador para rate limit (IP ou userId)
  const identifier = userId?.toString() || getClientIp(request);

  // Computar headers CORS antes do rate-limit check
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Verificar rate limit para conexões
  const rateLimitResult = await checkEndpointRateLimit(identifier, '/api/mcp', tier);
  if (!rateLimitResult.allowed) {
    console.log(`[MCP API] Rate limit excedido para ${identifier}`);

    // Record suspicious activity for rate limit abuse
    await recordSuspiciousActivity(getClientIp(request), 'rate_limit_abuse', '/api/mcp GET');

    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
          ...corsHeaders,
        },
      }
    );
  }

  // Log da conexão
  logMcpConnection({ 
    connectionId: crypto.randomUUID(),
    userId: userId || undefined,
    connectedAt: new Date(),
  });

  if (!userId) {
    console.log('[MCP API] Conexão anônima - acesso limitado');
  } else {
    console.log(`[MCP API] Conexão autenticada - usuário ${userId}`);
  }

  // Garantir que as ferramentas, resources e prompts estão registrados
  if (!areToolsRegistered()) {
    console.log('[MCP API] Registrando ferramentas...');
    await registerAllTools();
    console.log('[MCP API] Registrando resources...');
    await registerAllResources();
    console.log('[MCP API] Registrando prompts...');
    await registerAllPrompts();
  }

  // Gerar ID único para esta conexão
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Criar resposta SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      // Enviar evento de conexão estabelecida
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        connectionId,
        server: getMcpServerManager().getServerInfo(),
        authenticated: !!userId,
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Configurar ping para manter conexão viva
      const pingInterval = setInterval(() => {
        if (isClosed) return;
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          clearInterval(pingInterval);
          isClosed = true;
        }
      }, 30000); // Ping a cada 30 segundos

      // Cleanup quando a conexão for fechada
      request.signal.addEventListener('abort', () => {
        console.log(`[MCP API] Conexão ${connectionId} encerrada`);
        clearInterval(pingInterval);
        activeConnections.delete(connectionId);
        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Stream já foi fechado pelo runtime
          }
        }
      });

      // Armazenar conexão
      activeConnections.set(connectionId, {
        transport: null as unknown as SSEServerTransport, // Será configurado via POST
        userId,
        connectedAt: new Date(),
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilita buffering no nginx
      'X-Connection-Id': connectionId,
      ...corsHeaders,
    },
  });
}

/**
 * POST /api/mcp - Recebe mensagens MCP e executa ferramentas
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[MCP API] Mensagem POST recebida');

  // Obter origem para CORS
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

    // Obter identificador para rate limit
    const identifier = userId?.toString() || getClientIp(request);

    // Verificar rate limit geral
    const rateLimitResult = await checkEndpointRateLimit(identifier, '/api/mcp', tier);
    if (!rateLimitResult.allowed) {
      console.log(`[MCP API] Rate limit excedido para ${identifier}`);

      // Record suspicious activity for rate limit abuse
      await recordSuspiciousActivity(getClientIp(request), 'rate_limit_abuse', '/api/mcp POST');

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: 'Rate limit exceeded',
            data: { retryAfter: rateLimitResult.resetAt.toISOString() },
          },
        },
        {
          status: 429,
          headers: { ...getRateLimitHeaders(rateLimitResult), ...corsHeaders },
        }
      );
    }

    // Parsear corpo da requisição
    const body = await request.json();
    const { method, params, id } = body;

    console.log(`[MCP API] Método: ${method}, ID: ${id}`);

    // Garantir que as ferramentas, resources e prompts estão registrados
    if (!areToolsRegistered()) {
      await registerAllTools();
      await registerAllResources();
      await registerAllPrompts();
    }

    const manager = getMcpServerManager();

    // Roteamento de métodos MCP
    switch (method) {
      case 'initialize': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: manager.getServerInfo(),
          },
        }, { headers: corsHeaders });
      }

      case 'tools/list': {
        // Tentar buscar do cache primeiro
        const cachedTools = await getCachedToolList();
        if (cachedTools) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: { tools: cachedTools },
          }, { headers: corsHeaders });
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

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { tools },
        }, { headers: corsHeaders });
      }

      case 'tools/call': {
        const { name, arguments: args } = params || {};

        // Verificar se a ferramenta requer autenticação
        const tool = manager.getTool(name);
        if (!tool) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Ferramenta não encontrada: ${name}`,
            },
          }, { headers: corsHeaders });
        }

        // Verificar autenticação
        // Service tier (userId = 'system') é permitido para ferramentas que requerem auth
        const isAuthenticated = authResult.authenticated && (userId || authResult.source === 'service');

        if (tool.requiresAuth && !isAuthenticated) {
          const errorMessage = authResult.error || 'Autenticação necessária para esta ferramenta';
          console.error(`[MCP API] Ferramenta ${name} requer autenticação, mas não foi autenticado`);
          console.error(`[MCP API] Motivo: ${errorMessage}`);
          console.error(`[MCP API] Auth status: authenticated=${authResult.authenticated}, source=${authResult.source}, userId=${userId}`);
          return NextResponse.json({
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
          }, { status: 401, headers: corsHeaders });
        }

        // Verificar quota antes da execução
        const quotaCheck = await checkQuota(userId, tier);
        if (!quotaCheck.allowed) {
          console.log(`[MCP API] Quota excedida para usuário ${userId}`);
          return NextResponse.json(
            {
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
            },
            { status: 429, headers: corsHeaders }
          );
        }

        // Verificar rate limit específico para a ferramenta
        const toolRateLimit = await checkToolRateLimit(identifier, name, tier);
        if (!toolRateLimit.allowed) {
          console.log(`[MCP API] Rate limit de ferramenta excedido: ${name}`);
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32000,
                message: `Rate limit exceeded for tool: ${name}`,
                data: { retryAfter: toolRateLimit.resetAt.toISOString() },
              },
            },
            {
              status: 429,
              headers: { ...getRateLimitHeaders(toolRateLimit), ...corsHeaders },
            }
          );
        }

        // Executar ferramenta
        const result = await manager.executeTool(name, args);

        // Incrementar quota após execução bem-sucedida
        if (!result.isError) {
          await incrementQuota(userId, tier);
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result,
        }, { headers: corsHeaders });
      }

      case 'notifications/initialized': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {},
        }, { headers: corsHeaders });
      }

      default: {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Método não suportado: ${method}`,
          },
        }, { headers: corsHeaders });
      }
    }
  } catch (error) {
    console.error('[MCP API] Erro ao processar mensagem:', error);

    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * OPTIONS /api/mcp - Suporte a CORS (Preflight Request)
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  const corsHeaders = getPreflightCorsHeaders(origin);

  return new NextResponse(null, {
    headers: corsHeaders,
  });
}
