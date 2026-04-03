/**
 * API Route — Reordenação de Estágios de um Pipeline
 *
 * PUT /api/contratos/pipelines/[id]/estagios/reorder
 *
 * Recebe um array de IDs de estágios na nova ordem desejada.
 * O índice de cada ID no array determina seu novo valor de `ordem`.
 *
 * Exemplo de body:
 * { "estagioIds": [3, 1, 4, 2] }
 * → estágio 3 fica ordem 0, estágio 1 fica ordem 1, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  findPipelineById,
  reorderEstagios,
  reorderEstagiosSchema,
} from '@/app/(authenticated)/contratos/pipelines';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/contratos/pipelines/[id]/estagios/reorder
 *
 * Body: { estagioIds: number[] }
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

    // Verifica que o pipeline existe
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

    const parseResult = reorderEstagiosSchema.safeParse(body);
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

    // Valida que todos os IDs informados pertencem ao pipeline
    const pipeline = pipelineResult.data;
    const pipelineEstagioIds = new Set(pipeline.estagios.map((e) => e.id));
    const idsInvalidos = parseResult.data.estagioIds.filter(
      (id) => !pipelineEstagioIds.has(id),
    );

    if (idsInvalidos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Os seguintes IDs de estágio não pertencem ao pipeline: ${idsInvalidos.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const result = await reorderEstagios(
      pipelineId,
      parseResult.data.estagioIds,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error(
      '[PUT /api/contratos/pipelines/[id]/estagios/reorder]',
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
