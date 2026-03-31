/**
 * AI EDITOR CONFIG
 *
 * Lê a configuração do Editor de Texto IA da tabela `integracoes` no banco.
 * Utiliza cache em memória com TTL de 1 minuto para evitar queries repetidas.
 * Fallback para variáveis de ambiente se não houver configuração no DB.
 */

import type { EditorIAConfig } from "@/features/integracoes/domain";

let cachedConfig: EditorIAConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Busca a configuração do Editor IA no banco de dados.
 * Cacheia em memória por 1 minuto para performance.
 * Fallback para variáveis de ambiente se DB não configurado.
 * @throws se nenhuma configuração existir (nem DB nem env)
 */
export async function getEditorIAConfig(): Promise<EditorIAConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  // Import dinâmico para evitar dependência circular
  const { buscarConfigEditorIA } = await import(
    "@/features/integracoes/service"
  );
  const config = await buscarConfigEditorIA();

  if (config) {
    cachedConfig = config;
    cacheTimestamp = now;
    return config;
  }

  // Fallback para env vars
  const envApiKey = process.env.AI_GATEWAY_API_KEY;
  if (envApiKey) {
    const fallbackConfig: EditorIAConfig = {
      provider: "gateway",
      api_key: envApiKey,
      default_model: process.env.AI_DEFAULT_MODEL || "google/gemini-3.1-flash-lite-preview",
      tool_choice_model: process.env.AI_TOOL_CHOICE_MODEL || "google/gemini-3.1-flash-lite-preview",
      comment_model: process.env.AI_COMMENT_MODEL || "google/gemini-3.1-flash-lite-preview",
    };
    cachedConfig = fallbackConfig;
    cacheTimestamp = now;
    return fallbackConfig;
  }

  throw new Error(
    "Editor de Texto IA não configurado. Configure em Configurações > Integrações."
  );
}

/**
 * Verifica se o Editor IA está configurado (sem lançar erro)
 */
export async function isEditorIAConfigured(): Promise<boolean> {
  try {
    await getEditorIAConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalida o cache forçando nova leitura do banco na próxima chamada
 */
export function invalidateEditorIAConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
