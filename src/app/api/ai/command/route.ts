/**
 * DEPRECATED: Esta rota foi substituída por /api/plate/ai
 * que inclui autenticação, rate limiting e prompts do banco de dados.
 *
 * Este arquivo redireciona chamadas para a nova rota por compatibilidade.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint has been deprecated. Use /api/plate/ai instead.',
      redirect: '/api/plate/ai',
    },
    { status: 410 }
  );
}
