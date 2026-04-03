import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  buscarPasta,
  atualizarPasta,
  deletarPasta,
} from '@/app/(authenticated)/documentos/service';

/**
 * GET /api/pastas/[id]
 * Busca uma pasta específica
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const pasta = await buscarPasta(pasta_id, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      data: pasta,
    });
  } catch (error) {
    console.error('Erro ao buscar pasta:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: error instanceof Error && (error.message.includes('não encontrada') || error.message.includes('negado')) ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/pastas/[id]
 * Atualiza uma pasta
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const pasta = await atualizarPasta(pasta_id, body, authResult.usuario.id);

    return NextResponse.json({ success: true, data: pasta });
  } catch (error) {
    console.error('Erro ao atualizar pasta:', error);
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
 * DELETE /api/pastas/[id]
 * Soft delete de uma pasta
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    await deletarPasta(pasta_id, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      message: 'Pasta movida para lixeira',
    });
  } catch (error) {
    console.error('Erro ao deletar pasta:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
