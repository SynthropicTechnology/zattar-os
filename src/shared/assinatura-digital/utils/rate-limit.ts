/**
 * Rate Limiting para Endpoints Públicos de Assinatura Digital
 *
 * Implementa rate limiting por IP para proteger endpoints públicos
 * contra abuso e ataques de força bruta.
 *
 * Usa Redis quando disponível, com fallback para in-memory.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/utils';
import { getClientIp } from '@/lib/utils/get-client-ip';

// =============================================================================
// TIPOS
// =============================================================================

export interface PublicRateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições
  message?: string; // Mensagem de erro customizada
}

export interface PublicRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const RATE_LIMIT_PREFIX = 'assinatura-digital:ratelimit:';

/**
 * Configurações padrão para diferentes endpoints públicos
 */
export const PUBLIC_RATE_LIMITS: Record<string, PublicRateLimitConfig> = {
  // Finalização de assinatura - mais restritivo
  finalizar: {
    windowMs: 60000, // 1 minuto
    maxRequests: 5, // 5 requisições por minuto por IP
    message: 'Muitas tentativas de assinatura. Aguarde antes de tentar novamente.',
  },
  // Verificação de CPF - moderado
  verificarCpf: {
    windowMs: 60000,
    maxRequests: 10,
    message: 'Muitas verificações de CPF. Aguarde antes de tentar novamente.',
  },
  // Identificação - moderado
  identificacao: {
    windowMs: 60000,
    maxRequests: 10,
    message: 'Muitas tentativas de identificação. Aguarde antes de tentar novamente.',
  },
  // Download de PDF - mais permissivo
  download: {
    windowMs: 60000,
    maxRequests: 20,
    message: 'Muitos downloads solicitados. Aguarde antes de tentar novamente.',
  },
  // Visualização de token - mais permissivo
  tokenView: {
    windowMs: 60000,
    maxRequests: 30,
    message: 'Muitas requisições. Aguarde antes de tentar novamente.',
  },
  // Padrão para endpoints não configurados
  default: {
    windowMs: 60000,
    maxRequests: 15,
    message: 'Limite de requisições excedido. Aguarde antes de tentar novamente.',
  },
};

// =============================================================================
// IN-MEMORY FALLBACK
// =============================================================================

/**
 * Cache in-memory para quando Redis não está disponível
 */
const inMemoryCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Limpa entradas expiradas do cache in-memory
 */
function cleanupInMemoryCache(): void {
  const now = Date.now();
  for (const [key, value] of inMemoryCache.entries()) {
    if (value.resetAt < now) {
      inMemoryCache.delete(key);
    }
  }
}

// Limpar cache periodicamente (a cada 5 minutos)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInMemoryCache, 5 * 60 * 1000);
}

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

// Re-export getClientIp from centralized utility
export { getClientIp } from '@/lib/utils/get-client-ip';

/**
 * Verifica rate limit para um IP em um endpoint específico
 */
export async function checkPublicRateLimit(
  ip: string,
  endpoint: keyof typeof PUBLIC_RATE_LIMITS | string
): Promise<PublicRateLimitResult> {
  const config = PUBLIC_RATE_LIMITS[endpoint] || PUBLIC_RATE_LIMITS.default;
  const key = `${RATE_LIMIT_PREFIX}${endpoint}:${ip}`;

  // Tentar usar Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const current = await client.incr(key);

        if (current === 1) {
          await client.pexpire(key, config.windowMs);
        }

        const ttl = await client.pttl(key);
        const resetAt = new Date(Date.now() + Math.max(ttl, 0));

        return {
          allowed: current <= config.maxRequests,
          remaining: Math.max(0, config.maxRequests - current),
          resetAt,
          limit: config.maxRequests,
        };
      } catch (error) {
        console.error('[Assinatura Digital Rate Limit] Erro Redis:', error);
        // Fallback para in-memory
      }
    }
  }

  // Fallback: usar cache in-memory
  const now = Date.now();
  const cached = inMemoryCache.get(key);

  if (cached && cached.resetAt > now) {
    // Janela ainda ativa
    cached.count++;
    return {
      allowed: cached.count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - cached.count),
      resetAt: new Date(cached.resetAt),
      limit: config.maxRequests,
    };
  }

  // Nova janela
  const resetAt = now + config.windowMs;
  inMemoryCache.set(key, { count: 1, resetAt });

  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetAt: new Date(resetAt),
    limit: config.maxRequests,
  };
}

/**
 * Gera headers de rate limit para resposta HTTP
 */
export function getRateLimitHeaders(result: PublicRateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.allowed
      ? {}
      : { 'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString() }),
  };
}

/**
 * Middleware de rate limiting para usar em route handlers
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await applyRateLimit(request, 'finalizar');
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // ... resto do handler
 * }
 */
export async function applyRateLimit(
  request: NextRequest,
  endpoint: keyof typeof PUBLIC_RATE_LIMITS | string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkPublicRateLimit(ip, endpoint);
  const headers = getRateLimitHeaders(result);

  if (!result.allowed) {
    const config = PUBLIC_RATE_LIMITS[endpoint] || PUBLIC_RATE_LIMITS.default;
    return NextResponse.json(
      {
        error: 'Rate limit excedido',
        message: config.message,
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Rate limit passou, retornar null para continuar
  return null;
}

/**
 * Higher-order function para wrapper de handler com rate limiting
 *
 * @example
 * export const POST = withRateLimit('finalizar', async (request) => {
 *   // ... handler logic
 *   return NextResponse.json({ success: true });
 * });
 */
export function withRateLimit(
  endpoint: keyof typeof PUBLIC_RATE_LIMITS | string,
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const rateLimitResponse = await applyRateLimit(request, endpoint);
    if (rateLimitResponse) return rateLimitResponse;

    // Executar handler original e adicionar headers de rate limit
    const ip = getClientIp(request);
    const result = await checkPublicRateLimit(ip, endpoint);
    const headers = getRateLimitHeaders(result);

    const response = await handler(request);

    // Adicionar headers de rate limit à resposta
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
