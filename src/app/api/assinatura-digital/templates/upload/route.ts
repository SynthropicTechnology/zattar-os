import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { uploadToBackblaze } from '@/lib/storage/backblaze-b2.service';
import { randomUUID } from 'crypto';
import { validatePdfFile } from '@/app/(authenticated)/assinatura-digital/feature/utils/file-validation';

/**
 * POST /api/assinatura-digital/templates/upload
 *
 * Faz upload de um arquivo PDF de template para o Backblaze B2.
 * Salva na pasta: assinatura-digital/templates/
 */
export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    // Validar PDF por magic bytes (previne MIME type spoofing)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const pdfValidation = await validatePdfFile(file, { maxSize });
    if (!pdfValidation.valid || !pdfValidation.buffer) {
      return NextResponse.json(
        { error: pdfValidation.error ?? 'Arquivo PDF inválido' },
        { status: 400 }
      );
    }

    const buffer = pdfValidation.buffer;

    // Gerar nome único para o arquivo
    const uuid = randomUUID();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const key = `assinatura-digital/templates/${uuid}-${sanitizedName}`;

    // Upload para Backblaze
    const result = await uploadToBackblaze({
      buffer,
      key,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        nome: file.name,
        tamanho: file.size,
      },
    });
  } catch (error) {
    console.error('Erro no upload de template:', error);
    const message = error instanceof Error ? error.message : 'Erro ao fazer upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
