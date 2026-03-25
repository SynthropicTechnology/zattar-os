/**
 * MCP Bridge para CopilotKit
 *
 * Converte ferramentas MCP registradas no MCPServerManager em
 * backend actions do CopilotKit. Executa no mesmo processo Node.js,
 * sem overhead de rede.
 *
 * Fluxo:
 * 1. Garante que as tools MCP estão registradas (registerAllTools)
 * 2. Lê todas as tools do MCPServerManager singleton
 * 3. Converte cada Zod schema → CopilotKit parameter[]
 * 4. Wraps cada handler para retornar string (CopilotKit espera string/object)
 * 5. Opcionalmente filtra por feature/URL
 */

import type { MCPToolConfig } from '@/lib/mcp/types';

// ─── Tipos CopilotKit ──────────────────────────────────────────────

interface CopilotKitParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'string[]' | 'number[]' | 'boolean[]' | 'object[]';
  description: string;
  required: boolean;
  enum?: string[];
}

interface CopilotKitAction {
  name: string;
  description: string;
  parameters: CopilotKitParameter[];
  handler: (args: Record<string, unknown>) => Promise<string | object>;
}

// ─── Mapeamento URL → Features MCP ─────────────────────────────────

const URL_FEATURE_MAP: Record<string, string[]> = {
  '/app/processos': ['processos', 'partes', 'busca-semantica'],
  '/app/audiencias': ['audiencias'],
  '/app/expedientes': ['expedientes'],
  '/app/financeiro': ['financeiro'],
  '/app/contratos': ['contratos'],
  '/app/documentos': ['documentos', 'busca-semantica', 'captura'],
  '/app/dashboard': ['dashboard', 'financeiro'],
  '/app/tarefas': ['tarefas'],
  '/app/chat': ['chat'],
  '/app/rh': ['rh', 'cargos'],
  '/app/usuarios': ['usuarios'],
  '/app/pericias': ['pericias'],
  '/app/partes': ['partes'],
  '/app/assistentes': ['assistentes'],
  '/app/captura': ['captura'],
  '/app/acordos-condenacoes': ['processos', 'partes'],
  '/app/assinatura-digital': ['assinatura-digital', 'documentos'],
};

/**
 * Features que devem estar SEMPRE disponíveis, independente da URL
 */
const GLOBAL_FEATURES = [
  'processos',
  'audiencias',
  'expedientes',
  'dashboard',
  'partes',
  'tarefas',
  'busca-semantica',
];

/**
 * Tools destrutivas que devem ser sinalizadas no prompt
 * (para que o LLM peça confirmação ao usuário antes de executar)
 */
const DESTRUCTIVE_TOOLS = new Set([
  'excluir_conta',
  'excluir_lancamento',
  'cancelar_lancamento',
  'estornar_lancamento',
  'excluir_contrato',
  'resetar_senha',
  'desconciliar',
]);

// ─── Conversão Zod → CopilotKit Parameters ─────────────────────────

/**
 * Mapeia typeName do Zod para tipo CopilotKit
 */
function zodTypeToParamType(typeName?: string): CopilotKitParameter['type'] {
  const map: Record<string, CopilotKitParameter['type']> = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodArray: 'string[]',
    ZodObject: 'object',
    ZodEnum: 'string',
    ZodNativeEnum: 'string',
    ZodLiteral: 'string',
    ZodUnion: 'string',
    ZodOptional: 'string',
    ZodDefault: 'string',
    ZodNullable: 'string',
  };
  return map[typeName || ''] || 'string';
}

/**
 * Resolve o tipo inner de wrappers Zod (ZodOptional, ZodDefault, ZodNullable)
 */
function resolveInnerType(def: Record<string, unknown>): {
  typeName: string;
  description?: string;
  values?: string[];
} {
  const typeName = def.typeName as string;

  // Unwrap ZodOptional / ZodDefault / ZodNullable
  if (
    (typeName === 'ZodOptional' || typeName === 'ZodDefault' || typeName === 'ZodNullable') &&
    def.innerType
  ) {
    const inner = (def.innerType as { _def?: Record<string, unknown> })._def;
    if (inner) {
      const resolved = resolveInnerType(inner as Record<string, unknown>);
      return { ...resolved, description: (def.description as string) || resolved.description };
    }
  }

  // ZodEnum - extract values
  if (typeName === 'ZodEnum' && def.values) {
    return {
      typeName,
      description: def.description as string,
      values: def.values as string[],
    };
  }

  // ZodUnion (e.g. z.union([z.string(), z.array(z.string())]))
  if (typeName === 'ZodUnion') {
    return { typeName: 'ZodString', description: def.description as string };
  }

  return { typeName, description: def.description as string };
}

/**
 * Converte um Zod schema para array de parâmetros CopilotKit
 */
function zodSchemaToParameters(schema: MCPToolConfig['schema']): CopilotKitParameter[] {
  const params: CopilotKitParameter[] = [];

  const def = (schema as { _def?: { typeName?: string; shape?: () => Record<string, unknown> } })._def;

  if (def?.typeName !== 'ZodObject' || !def.shape) {
    return params;
  }

  const shape = def.shape();

  for (const [key, value] of Object.entries(shape)) {
    const fieldDef = (value as { _def?: Record<string, unknown> })._def;
    if (!fieldDef) continue;

    const fieldTypeName = fieldDef.typeName as string;
    const isOptional =
      fieldTypeName === 'ZodOptional' ||
      fieldTypeName === 'ZodDefault' ||
      fieldDef.defaultValue !== undefined;

    const resolved = resolveInnerType(fieldDef as Record<string, unknown>);
    const paramType = zodTypeToParamType(resolved.typeName);
    const description = resolved.description || (fieldDef.description as string) || key;

    const param: CopilotKitParameter = {
      name: key,
      type: paramType,
      description,
      required: !isOptional,
    };

    if (resolved.values && resolved.values.length > 0) {
      param.enum = resolved.values;
    }

    params.push(param);
  }

  return params;
}

// ─── Bridge Principal ───────────────────────────────────────────────

/**
 * Garante que as ferramentas MCP estão registradas.
 * Deve ser chamado ANTES de criar o CopilotRuntime.
 * É idempotente — seguro chamar múltiplas vezes.
 */
export async function ensureMcpToolsRegistered(): Promise<void> {
  const { registerAllTools, areToolsRegistered } = await import('@/lib/mcp/registry');
  if (!areToolsRegistered()) {
    await registerAllTools();
  }
}

/**
 * Converte ferramentas MCP em ações backend do CopilotKit.
 * SÍNCRONO — requer que ensureMcpToolsRegistered() tenha sido chamado antes.
 *
 * @param url - URL atual da página frontend (para filtrar tools por contexto)
 * @returns Array de CopilotKit backend actions
 */
export function getMcpToolsAsCopilotActions(url?: string): CopilotKitAction[] {
  // Importar de forma síncrona (módulo já carregado pelo registerAllTools)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { listMcpTools } = require('@/lib/mcp/server') as { listMcpTools: () => MCPToolConfig[] };
  const allTools = listMcpTools();

  // Filtrar por contexto (URL da página)
  const filteredTools = filterToolsByContext(allTools, url);

  // Converter para formato CopilotKit
  return filteredTools.map((tool) => convertToolToAction(tool));
}

/**
 * Filtra tools baseado na URL atual da página.
 * Tools de features globais estão sempre disponíveis.
 * Tools de features específicas aparecem quando o usuário está no módulo correspondente.
 */
function filterToolsByContext(
  tools: MCPToolConfig[],
  url?: string
): MCPToolConfig[] {
  if (!url) return tools;

  // Determinar features relevantes para a URL atual
  const relevantFeatures = new Set<string>(GLOBAL_FEATURES);

  for (const [urlPattern, features] of Object.entries(URL_FEATURE_MAP)) {
    if (url.includes(urlPattern)) {
      features.forEach((f) => relevantFeatures.add(f));
    }
  }

  // Se estiver em URL desconhecida, disponibilizar tudo
  const matchedAny = Object.keys(URL_FEATURE_MAP).some((pattern) => url.includes(pattern));
  if (!matchedAny) return tools;

  return tools.filter((tool) => relevantFeatures.has(tool.feature));
}

/**
 * Converte uma MCPToolConfig em CopilotKitAction
 */
function convertToolToAction(tool: MCPToolConfig): CopilotKitAction {
  const isDestructive = DESTRUCTIVE_TOOLS.has(tool.name);
  const description = isDestructive
    ? `${tool.description}. ATENÇÃO: Ação destrutiva - SEMPRE peça confirmação ao usuário antes de executar.`
    : tool.description;

  return {
    name: tool.name,
    description,
    parameters: zodSchemaToParameters(tool.schema),
    handler: async (args: Record<string, unknown>) => {
      try {
        const { executeMcpTool } = await import('@/lib/mcp/server');
        const result = await executeMcpTool(tool.name, args);

        if (result.isError) {
          const errorText = result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('\n');
          return { error: true, message: errorText };
        }

        // Preferir structuredContent quando disponível
        if (result.structuredContent) {
          return result.structuredContent;
        }

        // Fallback para texto
        const text = result.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n');

        // Tentar parsear JSON
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      } catch (error) {
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Erro desconhecido ao executar ferramenta',
        };
      }
    },
  };
}

/**
 * Gera um resumo das ferramentas disponíveis para inclusão no system prompt
 */
export function generateToolsSummary(tools: MCPToolConfig[]): string {
  const byFeature = new Map<string, string[]>();

  for (const tool of tools) {
    const feature = tool.feature;
    if (!byFeature.has(feature)) {
      byFeature.set(feature, []);
    }
    byFeature.get(feature)!.push(`- ${tool.name}: ${tool.description}`);
  }

  const sections: string[] = [];
  for (const [feature, toolNames] of byFeature.entries()) {
    sections.push(`### ${feature.charAt(0).toUpperCase() + feature.slice(1)} (${toolNames.length} ferramentas)\n${toolNames.join('\n')}`);
  }

  return sections.join('\n\n');
}
