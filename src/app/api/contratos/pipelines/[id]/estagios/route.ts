/**
 * API Routes — Estágios de um Pipeline
 *
 * POST /api/contratos/pipelines/[id]/estagios - Cria novo estágio no pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  findPipelineById,
  saveEstagio,
  createEstagioSchema,
} from '@/app/(authenticated)/contratos/pipelines';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/contratos/pipelines/[id]/estagios
 *
 * Body: { nome, slug, cor?, ordem?, isDefault? }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const authOrError = await requirePermission(request, 'contratos', 'criar');
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

    // Verifica que o pipeline existe antes de criar o estágio
    const pipelineResult = await findPipelineById(pipelineId);
    if (!pipelineResult.success) {
      return NextResponse.json(
        { success: false, error: pipelineResult.error.message },
        { status: 500 },
      );
    }
    if (!pipelineResult.data) {
      return NextResponse.json(
        { success: false, error: 'Pipeline não encontrado' },
        { status: 404 },
      );
    }

    const body = await request.json();

    const parseResult = createEstagioSchema.safeParse(body);
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

    const result = await saveEstagio(pipelineId, parseResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/contratos/pipelines/[id]/estagios]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 },
    );
  }
}
