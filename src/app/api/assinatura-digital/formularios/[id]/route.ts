import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  deleteFormulario,
  getFormulario,
  updateFormulario,
} from '@/app/(authenticated)/assinatura-digital/feature/services/formularios.service';
import type { UpsertFormularioInput } from '@/app/(authenticated)/assinatura-digital/feature';

const updateFormularioSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  segmento_id: z.coerce.number().optional(),
  descricao: z.string().optional().nullable(),
  form_schema: z.any().optional(),
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.coerce.number().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.string().optional(),
  criado_por: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id } = await params;
    const formulario = await getFormulario(id);
    if (!formulario) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter formulário';
    console.error('Erro em GET /assinatura-digital/formularios/[id]:', error);
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
    const { id } = await params;
    const body = await request.json();
    const payload = updateFormularioSchema.parse(body) as Partial<UpsertFormularioInput>;
    const formulario = await updateFormulario(id, payload);
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar formulário';
    console.error('Erro em PUT /assinatura-digital/formularios/[id]:', error);
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
    const { id } = await params;
    await deleteFormulario(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar formulário';
    console.error('Erro em DELETE /assinatura-digital/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}