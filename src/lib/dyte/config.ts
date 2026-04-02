/**
 * DYTE CONFIG
 *
 * Lê a configuração do Dyte exclusivamente da tabela `integracoes` no banco.
 * Utiliza cache em memória com TTL de 1 minuto para evitar queries repetidas.
 */

import type { DyteConfig } from "@/lib/integracoes";

let cachedConfig: DyteConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Busca a configuração do Dyte no banco de dados.
 * Cacheia em memória por 1 minuto para performance.
 * @throws se o Dyte não estiver configurado
 */
export async function getDyteConfig(): Promise<DyteConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  // Import dinâmico para evitar dependência circular
  const { buscarConfigDyte } = await import(
    "@/lib/integracoes/service"
  );
  const config = await buscarConfigDyte();

  if (!config) {
    throw new Error(
      "Dyte não configurado. Configure em Configurações > Integrações."
    );
  }

  cachedConfig = config;
  cacheTimestamp = now;
  return config;
}

/**
 * Verifica se o Dyte está configurado e ativo (sem lançar erro)
 */
export async function isDyteConfigured(): Promise<boolean> {
  try {
    await getDyteConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se transcrição está habilitada na configuração
 */
export async function isDyteTranscriptionEnabled(): Promise<boolean> {
  try {
    const config = await getDyteConfig();
    return config.enable_transcription ?? false;
  } catch {
    return false;
  }
}

/**
 * Verifica se gravação está habilitada na configuração
 */
export async function isDyteRecordingEnabled(): Promise<boolean> {
  try {
    const config = await getDyteConfig();
    return config.enable_recording ?? false;
  } catch {
    return false;
  }
}

/**
 * Retorna o idioma da transcrição configurado
 */
export function getDyteTranscriptionLanguage(config: DyteConfig): string {
  return config.transcription_language || "pt-BR";
}

/**
 * Invalida o cache forçando nova leitura do banco na próxima chamada
 */
export function invalidateDyteConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
