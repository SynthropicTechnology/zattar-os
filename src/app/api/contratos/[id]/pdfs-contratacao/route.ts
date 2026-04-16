import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { gerarZipPdfsParaContrato } from '@/app/(authenticated)/contratos/services/documentos-contratacao.service';

export const runtime = 'nodejs';

function sanitizarNomeCliente(nome: string): string {
  return nome
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await authenticateRequest(req);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const contratoId = Number(id);
  if (!Number.isFinite(contratoId) || contratoId <= 0) {
    return NextResponse.json({ error: 'ID de contrato inválido' }, { status: 400 });
  }

  let overrides: Record<string, string> = {};
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === 'object' && body.overrides && typeof body.overrides === 'object') {
      overrides = body.overrides as Record<string, string>;
    }
  } catch {
    // body vazio é ok
  }

  try {
    const { buffer, nomeCliente } = await gerarZipPdfsParaContrato(contratoId, overrides);
    const filename = `Contratacao-${sanitizarNomeCliente(nomeCliente) || 'contrato'}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao gerar PDFs';
    console.error('[pdfs-contratacao] erro', { contratoId, mensagem });
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
