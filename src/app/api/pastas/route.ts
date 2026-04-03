/**
 * API Routes para pastas
 *
 * GET /api/pastas - Lista pastas
 * POST /api/pastas - Cria nova pasta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  listarPastasComContadores,
  criarPasta,
  buscarHierarquiaPastas,
} from '@/app/(authenticated)/documentos/service';
import type { CriarPastaParams } from '@/app/(authenticated)/documentos';

/**
 * GET /api/pastas
 * Lista pastas com contadores ou hierarquia
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const modo = searchParams.get('modo') ?? 'lista'; // 'lista' ou 'hierarquia'
    const pasta_pai_id = searchParams.get('pasta_pai_id')
      ? searchParams.get('pasta_pai_id') === 'null'
        ? null
        : parseInt(searchParams.get('pasta_pai_id')!)
      : undefined;
    const incluir_documentos = searchParams.get('incluir_documentos') === 'true';

    if (modo === 'hierarquia') {
      const hierarquia = await buscarHierarquiaPastas(
        pasta_pai_id,
        incluir_documentos,
        authResult.usuario.id
      );

      return NextResponse.json({
        success: true,
        data: hierarquia,
      });
    } else {
      const pastas = await listarPastasComContadores(
        pasta_pai_id,
        authResult.usuario.id
      );

      return NextResponse.json({
        success: true,
        data: pastas,
      });
    }
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
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
 * POST /api/pastas
 * Cria uma nova pasta
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CriarPastaParams = await request.json();

    // Validação
    if (!body.nome || body.nome.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (body.nome.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Nome muito longo (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    if (!body.tipo || !['comum', 'privada'].includes(body.tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido (comum ou privada)' },
        { status: 400 }
      );
    }

    const pasta = await criarPasta(body, authResult.usuario.id);

    return NextResponse.json(
      { success: true, data: pasta },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
