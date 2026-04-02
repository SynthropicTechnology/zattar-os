/**
 * AI EDITOR PROVIDER FACTORY
 *
 * Cria o provider correto do Vercel AI SDK baseado na configuração do banco.
 * Suporta: Vercel AI Gateway, OpenAI, OpenRouter, Anthropic, Google AI.
 */

import type { EditorIAConfig } from "@/lib/integracoes";
import { createGateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Cria o provider factory do AI SDK baseado na configuração.
 * Retorna uma função que recebe o model ID e retorna um LanguageModel.
 */
export function createAIEditorProvider(config: EditorIAConfig) {
  const baseURL = config.base_url || undefined;

  switch (config.provider) {
    case "gateway":
      return createGateway({
        apiKey: config.api_key,
        ...(baseURL && { baseURL }),
      });

    case "openai":
      return createOpenAI({
        apiKey: config.api_key,
        ...(baseURL && { baseURL }),
      });

    case "openrouter":
      return createOpenAI({
        apiKey: config.api_key,
        baseURL: baseURL || "https://openrouter.ai/api/v1",
      });

    case "anthropic":
      return createAnthropic({
        apiKey: config.api_key,
        ...(baseURL && { baseURL }),
      });

    case "google":
      return createGoogleGenerativeAI({
        apiKey: config.api_key,
        ...(baseURL && { baseURL }),
      });

    default:
      throw new Error(`Provider não suportado: ${config.provider}`);
  }
}
