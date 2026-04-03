/**
 * API Routes — Pipelines de Contratos
 *
 * GET  /api/contratos/pipelines - Lista pipelines (com filtros opcionais)
 * POST /api/contratos/pipelines - Cria novo pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAuthentication } from '@/lib/auth/require-permission';
import {
  findAllPipelines,
  savePipeline,
  createPipelineSchema,
} from '@/app/(authenticated)/contratos/pipelines';

/**
 * GET /api/contratos/pipelines
 *
 * Query params:
 *   segmentoId?: number
 *   ativo?: boolean
 */
export async function GET(request: NextRequest) {
  // Pipelines são dados de referência/lookup — qualquer usuário autenticado pode ler
  const authOrError = await requireAuthentication(request);
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { searchParams } = new URL(request.url);

    const segmentoIdRaw = searchParams.get('segmentoId');
    const ativoRaw = searchParams.get('ativo');

    const segmentoId =
      segmentoIdRaw !== null ? parseInt(segmentoIdRaw, 10) : undefined;
    const ativo =
      ativoRaw !== null ? ativoRaw === 'true' : undefined;

    if (segmentoIdRaw !== null && (isNaN(segmentoId!) || segmentoId! <= 0)) {
      return NextResponse.json(
        { success: false, error: 'segmentoId deve ser um número inteiro positivo' },
        { status: 400 },
      );
    }

    const result = await findAllPipelines({ segmentoId, ativo });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[GET /api/contratos/pipelines]', error);
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
 * POST /api/contratos/pipelines
 *
 * Body: { segmentoId, nome, descricao? }
 */
export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contratos', 'criar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const body = await request.json();

    const parseResult = createPipelineSchema.safeParse(body);
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

    const result = await savePipeline(parseResult.data);

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
    console.error('[POST /api/contratos/pipelines]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 },
    );
  }
}
