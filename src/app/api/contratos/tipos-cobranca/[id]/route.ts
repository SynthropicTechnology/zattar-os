/**
 * API Route: /api/contratos/tipos-cobranca/[id]
 *
 * GET    - Busca um tipo de cobrança pelo ID
 * PUT    - Atualiza um tipo de cobrança
 * DELETE - Remove um tipo de cobrança (com verificação de uso)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  contratoTiposCobrancaRepo,
  updateContratoTipoSchema,
} from '@/app/(authenticated)/contratos/tipos-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authOrError = await requirePermission(request, 'contratos', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const result = await contratoTiposCobrancaRepo.findById(id);

    if (!result.success) {
      console.error('Erro em GET /api/contratos/tipos-cobranca/[id]:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Tipo de cobrança não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar tipo de cobrança';
    console.error('Erro em GET /api/contratos/tipos-cobranca/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authOrError = await requirePermission(request, 'contratos', 'editar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateContratoTipoSchema.parse(body);

    const result = await contratoTiposCobrancaRepo.update(id, payload);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json({ error: result.error.message }, { status: 404 });
      }
      if (result.error.code === 'CONFLICT') {
        return NextResponse.json({ error: result.error.message }, { status: 409 });
      }
      console.error('Erro em PUT /api/contratos/tipos-cobranca/[id]:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Erro ao atualizar tipo de cobrança';
    console.error('Erro em PUT /api/contratos/tipos-cobranca/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authOrError = await requirePermission(request, 'contratos', 'deletar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Verificar se o tipo está em uso antes de excluir
    const countResult = await contratoTiposCobrancaRepo.countContratosUsing(id);

    if (!countResult.success) {
      console.error('Erro em DELETE /api/contratos/tipos-cobranca/[id] (count):', countResult.error);
      return NextResponse.json({ error: countResult.error.message }, { status: 500 });
    }

    if (countResult.data > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir: ${countResult.data} ${countResult.data === 1 ? 'contrato usa' : 'contratos usam'} este tipo`,
          count: countResult.data,
        },
        { status: 409 },
      );
    }

    // Verificar se o registro existe antes de tentar excluir
    const findResult = await contratoTiposCobrancaRepo.findById(id);

    if (!findResult.success) {
      console.error('Erro em DELETE /api/contratos/tipos-cobranca/[id] (find):', findResult.error);
      return NextResponse.json({ error: findResult.error.message }, { status: 500 });
    }

    if (!findResult.data) {
      return NextResponse.json(
        { error: 'Tipo de cobrança não encontrado' },
        { status: 404 },
      );
    }

    const deleteResult = await contratoTiposCobrancaRepo.remove(id);

    if (!deleteResult.success) {
      console.error('Erro em DELETE /api/contratos/tipos-cobranca/[id]:', deleteResult.error);
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao excluir tipo de cobrança';
    console.error('Erro em DELETE /api/contratos/tipos-cobranca/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
