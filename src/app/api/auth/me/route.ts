/**
 * API Route consolidada para dados do usuário autenticado
 *
 * GET /api/auth/me - Retorna perfil + permissões em uma única chamada
 *
 * Substitui as chamadas separadas a:
 * - GET /api/perfil (dados do perfil)
 * - GET /api/permissoes/minhas (permissões)
 * - GET /api/me (id + isSuperAdmin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { createServiceClient } from '@/lib/supabase/service-client';
import { listarPermissoesUsuario } from '@/features/usuarios/repository';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Buscar dados do usuário e permissões em paralelo
    const [usuarioResult, permissoes] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, auth_user_id, nome_completo, nome_exibicao, email_corporativo, email_pessoal, avatar_url, is_super_admin')
        .eq('id', authResult.usuarioId)
        .single(),
      listarPermissoesUsuario(authResult.usuarioId),
    ]);

    if (usuarioResult.error || !usuarioResult.data) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const usuario = usuarioResult.data;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: usuario.id,
          authUserId: usuario.auth_user_id,
          nomeCompleto: usuario.nome_completo,
          nomeExibicao: usuario.nome_exibicao,
          emailCorporativo: usuario.email_corporativo,
          emailPessoal: usuario.email_pessoal ?? null,
          avatarUrl: resolveAvatarUrl(usuario.avatar_url),
          isSuperAdmin: usuario.is_super_admin || false,
          permissoes: permissoes.map((p) => ({
            recurso: p.recurso,
            operacao: p.operacao,
            permitido: p.permitido,
          })),
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
