import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import {
  generatePreviewHtml,
  DEFAULT_SAMPLE_DATA,
} from '@/shared/assinatura-digital/services/template-texto-pdf.service';

// Schema for request validation
const previewRequestSchema = z.object({
  content: z.array(z.record(z.unknown())).min(1, 'Conteúdo é obrigatório'),
  variables: z.record(z.string()).optional(),
});

/**
 * POST /api/assinatura-digital/templates/preview-texto
 *
 * Generate HTML preview of a text template with sample data
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission(user.id, 'assinatura_digital', 'visualizar');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar templates' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = previewRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, variables } = validation.data;

    // Generate preview HTML
    const sampleData = {
      ...DEFAULT_SAMPLE_DATA,
      ...variables,
    };

    // Cast to Descendant[] - the schema ensures it's an array of objects
    const html = generatePreviewHtml(content as Parameters<typeof generatePreviewHtml>[0], sampleData);

    return NextResponse.json({
      success: true,
      data: {
        html,
        contentType: 'text/html',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
