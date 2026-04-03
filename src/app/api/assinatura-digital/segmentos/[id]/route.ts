import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  deleteSegmento,
  getSegmento,
  updateSegmento,
} from '@/app/(authenticated)/assinatura-digital/feature/services/segmentos.service';
import type { UpsertSegmentoInput } from '@/app/(authenticated)/assinatura-digital/feature';

const updateSegmentoSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const segmento = await getSegmento(id);
    if (!segmento) {
      return NextResponse.json({ error: 'Segmento não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: segmento });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter segmento';
    console.error('Erro em GET /assinatura-digital/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'editar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id: idStr } = await params;
    const body = await request.json();
    const payload = updateSegmentoSchema.parse(body) as Partial<UpsertSegmentoInput>;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const segmento = await updateSegmento(id, payload);
    return NextResponse.json({ success: true, data: segmento });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar segmento';
    console.error('Erro em PUT /assinatura-digital/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'deletar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await deleteSegmento(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar segmento';
    console.error('Erro em DELETE /assinatura-digital/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}