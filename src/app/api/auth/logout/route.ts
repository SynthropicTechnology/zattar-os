/**
 * API Route para logout
 *
 * Limpa todos os cookies de sessão do Supabase, incluindo cookies chunked
 * (.0, .1, .2...) que o @supabase/ssr cria para tokens grandes.
 * Funciona mesmo quando a sessão já expirou.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Coleta todos os nomes de cookies de auth do Supabase presentes na request,
 * incluindo chunks (.0, .1, ...) e code-verifier.
 */
function getSupabaseAuthCookieNames(request: NextRequest): string[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  let projectRef: string;
  try {
    projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  } catch {
    return [];
  }

  const prefix = `sb-${projectRef}-auth-token`;

  return request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith(prefix));
}

/**
 * Deleta todos os cookies de auth do Supabase na response.
 */
function clearSupabaseAuthCookies(
  response: NextResponse,
  cookieNames: string[]
) {
  cookieNames.forEach((cookieName) => {
    response.cookies.delete(cookieName);
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  });
}

export async function POST(request: NextRequest) {
  // Coletar nomes de cookies ANTES de qualquer operação
  const authCookieNames = getSupabaseAuthCookieNames(request);

  try {
    const response = NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    );

    // Criar cliente Supabase com setAll funcional para que signOut()
    // consiga propagar a limpeza de cookies corretamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Tentar signOut (pode falhar se sessão já expirou)
    try {
      await supabase.auth.signOut();
    } catch {
      // Sessão já expirada — continuamos com limpeza manual
    }

    // Limpeza explícita de TODOS os cookies de auth (incluindo chunks)
    clearSupabaseAuthCookies(response, authCookieNames);

    return response;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);

    const errorResponse = NextResponse.json(
      { success: false, error: 'Erro ao fazer logout' },
      { status: 500 }
    );

    // Mesmo em caso de erro, limpar todos os cookies
    clearSupabaseAuthCookies(errorResponse, authCookieNames);

    return errorResponse;
  }
}
