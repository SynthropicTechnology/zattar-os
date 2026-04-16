import { NextRequest, NextResponse } from 'next/server';
import { getTemplate } from '@/shared/assinatura-digital/services/templates.service';
import { generatePresignedUrl } from '@/lib/storage/backblaze-b2.service';

/**
 * GET /api/assinatura-digital/templates/[id]/preview
 *
 * Faz proxy do PDF do template para evitar problemas de CORS com Backblaze B2.
 * O endpoint gera uma URL presigned e faz o fetch do PDF, retornando-o diretamente.
 *
 * Esta abordagem é mais confiável que redirect porque:
 * - Não há problemas de CORS com cross-origin redirects
 * - Não há issues com withCredentials em redirects
 * - Funciona consistentemente com react-pdf/pdf.js
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar template para obter a URL do PDF
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    const pdfUrl = template.pdf_url || template.arquivo_original;
    if (!pdfUrl) {
      return NextResponse.json({ error: 'Template não possui PDF associado' }, { status: 404 });
    }

    // Determinar URL para fetch
    let fetchUrl = pdfUrl;
    const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;

    // Se a URL contém o bucket, gerar URL presigned para acesso
    if (bucket && pdfUrl.includes(`/${bucket}/`)) {
      const fileKey = pdfUrl.split(`/${bucket}/`)[1];
      fetchUrl = await generatePresignedUrl(fileKey, 3600);
    }

    // Fazer proxy do PDF (evita problemas de CORS)
    const response = await fetch(fetchUrl, {
      headers: { 'Accept': 'application/pdf' },
    });

    if (!response.ok) {
      console.error('[PREVIEW] Erro ao buscar PDF:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Erro ao buscar PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(template.arquivo_nome || 'template.pdf')}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro no preview do template:', error);
    const message = error instanceof Error ? error.message : 'Erro ao carregar preview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
