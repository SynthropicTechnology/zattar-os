/**
 * Rate Limiting para MCP do Synthropic
 *
 * Implementa rate limiting por tier (anonymous, authenticated, service)
 * usando Redis como backend com sliding window algorithm.
 *
 * Estratégia: Fail-closed (bloqueia quando Redis indisponível)
 * Algoritmo: Sliding Window usando Redis Sorted Sets
 */

import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/utils';

// =============================================================================
// TIPOS
// =============================================================================

export type RateLimitTier = 'anonymous' | 'authenticated' | 'service';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  blockedReason?: 'rate_limit' | 'redis_unavailable';
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Modo de falha quando Redis está indisponível
 * - 'closed': Bloqueia requisições (mais seguro)
 * - 'open': Permite requisições (mais disponível, padrão)
 *
 * Padrão alterado para 'open' porque fail-closed derruba a
 * aplicação inteira quando o Redis está inacessível.
 */
const FAIL_MODE = (process.env.RATE_LIMIT_FAIL_MODE || 'open') as 'open' | 'closed';

const DEFAULT_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  anonymous: { windowMs: 60000, maxRequests: 5 }, // 5 req/min (reduzido de 10)
  authenticated: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  service: { windowMs: 60000, maxRequests: 1000 }, // 1000 req/min
};

/**
 * Limites secundários (janela de hora) para tier anonymous
 */
const HOURLY_LIMITS: Partial<Record<RateLimitTier, RateLimitConfig>> = {
  anonymous: { windowMs: 3600000, maxRequests: 100 }, // 100 req/hora
};

/**
 * Limites específicos por endpoint
 */
const ENDPOINT_LIMITS: Record<string, Partial<RateLimitConfig>> = {
  '/api/mcp': { maxRequests: 300 }, // Aumentado para suportar agente de atendimento
  '/api/plate/ai': { maxRequests: 30 },
  '/api/mcp/stream': { maxRequests: 20 },
  '/api/auth': { maxRequests: 10 },
};

const RATE_LIMIT_PREFIX = 'mcp:ratelimit:';
const SLIDING_WINDOW_PREFIX = 'mcp:ratelimit:sw:';

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Retorna resultado de fail-closed ou fail-open baseado na configuração
 */
function getFailResult(config: RateLimitConfig): RateLimitResult {
  if (FAIL_MODE === 'open') {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  console.warn('[Rate Limit] Redis indisponível - bloqueando requisição (fail-closed mode)');
  return {
    allowed: false,
    remaining: 0,
    resetAt: new Date(Date.now() + config.windowMs),
    limit: config.maxRequests,
    blockedReason: 'redis_unavailable',
  };
}

/**
 * Implementa sliding window algorithm usando Redis Sorted Sets
 *
 * @param key - Chave do Redis para o sorted set
 * @param windowMs - Tamanho da janela em ms
 * @param maxRequests - Número máximo de requisições
 * @returns Resultado do rate limit
 */
async function slidingWindowCheck(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const client = getRedisClient();
  if (!client) {
    return getFailResult({ windowMs, maxRequests });
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}:${Math.random().toString(36).substring(2, 9)}`;

  try {
    // Pipeline para operações atômicas
    const pipeline = client.pipeline();

    // 1. Remover entradas antigas (fora da janela)
    pipeline.zremrangebyscore(key, '-inf', windowStart);

    // 2. Adicionar nova requisição com timestamp como score
    pipeline.zadd(key, now, member);

    // 3. Contar requisições na janela atual
    pipeline.zcard(key);

    // 4. Definir TTL para limpeza automática
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();

    // zcard retorna o número de elementos
    const count = (results?.[2]?.[1] as number) || 0;

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    // Se não permitido, remover a requisição que acabamos de adicionar
    // (não conta para o próximo check)
    if (!allowed) {
      await client.zrem(key, member);
    }

    return {
      allowed,
      remaining,
      resetAt: new Date(now + windowMs),
      limit: maxRequests,
      blockedReason: allowed ? undefined : 'rate_limit',
    };
  } catch (error) {
    console.error('[Rate Limit] Erro no sliding window check:', error);
    return getFailResult({ windowMs, maxRequests });
  }
}

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

/**
 * Verifica rate limit para um identificador usando sliding window
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  const config = DEFAULT_LIMITS[tier];
  const key = `${SLIDING_WINDOW_PREFIX}${tier}:${identifier}`;

  // Verificar disponibilidade do Redis
  if (!(await isRedisAvailable())) {
    return getFailResult(config);
  }

  const client = getRedisClient();
  if (!client) {
    return getFailResult(config);
  }

  // Verificar limite principal (minuto)
  const result = await slidingWindowCheck(key, config.windowMs, config.maxRequests);

  if (!result.allowed) {
    return result;
  }

  // Para tier anonymous, verificar também limite por hora
  const hourlyLimit = HOURLY_LIMITS[tier];
  if (hourlyLimit) {
    const hourlyKey = `${SLIDING_WINDOW_PREFIX}hourly:${tier}:${identifier}`;
    const hourlyResult = await slidingWindowCheck(
      hourlyKey,
      hourlyLimit.windowMs,
      hourlyLimit.maxRequests
    );

    if (!hourlyResult.allowed) {
      return {
        ...hourlyResult,
        blockedReason: 'rate_limit',
      };
    }
  }

  return result;
}

/**
 * Verifica rate limit específico para um endpoint
 */
export async function checkEndpointRateLimit(
  identifier: string,
  endpoint: string,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  const baseConfig = DEFAULT_LIMITS[tier];
  const endpointConfig = ENDPOINT_LIMITS[endpoint];

  // Combina configurações (endpoint sobrescreve tier)
  const config: RateLimitConfig = {
    windowMs: endpointConfig?.windowMs || baseConfig.windowMs,
    maxRequests: Math.min(
      endpointConfig?.maxRequests || baseConfig.maxRequests,
      baseConfig.maxRequests
    ),
  };

  const key = `${SLIDING_WINDOW_PREFIX}endpoint:${endpoint}:${tier}:${identifier}`;

  // Verificar disponibilidade do Redis
  if (!(await isRedisAvailable())) {
    return getFailResult(config);
  }

  const client = getRedisClient();
  if (!client) {
    return getFailResult(config);
  }

  // Verificar limite do endpoint
  const endpointResult = await slidingWindowCheck(key, config.windowMs, config.maxRequests);

  if (!endpointResult.allowed) {
    return endpointResult;
  }

  // Também verificar limite global do tier
  const globalResult = await checkRateLimit(identifier, tier);

  if (!globalResult.allowed) {
    return globalResult;
  }

  return endpointResult;
}

/**
 * Reseta rate limit para um identificador
 */
export async function resetRateLimit(identifier: string, tier: RateLimitTier): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = [
      `${SLIDING_WINDOW_PREFIX}${tier}:${identifier}`,
      `${SLIDING_WINDOW_PREFIX}hourly:${tier}:${identifier}`,
      // Também limpar keys do formato antigo
      `${RATE_LIMIT_PREFIX}${tier}:${identifier}`,
    ];

    await client.del(...keys);
  } catch (error) {
    console.error('[Rate Limit] Erro ao resetar rate limit:', error);
  }
}

/**
 * Obtém status atual do rate limit
 */
export async function getRateLimitStatus(
  identifier: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const config = DEFAULT_LIMITS[tier];
  const key = `${SLIDING_WINDOW_PREFIX}${tier}:${identifier}`;

  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) {
    return getFailResult(config);
  }

  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remover entradas antigas e contar atuais
    await client.zremrangebyscore(key, '-inf', windowStart);
    const count = await client.zcard(key);

    const remaining = Math.max(0, config.maxRequests - count);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(now + config.windowMs),
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('[Rate Limit] Erro ao obter status:', error);
    return getFailResult(config);
  }
}

// =============================================================================
// RATE LIMIT POR TOOL
// =============================================================================

/**
 * Verifica rate limit específico para uma tool
 */
export async function checkToolRateLimit(
  identifier: string,
  toolName: string,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  // Para tools específicas, podemos ter limites diferentes
  const toolSpecificLimits: Record<string, Partial<RateLimitConfig>> = {
    busca_semantica: { maxRequests: 20 }, // Mais restritivo por usar IA
    gerar_resumo_chamada: { maxRequests: 10 },
  };

  const baseConfig = DEFAULT_LIMITS[tier];
  const toolConfig = toolSpecificLimits[toolName];

  const config: RateLimitConfig = {
    windowMs: toolConfig?.windowMs || baseConfig.windowMs,
    maxRequests: toolConfig?.maxRequests || baseConfig.maxRequests,
  };

  const key = `${SLIDING_WINDOW_PREFIX}tool:${toolName}:${tier}:${identifier}`;

  // Verificar disponibilidade do Redis
  if (!(await isRedisAvailable())) {
    return getFailResult(config);
  }

  const client = getRedisClient();
  if (!client) {
    return getFailResult(config);
  }

  return slidingWindowCheck(key, config.windowMs, config.maxRequests);
}

// =============================================================================
// ERRO DE RATE LIMIT
// =============================================================================

export class RateLimitError extends Error {
  constructor(
    public resetAt: Date,
    public remaining: number,
    public limit: number,
    public reason?: 'rate_limit' | 'redis_unavailable'
  ) {
    const message =
      reason === 'redis_unavailable'
        ? 'Serviço temporariamente indisponível. Tente novamente em alguns segundos.'
        : `Rate limit excedido. Tente novamente em ${Math.ceil((resetAt.getTime() - Date.now()) / 1000)} segundos.`;
    super(message);
    this.name = 'RateLimitError';
  }
}

// =============================================================================
// HEADERS HTTP
// =============================================================================

/**
 * Gera headers de rate limit para resposta HTTP
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.allowed
      ? {}
      : { 'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString() }),
  };
}

// =============================================================================
// CONFIGURAÇÃO EXPORTS
// =============================================================================

export { DEFAULT_LIMITS, ENDPOINT_LIMITS, HOURLY_LIMITS, FAIL_MODE };
