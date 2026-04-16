import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from '@/shared/assinatura-digital/services/templates.service';
import type { UpsertTemplateInput } from '@/shared/assinatura-digital';

const updateSchema = z.object({
  template_uuid: z.string().uuid().optional(),
  nome: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  arquivo_original: z.string().min(1).optional(),
  arquivo_nome: z.string().min(1).optional(),
  arquivo_tamanho: z.coerce.number().optional(),
  pdf_url: z.string().optional().nullable(),
  status: z.string().optional(),
  versao: z.coerce.number().int().optional(),
  ativo: z.boolean().optional(),
  campos: z.string().optional(),
  conteudo_markdown: z.string().optional().nullable(),
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
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter template';
    console.error('Erro em GET /assinatura-digital/templates/[id]:', error);
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
    const payload = updateSchema.parse(body) as Partial<UpsertTemplateInput>;
    const template = await updateTemplate(id, payload);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar template';
    console.error('Erro em PUT /assinatura-digital/templates/[id]:', error);
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
    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar template';
    console.error('Erro em DELETE /assinatura-digital/templates/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}