import { NextRequest, NextResponse } from 'next/server';
import { lerPacotePorToken } from '@/shared/assinatura-digital/services/pacote.service';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const pacote = await lerPacotePorToken(token);
  if (!pacote) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
  }

  return NextResponse.json(pacote, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
