/**
 * API Routes — Estágio individual de um Pipeline
 *
 * PUT    /api/contratos/pipelines/[id]/estagios/[estagioId] - Atualiza estágio
 * DELETE /api/contratos/pipelines/[id]/estagios/[estagioId] - Remove estágio (409 se há contratos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  findEstagioById,
  updateEstagio,
  deleteEstagio,
  countContratosByEstagioId,
  updateEstagioSchema,
} from '@/app/(authenticated)/contratos/pipelines';

type RouteContext = { params: Promise<{ id: string; estagioId: string }> };

/**
 * PUT /api/contratos/pipelines/[id]/estagios/[estagioId]
 *
 * Body: { nome?, slug?, cor?, ordem?, isDefault? }
 *
 * Se isDefault for true, o estágio anterior com is_default será desmarcado
 * automaticamente, garantindo exatamente um padrão por pipeline.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'editar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id, estagioId } = await params;
    const pipelineId = parseInt(id, 10);
    const estagioIdNum = parseInt(estagioId, 10);

    if (isNaN(pipelineId) || pipelineId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de pipeline inválido' },
        { status: 400 },
      );
    }

    if (isNaN(estagioIdNum) || estagioIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de estágio inválido' },
        { status: 400 },
      );
    }

    // Verifica que o estágio existe e pertence ao pipeline informado
    const estagioResult = await findEstagioById(estagioIdNum);
    if (!estagioResult.success) {
      return NextResponse.json(
        { success: false, error: estagioResult.error.message },
        { status: 500 },
      );
    }
    if (!estagioResult.data) {
      return NextResponse.json(
        { success: false, error: 'Estágio não encontrado' },
        { status: 404 },
      );
    }
    if (estagioResult.data.pipelineId !== pipelineId) {
      return NextResponse.json(
        { success: false, error: 'Estágio não pertence ao pipeline informado' },
        { status: 400 },
      );
    }

    const body = await request.json();

    const parseResult = updateEstagioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await updateEstagio(estagioIdNum, parseResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error(
      '[PUT /api/contratos/pipelines/[id]/estagios/[estagioId]]',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/contratos/pipelines/[id]/estagios/[estagioId]
 *
 * Retorna 409 Conflict se algum contrato ainda referencia este estágio.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'deletar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id, estagioId } = await params;
    const pipelineId = parseInt(id, 10);
    const estagioIdNum = parseInt(estagioId, 10);

    if (isNaN(pipelineId) || pipelineId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de pipeline inválido' },
        { status: 400 },
      );
    }

    if (isNaN(estagioIdNum) || estagioIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de estágio inválido' },
        { status: 400 },
      );
    }

    // Verifica que o estágio existe e pertence ao pipeline informado
    const estagioResult = await findEstagioById(estagioIdNum);
    if (!estagioResult.success) {
      return NextResponse.json(
        { success: false, error: estagioResult.error.message },
        { status: 500 },
      );
    }
    if (!estagioResult.data) {
      return NextResponse.json(
        { success: false, error: 'Estágio não encontrado' },
        { status: 404 },
      );
    }
    if (estagioResult.data.pipelineId !== pipelineId) {
      return NextResponse.json(
        { success: false, error: 'Estágio não pertence ao pipeline informado' },
        { status: 400 },
      );
    }

    // Bloqueia exclusão se há contratos neste estágio
    const countResult = await countContratosByEstagioId(estagioIdNum);
    if (!countResult.success) {
      return NextResponse.json(
        { success: false, error: countResult.error.message },
        { status: 500 },
      );
    }

    if (countResult.data > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível excluir o estágio pois há ${countResult.data} contrato(s) vinculado(s) a ele.`,
          code: 'CONFLICT',
          count: countResult.data,
        },
        { status: 409 },
      );
    }

    const result = await deleteEstagio(estagioIdNum);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Estágio excluído com sucesso',
    });
  } catch (error) {
    console.error(
      '[DELETE /api/contratos/pipelines/[id]/estagios/[estagioId]]',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 },
    );
  }
}
