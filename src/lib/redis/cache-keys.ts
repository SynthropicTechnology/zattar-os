import { generateCacheKey, CACHE_PREFIXES } from './cache-utils';
import type { ListarExpedientesParams } from '@/app/(authenticated)/expedientes';
import type { ListarAudienciasParams } from '@/app/(authenticated)/audiencias';
import type { ListarAcervoParams } from '@/app/(authenticated)/acervo';
import type { PlanoContasFilters as ListarPlanoContasParams } from '@/app/(authenticated)/financeiro/domain';

/**
 * Normalizes params by removing undefined values and sorting keys for consistency.
 */
function normalizeParams(params: unknown): Record<string, unknown> {
  if (!params || typeof params !== 'object') return {};
  const obj = params as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    if (obj[key] !== undefined) {
      normalized[key] = obj[key];
    }
  }
  return normalized;
}

/**
 * Generates cache key for pendentes list based on ListarExpedientesParams.
 */
export function getPendentesListKey(params: ListarExpedientesParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.pendentes, normalized);
}

/**
 * Generates cache key for pendentes group based on ListarExpedientesParams.
 */
export function getPendentesGroupKey(params: ListarExpedientesParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(`${CACHE_PREFIXES.pendentes}:group`, normalized);
}

/**
 * Generates cache key for audiencias list based on ListarAudienciasParams.
 */
export function getAudienciasListKey(params: ListarAudienciasParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.audiencias, normalized);
}

/**
 * Generates cache key for acervo list based on ListarAcervoParams.
 */
export function getAcervoListKey(params: ListarAcervoParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.acervo, normalized);
}

/**
 * Generates cache key for acervo group based on ListarAcervoParams.
 */
export function getAcervoGroupKey(params: ListarAcervoParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(`${CACHE_PREFIXES.acervo}:group`, normalized);
}

/**
 * Generates cache key for usuarios list.
 */
export function getUsuariosListKey(params: unknown): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.usuarios, normalized);
}

/**
 * Generates cache key for clientes list.
 */
export function getClientesListKey(params: unknown): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.clientes, normalized);
}

/**
 * Generates cache key for contratos list.
 */
export function getContratosListKey(params: unknown): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.contratos, normalized);
}

/**
 * Generates cache key for tipos expedientes list.
 */
export function getTiposExpedientesListKey(params: unknown): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.tiposExpedientes, normalized);
}

/**
 * Generates cache key for cargos list.
 */
export function getCargosListKey(params: Record<string, unknown>): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.cargos, normalized);
}

/**
 * Generates cache key for plano de contas list.
 */
export function getPlanoContasListKey(params: ListarPlanoContasParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.planoContas, normalized);
}

/**
 * Generates cache key for plano de contas hierarquia.
 */
export function getPlanoContasHierarquiaKey(): string {
  return `${CACHE_PREFIXES.planoContas}:hierarquia`;
}
