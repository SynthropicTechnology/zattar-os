/**
 * Helper reutilizável para verificar autenticação + autorização
 * Simplifica a verificação de permissões nas rotas API
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from './api-auth';
import { checkPermission } from './authorization';
import type { Recurso, Operacao } from '@/app/(authenticated)/usuarios';

/**
 * Resultado de autenticação/autorização bem-sucedida
 */
export interface AuthorizedRequest {
  usuarioId: number;
  userId?: string; // UUID do Supabase Auth (opcional)
  source: 'session' | 'bearer' | 'service';
}

/**
 * Função interna privada que encapsula a lógica de autenticação
 * Verifica se o usuário está autenticado e retorna AuthorizedRequest ou NextResponse 401
 */
async function ensureAuthenticated(
  request: NextRequest
): Promise<AuthorizedRequest | NextResponse> {
  const authResult = await authenticateRequest(request);

  if (!authResult.authenticated || !authResult.usuarioId) {
    return NextResponse.json(
      {
        error: 'Não autenticado. Faça login para acessar este recurso.',
      },
      { status: 401 }
    );
  }

  return {
    usuarioId: authResult.usuarioId,
    userId: authResult.userId,
    source: authResult.source || 'session',
  };
}

/**
 * Verificar autenticação + autorização em uma única chamada
 *
 * @param request - NextRequest
 * @param recurso - Recurso (ex: 'contratos', 'audiencias')
 * @param operacao - Operação (ex: 'criar', 'editar', 'deletar')
 * @returns AuthorizedRequest se autorizado, NextResponse (erro) caso contrário
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authOrError = await requirePermission(request, 'contratos', 'criar');
 *
 *   if (authOrError instanceof NextResponse) {
 *     return authOrError; // 401 ou 403
 *   }
 *
 *   const { usuarioId } = authOrError;
 *   // Continuar com a lógica...
 * }
 * ```
 */
export const requirePermission = async (
  request: NextRequest,
  recurso: Recurso,
  operacao: Operacao
): Promise<AuthorizedRequest | NextResponse> => {
  // 1. Verificar autenticação
  const authOrError = await ensureAuthenticated(request);

  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  // 2. Verificar autorização (permissão)
  const hasPermission = await checkPermission(
    authOrError.usuarioId,
    recurso,
    operacao
  );

  if (!hasPermission) {
    return NextResponse.json(
      {
        error: `Você não tem permissão para ${operacao} ${recurso}.`,
        recurso,
        operacao,
        required_permission: `${recurso}.${operacao}`,
      },
      { status: 403 }
    );
  }

  // 3. Retornar dados do usuário autorizado
  return authOrError;
};

/**
 * Verificar apenas autenticação (sem verificar permissão)
 * Útil quando a permissão é verificada condicionalmente depois
 */
export const requireAuthentication = async (
  request: NextRequest
): Promise<AuthorizedRequest | NextResponse> => {
  return ensureAuthenticated(request);
};
