import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { searchKnowledge } from '@/lib/ai';
import { searchSchema } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Validar parâmetros
    const validated = searchSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validated.error.format() },
        { status: 400 }
      );
    }

    const results = await searchKnowledge(validated.data);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('[API] Erro na busca semântica:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Parâmetro "q" é obrigatório' }, { status: 400 });
    }

    const params = {
      query,
      match_threshold: parseFloat(searchParams.get('threshold') ?? '0.7'),
      match_count: parseInt(searchParams.get('limit') ?? '5'),
      filter_entity_type: searchParams.get('entity_type') || undefined,
      filter_parent_id: searchParams.get('parent_id')
        ? parseInt(searchParams.get('parent_id')!)
        : undefined,
    };

    const validated = searchSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validated.error.format() },
        { status: 400 }
      );
    }

    const results = await searchKnowledge(validated.data);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('[API] Erro na busca semântica:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
