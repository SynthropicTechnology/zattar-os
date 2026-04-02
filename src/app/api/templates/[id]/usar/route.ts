import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { usarTemplate } from '@/app/app/documentos/service';

/**
 * POST /api/templates/[id]/usar
 * Cria um novo documento a partir de um template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template_id = parseInt(id);
    if (isNaN(template_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Dados opcionais do body
    const body = await request.json().catch(() => ({}));

    // Service já trata verificação de acesso, existência e incremento de uso
    const documento = await usarTemplate(
      template_id,
      authResult.usuario.id,
      {
        titulo: body.titulo,
        pasta_id: body.pasta_id,
      }
    );

    return NextResponse.json(
      { success: true, data: documento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao usar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: error instanceof Error && error.message.includes('não encontrado') ? 404 : 500 }
    );
  }
}
