/**
 * API Routes — Pipeline de Contrato por ID
 *
 * GET    /api/contratos/pipelines/[id] - Busca pipeline pelo ID
 * PUT    /api/contratos/pipelines/[id] - Atualiza pipeline
 * DELETE /api/contratos/pipelines/[id] - Remove pipeline (409 se há contratos vinculados)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  findPipelineById,
  updatePipeline,
  deletePipeline,
  countContratosByPipelineId,
  updatePipelineSchema,
} from '@/app/(authenticated)/contratos/pipelines';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/contratos/pipelines/[id]
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'visualizar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id } = await params;
    const pipelineId = parseInt(id, 10);

    if (isNaN(pipelineId) || pipelineId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de pipeline inválido' },
        { status: 400 },
      );
    }

    const result = await findPipelineById(pipelineId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Pipeline não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[GET /api/contratos/pipelines/[id]]', error);
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
 * PUT /api/contratos/pipelines/[id]
 *
 * Body: { nome?, descricao?, ativo? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'editar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id } = await params;
    const pipelineId = parseInt(id, 10);

    if (isNaN(pipelineId) || pipelineId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de pipeline inválido' },
        { status: 400 },
      );
    }

    const existsResult = await findPipelineById(pipelineId);
    if (!existsResult.success) {
      return NextResponse.json(
        { success: false, error: existsResult.error.message },
        { status: 500 },
      );
    }
    if (!existsResult.data) {
      return NextResponse.json(
        { success: false, error: 'Pipeline não encontrado' },
        { status: 404 },
      );
    }

    const body = await request.json();

    const parseResult = updatePipelineSchema.safeParse(body);
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

    const result = await updatePipeline(pipelineId, parseResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[PUT /api/contratos/pipelines/[id]]', error);
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
 * DELETE /api/contratos/pipelines/[id]
 *
 * Retorna 409 Conflict se algum contrato ainda referencia um estágio deste pipeline.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'deletar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id } = await params;
    const pipelineId = parseInt(id, 10);

    if (isNaN(pipelineId) || pipelineId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de pipeline inválido' },
        { status: 400 },
      );
    }

    const existsResult = await findPipelineById(pipelineId);
    if (!existsResult.success) {
      return NextResponse.json(
        { success: false, error: existsResult.error.message },
        { status: 500 },
      );
    }
    if (!existsResult.data) {
      return NextResponse.json(
        { success: false, error: 'Pipeline não encontrado' },
        { status: 404 },
      );
    }

    // Bloqueia exclusão se há contratos vinculados aos estágios deste pipeline
    const countResult = await countContratosByPipelineId(pipelineId);
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
          error: `Não é possível excluir o pipeline pois há ${countResult.data} contrato(s) vinculado(s) aos seus estágios.`,
          code: 'CONFLICT',
          count: countResult.data,
        },
        { status: 409 },
      );
    }

    const result = await deletePipeline(pipelineId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pipeline excluído com sucesso',
    });
  } catch (error) {
    console.error('[DELETE /api/contratos/pipelines/[id]]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 },
    );
  }
}
