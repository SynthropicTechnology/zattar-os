/**
 * Middleware de Autorização
 * Verifica permissões granulares de usuários
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { Recurso, Operacao } from '@/app/(authenticated)/usuarios';
import { isPermissaoValida } from '@/app/(authenticated)/usuarios';

/**
 * Cache de permissões em memória (TTL de 5 minutos)
 */
interface CacheEntry {
  result: boolean;
  expiry: number;
}

const permissionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Invalidar cache de um usuário específico
 */
export const invalidarCacheUsuario = (usuarioId: number): void => {
  const keys = Array.from(permissionCache.keys());
  keys.forEach((key) => {
    if (key.startsWith(`${usuarioId}:`)) {
      permissionCache.delete(key);
    }
  });
};

/**
 * Limpar cache expirado (executar periodicamente)
 */
export const limparCacheExpirado = (): void => {
  const agora = Date.now();
  const keys = Array.from(permissionCache.keys());

  keys.forEach((key) => {
    const entry = permissionCache.get(key);
    if (entry && entry.expiry < agora) {
      permissionCache.delete(key);
    }
  });
};

/**
 * Verificar se usuário tem permissão para executar operação
 *
 * @param usuarioId - ID do usuário
 * @param recurso - Recurso (ex: 'contratos', 'audiencias')
 * @param operacao - Operação (ex: 'criar', 'editar', 'deletar')
 * @returns true se tem permissão, false caso contrário
 */
export const checkPermission = async (
  usuarioId: number,
  recurso: string,
  operacao: string
): Promise<boolean> => {
  // 1. Validar se permissão existe na matriz
  if (!isPermissaoValida(recurso, operacao)) {
    console.warn(
      `Tentativa de verificar permissão inválida: ${recurso}.${operacao}`
    );
    return false;
  }

  // 2. Verificar cache
  const cacheKey = `${usuarioId}:${recurso}:${operacao}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    return cached.result;
  }

  // 3. Buscar usuário para verificar is_super_admin
  const supabase = createServiceClient();

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('is_super_admin')
    .eq('id', usuarioId)
    .single();

  // Se houver erro (ex: coluna não existe), assumir que não é super admin
  // e prosseguir com verificação normal de permissões
  if (usuarioError) {
    if (usuarioError.code === 'PGRST204' || usuarioError.message?.includes('does not exist')) {
      console.warn(
        `Campo is_super_admin não encontrado. As migrations foram aplicadas? Prosseguindo sem bypass de super admin.`
      );
      // Prosseguir para verificação normal de permissões
    } else {
      console.error(`Erro ao buscar usuário ${usuarioId}:`, usuarioError);
      return false;
    }
  }

  // 4. Se super admin, conceder acesso total (bypass)
  if (usuario?.is_super_admin) {
    const result = true;
    permissionCache.set(cacheKey, {
      result,
      expiry: Date.now() + CACHE_TTL,
    });
    return result;
  }

  // 5. Consultar tabela de permissões
  const { data: permissao, error: permissaoError } = await supabase
    .from('permissoes')
    .select('permitido')
    .eq('usuario_id', usuarioId)
    .eq('recurso', recurso)
    .eq('operacao', operacao)
    .single();

  if (permissaoError) {
    // PGRST116 = not found (usuário não tem essa permissão)
    if (permissaoError.code === 'PGRST116') {
      const result = false;
      permissionCache.set(cacheKey, {
        result,
        expiry: Date.now() + CACHE_TTL,
      });
      return result;
    }

    console.error(
      `Erro ao buscar permissão para usuário ${usuarioId}:`,
      permissaoError
    );
    return false;
  }

  // 6. Armazenar no cache e retornar resultado
  const result = permissao?.permitido ?? false;
  permissionCache.set(cacheKey, {
    result,
    expiry: Date.now() + CACHE_TTL,
  });

  return result;
};

/**
 * Verificar múltiplas permissões de uma vez
 * Útil quando uma ação requer múltiplas permissões
 *
 * @param usuarioId - ID do usuário
 * @param permissoes - Array de [recurso, operacao]
 * @param requireAll - Se true, requer TODAS as permissões. Se false, requer PELO MENOS UMA
 * @returns true se tem as permissões necessárias
 */
export const checkMultiplePermissions = async (
  usuarioId: number,
  permissoes: Array<[Recurso, Operacao]>,
  requireAll: boolean = true
): Promise<boolean> => {
  const results = await Promise.all(
    permissoes.map(([recurso, operacao]) =>
      checkPermission(usuarioId, recurso, operacao)
    )
  );

  if (requireAll) {
    return results.every((result) => result === true);
  } else {
    return results.some((result) => result === true);
  }
};

/**
 * Obter estatísticas do cache (para debugging)
 */
export const getCacheStats = () => {
  const agora = Date.now();
  let ativas = 0;
  let expiradas = 0;

  permissionCache.forEach((entry) => {
    if (entry.expiry >= agora) {
      ativas++;
    } else {
      expiradas++;
    }
  });

  return {
    total: permissionCache.size,
    ativas,
    expiradas,
  };
};

// Limpar cache expirado a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(limparCacheExpirado, 10 * 60 * 1000);
}
