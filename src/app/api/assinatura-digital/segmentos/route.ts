import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  createSegmento,
  listSegmentos,
  getSegmentoBySlugAdmin,
} from '@/app/(authenticated)/assinatura-digital/feature/services/segmentos.service';
import type { UpsertSegmentoInput } from '@/app/(authenticated)/assinatura-digital/feature';

const upsertSegmentoSchema = z.object({
  nome: z.string().min(1),
  slug: z.string().min(1),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Check for exact slug lookup (for uniqueness validation)
    const slugParam = searchParams.get('slug');
    if (slugParam) {
      const segmento = await getSegmentoBySlugAdmin(slugParam);
      return NextResponse.json({
        success: true,
        data: segmento,
        exists: segmento !== null,
      });
    }

    // Regular listing with filters
    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search') ?? undefined;

    const result = await listSegmentos({
      ativo: ativoParam === null ? undefined : ativoParam === 'true',
      search,
    });

    return NextResponse.json({ success: true, data: result.segmentos, total: result.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar segmentos';
    console.error('Erro em GET /assinatura-digital/segmentos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = upsertSegmentoSchema.parse(body) as UpsertSegmentoInput;
    const segmento = await createSegmento(payload);
    return NextResponse.json({ success: true, data: segmento }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar segmento';
    console.error('Erro em POST /assinatura-digital/segmentos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}