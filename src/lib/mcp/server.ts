/**
 * Servidor MCP do Synthropic
 *
 * Configuração singleton do McpServer para exposição de ferramentas
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { MCPToolConfig, MCPServerConfig, MCPToolResult } from "./types";
import { listMcpResources, getMcpResource } from "./resources";
import { listMcpPrompts, getMcpPrompt } from "./prompts";
import {
  logMcpToolCall,
  logMcpResourceAccess,
  logMcpPromptExecution,
  createMcpTimer,
} from "./logger";
import { auditMcpCall } from "./audit";

/**
 * Configuração do servidor MCP Synthropic
 */
const SERVER_CONFIG: MCPServerConfig = {
  info: {
    name: "synthropic-api",
    version: "2.0.0",
    description: "API MCP do Synthropic - Sistema de Gestão Jurídica",
  },
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
  },
};

/**
 * Classe para gerenciar o servidor MCP
 */
class MCPServerManager {
  private server: Server | null = null;
  private tools: Map<string, MCPToolConfig<unknown>> = new Map();
  private isInitialized: boolean = false;

  /**
   * Obtém ou cria a instância do servidor
   */
  getServer(): Server {
    if (!this.server) {
      this.server = new Server(
        {
          name: SERVER_CONFIG.info.name,
          version: SERVER_CONFIG.info.version,
        },
        {
          capabilities: {
            tools: SERVER_CONFIG.capabilities.tools ? {} : undefined,
            resources: SERVER_CONFIG.capabilities.resources ? {} : undefined,
            prompts: SERVER_CONFIG.capabilities.prompts ? {} : undefined,
          },
        }
      );

      this.setupHandlers();
    }

    return this.server;
  }

  /**
   * Configura os handlers do servidor
   */
  private setupHandlers(): void {
    if (!this.server) return;

    // =========================================================================
    // HANDLERS DE TOOLS
    // =========================================================================

    // Handler para listar ferramentas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList: Tool[] = Array.from(this.tools.values()).map((tool) => {
        const jsonSchema = this.zodToJsonSchema(tool.schema);
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: "object" as const,
            properties: jsonSchema.properties,
            required: jsonSchema.required,
          },
        };
      });

      return { tools: toolsList };
    });

    // Handler para chamar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const timer = createMcpTimer();

      const tool = this.tools.get(name);
      if (!tool) {
        logMcpToolCall({
          toolName: name,
          success: false,
          error: "Ferramenta não encontrada",
        });
        return {
          content: [
            { type: "text", text: `Ferramenta não encontrada: ${name}` },
          ],
          isError: true,
        } as {
          content: Array<{ type: "text"; text: string }>;
          isError: boolean;
        };
      }

      try {
        // Validar argumentos com Zod
        const validatedArgs = tool.schema.parse(args);

        // Executar handler
        const result = await tool.handler(validatedArgs);
        const duration = timer();

        // Log e auditoria
        logMcpToolCall({ toolName: name, duration, success: !result.isError });
        auditMcpCall({
          toolName: name,
          arguments: validatedArgs,
          result: result.content,
          success: !result.isError,
          durationMs: duration,
        });

        // Retornar resultado compatível com SDK
        return {
          content: result.content,
          ...(result.isError !== undefined && { isError: result.isError }),
          ...(result.structuredContent !== undefined && {
            structuredContent: result.structuredContent,
          }),
        };
      } catch (error) {
        const duration = timer();
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";

        console.error(`[MCP] Erro ao executar ferramenta ${name}:`, error);
        logMcpToolCall({
          toolName: name,
          duration,
          success: false,
          error: errorMessage,
        });
        auditMcpCall({
          toolName: name,
          arguments: args,
          success: false,
          errorMessage,
          durationMs: duration,
        });

        return {
          content: [
            {
              type: "text",
              text: `Erro ao executar ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        } as {
          content: Array<{ type: "text"; text: string }>;
          isError: boolean;
        };
      }
    });

    // =========================================================================
    // HANDLERS DE RESOURCES
    // =========================================================================

    // Handler para listar resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourcesList = listMcpResources().map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      }));
      return { resources: resourcesList };
    });

    // Handler para ler resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;
        const timer = createMcpTimer();

        try {
          const resource = await getMcpResource(uri);
          const duration = timer();

          logMcpResourceAccess({ resourceUri: uri, duration, success: true });

          return {
            contents: [
              {
                uri: resource.uri,
                mimeType: resource.mimeType,
                text:
                  typeof resource.content === "string"
                    ? resource.content
                    : resource.content.toString("base64"),
              },
            ],
          };
        } catch (error) {
          const duration = timer();
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";

          logMcpResourceAccess({
            resourceUri: uri,
            duration,
            success: false,
            error: errorMessage,
          });

          throw error;
        }
      }
    );

    // =========================================================================
    // HANDLERS DE PROMPTS
    // =========================================================================

    // Handler para listar prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const promptsList = listMcpPrompts().map((p) => ({
        name: p.name,
        description: p.description,
      }));
      return { prompts: promptsList };
    });

    // Handler para obter prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const timer = createMcpTimer();

      try {
        const result = await getMcpPrompt(name, args);
        const duration = timer();

        logMcpPromptExecution({ promptName: name, duration, success: true });

        return {
          messages: result.messages.map((m) => ({
            role: m.role,
            content: { type: "text" as const, text: m.content },
          })),
          description: result.description,
        };
      } catch (error) {
        const duration = timer();
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";

        logMcpPromptExecution({
          promptName: name,
          duration,
          success: false,
          error: errorMessage,
        });

        throw error;
      }
    });
  }

  /**
   * Converte schema Zod para JSON Schema (simplificado)
   */
  zodToJsonSchema(schema: MCPToolConfig["schema"]): {
    type: "object";
    properties: { [x: string]: object };
    required?: string[];
  } {
    // Usa o método _def do Zod para extrair informações
    const def = (
      schema as {
        _def?: { typeName?: string; shape?: () => Record<string, unknown> };
      }
    )._def;

    if (def?.typeName === "ZodObject" && def.shape) {
      const shape = def.shape();
      const properties: { [x: string]: object } = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldDef = (
          value as {
            _def?: {
              typeName?: string;
              description?: string;
              defaultValue?: () => unknown;
            };
          }
        )._def;
        const isOptional =
          fieldDef?.typeName === "ZodOptional" ||
          fieldDef?.defaultValue !== undefined;

        properties[key] = {
          type: this.zodTypeToJsonType(fieldDef?.typeName),
          description: fieldDef?.description || key,
        } as object;

        if (!isOptional) {
          required.push(key);
        }
      }

      return {
        type: "object" as const,
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    // Fallback genérico
    return {
      type: "object" as const,
      properties: {} as { [x: string]: object },
    };
  }

  /**
   * Mapeia tipo Zod para tipo JSON Schema
   */
  private zodTypeToJsonType(zodType?: string): string {
    const typeMap: Record<string, string> = {
      ZodString: "string",
      ZodNumber: "number",
      ZodBoolean: "boolean",
      ZodArray: "array",
      ZodObject: "object",
      ZodOptional: "string", // Simplificação
      ZodDefault: "string", // Simplificação
    };

    return typeMap[zodType || ""] || "string";
  }

  /**
   * Registra uma ferramenta no servidor
   */
  registerTool(config: MCPToolConfig<unknown>): void {
    this.tools.set(config.name, config as MCPToolConfig<unknown>);
    console.log(`[MCP] Ferramenta registrada: ${config.name}`);
  }

  /**
   * Remove uma ferramenta do servidor
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
    console.log(`[MCP] Ferramenta removida: ${name}`);
  }

  /**
   * Lista todas as ferramentas registradas
   */
  listTools(): MCPToolConfig<unknown>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Obtém uma ferramenta pelo nome
   */
  getTool(name: string): MCPToolConfig<unknown> | undefined {
    return this.tools.get(name);
  }

  /**
   * Verifica se o servidor está inicializado
   */
  isServerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Marca o servidor como inicializado
   */
  setInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Obtém informações do servidor
   */
  getServerInfo(): MCPServerConfig["info"] {
    return SERVER_CONFIG.info;
  }

  /**
   * Executa uma ferramenta diretamente (para uso interno)
   */
  async executeTool(name: string, args: unknown): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Ferramenta não encontrada: ${name}` }],
        isError: true,
      };
    }

    try {
      const validatedArgs = tool.schema.parse(args);
      return await tool.handler(validatedArgs);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
}

// Instância singleton
const mcpServerManager = new MCPServerManager();

/**
 * Obtém a instância do servidor MCP
 */
export function getMcpServer(): Server {
  return mcpServerManager.getServer();
}

/**
 * Obtém o gerenciador do servidor MCP
 */
export function getMcpServerManager(): MCPServerManager {
  return mcpServerManager;
}

/**
 * Registra uma ferramenta no servidor MCP
 */
export function registerMcpTool<TArgs>(config: MCPToolConfig<TArgs>): void {
  mcpServerManager.registerTool(config as MCPToolConfig<unknown>);
}

/**
 * Executa uma ferramenta MCP
 */
export async function executeMcpTool(
  name: string,
  args: unknown
): Promise<MCPToolResult> {
  return mcpServerManager.executeTool(name, args);
}

/**
 * Lista todas as ferramentas MCP registradas
 */
export function listMcpTools(): MCPToolConfig[] {
  return mcpServerManager.listTools();
}

/**
 * Inicia o servidor MCP via stdio (para CLI)
 */
export async function startMcpServerStdio(): Promise<void> {
  const server = getMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.log(
    `[MCP] Servidor ${SERVER_CONFIG.info.name} v${SERVER_CONFIG.info.version} iniciado via stdio`
  );
}

export { mcpServerManager };
