/**
 * CopilotKit Runtime Endpoint
 *
 * Configura o CopilotRuntime com:
 * - Google Gemini 2.5 Flash como LLM
 * - Todas as ferramentas MCP do sistema como backend actions
 * - Filtro contextual por URL da página (tools relevantes por módulo)
 *
 * As ferramentas MCP são executadas no mesmo processo via bridge direta
 * (sem overhead de rede) — veja src/lib/copilotkit/mcp-bridge.ts
 */

import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest, NextResponse } from "next/server";
import {
  ensureMcpToolsRegistered,
  getMcpToolsAsCopilotActions,
} from "@/lib/copilotkit/mcp-bridge";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const POST = async (req: NextRequest) => {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    // Garantir que ferramentas MCP estão registradas (idempotente)
    await ensureMcpToolsRegistered();

    const serviceAdapter = new GoogleGenerativeAIAdapter({
      model: "gemini-2.5-flash",
      apiKey,
    });

    const runtime = new CopilotRuntime({
      actions: ({ url }) => {
        // Converter ferramentas MCP para ações CopilotKit (síncrono)
        // Filtra por URL para expor apenas tools relevantes ao módulo atual
        return getMcpToolsAsCopilotActions(url);
      },
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    return await handleRequest(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
