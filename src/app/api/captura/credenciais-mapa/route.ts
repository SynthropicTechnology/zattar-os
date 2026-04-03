import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { listarCredenciaisMapa } from '@/app/(authenticated)/advogados';

/**
 * GET /api/captura/credenciais-mapa
 * Retorna dados mínimos de credenciais para lookup (id, tribunal, grau).
 * Sem JOIN com advogados — query rápida.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await listarCredenciaisMapa();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar credenciais mapa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar credenciais para mapeamento' },
      { status: 500 }
    );
  }
}
