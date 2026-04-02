/**
 * API Route para verificar status da conexão do Editor IA
 *
 * POST /api/ai-editor/status - Testa conexão com configuração customizada (antes de salvar)
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { createAIEditorProvider } from "@/lib/ai-editor/provider";
import { generateText } from "ai";
import type { EditorIAConfig } from "@/lib/integracoes";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, api_key, base_url, default_model } = body as Partial<EditorIAConfig>;

    if (!provider || !api_key || !default_model) {
      return NextResponse.json(
        { success: false, error: "provider, api_key e default_model são obrigatórios" },
        { status: 400 }
      );
    }

    const config: EditorIAConfig = {
      provider,
      api_key,
      base_url: base_url || undefined,
      default_model,
    };

    const aiProvider = createAIEditorProvider(config);

    const { text } = await generateText({
      model: aiProvider(default_model),
      prompt: "Responda apenas: OK",
      maxOutputTokens: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        response: text.trim(),
      },
    });
  } catch (error) {
    console.error("Error in ai-editor status POST:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const isAuthError =
      errorMessage.toLowerCase().includes("auth") ||
      errorMessage.toLowerCase().includes("key") ||
      errorMessage.toLowerCase().includes("401") ||
      errorMessage.toLowerCase().includes("403");

    return NextResponse.json({
      success: true,
      data: {
        connected: false,
        error: isAuthError
          ? "Credenciais inválidas. Verifique a API Key e o provedor selecionado."
          : `Erro ao conectar: ${errorMessage}`,
      },
    });
  }
}
