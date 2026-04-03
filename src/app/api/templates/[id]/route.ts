import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  buscarTemplate,
  atualizarTemplate,
  deletarTemplate,
} from '@/app/(authenticated)/documentos/service';

/**
 * GET /api/templates/[id]
 * Busca um template específico
 */
export async function GET(
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

    const template = await buscarTemplate(template_id, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: error instanceof Error && error.message.includes('não encontrado') ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]
 * Atualiza um template
 */
export async function PUT(
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

    const body = await request.json();
    const template = await atualizarTemplate(template_id, body, authResult.usuario.id);

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Deleta um template permanentemente
 */
export async function DELETE(
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

    await deletarTemplate(template_id, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      message: 'Template deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
