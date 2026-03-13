/**
 * API Routes para perfil do usuário logado
 *
 * GET /api/perfil - Retorna dados de perfil do usuário autenticado (para UI: sidebar, editor etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { createServiceClient } from '@/lib/supabase/service-client';

type PerfilResponseData = {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string;
  emailCorporativo: string;
  emailPessoal: string | null;
  avatarUrl: string | null;
};

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

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome_completo, nome_exibicao, email_corporativo, email_pessoal, avatar_url')
      .eq('id', authResult.usuarioId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const perfil: PerfilResponseData = {
      id: data.id,
      nomeCompleto: data.nome_completo,
      nomeExibicao: data.nome_exibicao,
      emailCorporativo: data.email_corporativo,
      emailPessoal: data.email_pessoal ?? null,
      avatarUrl: resolveAvatarUrl(data.avatar_url),
    };

    return NextResponse.json(
      { success: true, data: perfil },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}


