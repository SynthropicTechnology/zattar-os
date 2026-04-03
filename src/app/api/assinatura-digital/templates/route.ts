import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  createTemplate,
  listTemplates,
} from '@/app/(authenticated)/assinatura-digital/feature/services/templates.service';
import type { UpsertTemplateInput, StatusTemplate } from '@/app/(authenticated)/assinatura-digital/feature';

const VALID_STATUS_VALUES: StatusTemplate[] = ['ativo', 'inativo', 'rascunho'];

const upsertTemplateSchema = z.object({
  template_uuid: z.string().uuid().optional(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  arquivo_original: z.string().min(1),
  arquivo_nome: z.string().min(1),
  arquivo_tamanho: z.coerce.number(),
  status: z.string().optional(),
  versao: z.coerce.number().int().optional(),
  ativo: z.boolean().optional(),
  campos: z.string().optional(),
  conteudo_markdown: z.string().optional().nullable(),
  criado_por: z.string().optional().nullable(),
  pdf_url: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const ativoParam = searchParams.get('ativo');
    const ativo = ativoParam === null ? undefined : ativoParam === 'true';

    // Validate and parse status parameter
    const statusParam = searchParams.get('status');
    const status = statusParam && VALID_STATUS_VALUES.includes(statusParam as StatusTemplate)
      ? (statusParam as StatusTemplate)
      : undefined;

    // Parse segmento_id parameter
    const segmentoIdParam = searchParams.get('segmento_id');
    const segmento_id = segmentoIdParam ? Number(segmentoIdParam) : undefined;

    const result = await listTemplates({ search, ativo, status, segmento_id });
    return NextResponse.json({ success: true, data: result.templates, total: result.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar templates';
    console.error('Erro em GET /assinatura-digital/templates:', error);
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
    const payload = upsertTemplateSchema.parse(body) as UpsertTemplateInput;
    const template = await createTemplate(payload);
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar template';
    console.error('Erro em POST /assinatura-digital/templates:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}