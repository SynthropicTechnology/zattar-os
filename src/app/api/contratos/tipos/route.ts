/**
 * API Route: /api/contratos/tipos
 *
 * GET  - Lista tipos de contrato (com filtros opcionais)
 * POST - Cria um novo tipo de contrato
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission, requireAuthentication } from '@/lib/auth/require-permission';
import {
  contratoTiposRepo,
  createContratoTipoSchema,
} from '@/app/(authenticated)/contratos/tipos-config';

export async function GET(request: NextRequest) {
  // Tipos de contrato são dados de referência/lookup — qualquer usuário autenticado pode ler
  const authOrError = await requireAuthentication(request);
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);

    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search') ?? undefined;

    const ativo =
      ativoParam === null ? undefined : ativoParam === 'true';

    const result = await contratoTiposRepo.findAll({ ativo, search });

    if (!result.success) {
      console.error('Erro em GET /api/contratos/tipos:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.data.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao listar tipos de contrato';
    console.error('Erro em GET /api/contratos/tipos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contratos', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = createContratoTipoSchema.parse(body);

    const result = await contratoTiposRepo.save(payload);

    if (!result.success) {
      if (result.error.code === 'CONFLICT') {
        return NextResponse.json({ error: result.error.message }, { status: 409 });
      }
      console.error('Erro em POST /api/contratos/tipos:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Erro ao criar tipo de contrato';
    console.error('Erro em POST /api/contratos/tipos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
