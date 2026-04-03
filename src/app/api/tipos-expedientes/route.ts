import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { listar, criar } from '@/app/(authenticated)/tipos-expedientes';
import { ListarTiposExpedientesParams } from '@/app/(authenticated)/tipos-expedientes';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Map legacy query params to new params
    const params: Partial<ListarTiposExpedientesParams> = {
      pagina: searchParams.get('pagina') ? Number(searchParams.get('pagina')) : undefined,
      limite: searchParams.get('limite') ? Number(searchParams.get('limite')) : undefined,
      busca: searchParams.get('busca') || undefined,
      ordenarPor: (searchParams.get('ordenar_por') as 'tipoExpediente' | 'createdAt' | 'updatedAt' | undefined) || 'tipoExpediente',
      ordem: (searchParams.get('ordem') as 'asc' | 'desc' | undefined) || 'asc',
    };

    // Fix ordenação se vier snake_case
    if (searchParams.get('ordenar_por') === 'tipo_expediente') params.ordenarPor = 'tipoExpediente';
    if (searchParams.get('ordenar_por') === 'created_at') params.ordenarPor = 'createdAt';
    if (searchParams.get('ordenar_por') === 'updated_at') params.ordenarPor = 'updatedAt';

    const result = await listar(params);

    return NextResponse.json({
      success: true,
      data: result, // { data: [], meta: {} }
    });
  } catch (error) {
    console.error('Erro ao listar tipos de expedientes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Support both snake_case (legacy) and camelCase
    const tipoExpediente = body.tipo_expediente || body.tipoExpediente;

    if (!tipoExpediente) {
      return NextResponse.json(
        { error: 'Campo tipo_expediente é obrigatório' },
        { status: 400 }
      );
    }

    const result = await criar({ tipoExpediente }, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tipo de expediente:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    const status = msg.includes('já cadastrado') ? 400 : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
