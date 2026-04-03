import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  createFormulario,
  listFormularios,
} from '@/app/(authenticated)/assinatura-digital/feature/services/formularios.service';
import type { UpsertFormularioInput } from '@/app/(authenticated)/assinatura-digital/feature';

const contratoConfigSchema = z.object({
  tipo_contrato_id: z.number().int().positive(),
  tipo_cobranca_id: z.number().int().positive(),
  papel_cliente: z.enum(['autora', 're']),
  pipeline_id: z.number().int().positive(),
});

const upsertFormularioSchema = z.object({
  nome: z.string().min(1),
  slug: z.string().min(1),
  segmento_id: z.coerce.number(),
  descricao: z.string().optional().nullable(),
  form_schema: z.any().optional(),
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().nullable().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.string().optional(),
  criado_por: z.string().optional().nullable(),
  tipo_formulario: z.enum(['contrato', 'documento', 'cadastro']).nullable().optional(),
  contrato_config: contratoConfigSchema.nullable().optional(),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Suporta múltiplos segmento_id via getAll
    const segmentoIds = searchParams.getAll('segmento_id');
    const segmento_id = segmentoIds.length > 0
      ? segmentoIds.map(id => Number(id)).filter(id => !isNaN(id))
      : undefined;

    const ativoParam = searchParams.get('ativo');
    const fotoNecessariaParam = searchParams.get('foto_necessaria');
    const geolocationNecessariaParam = searchParams.get('geolocation_necessaria');
    const search = searchParams.get('search') ?? undefined;

    const result = await listFormularios({
      segmento_id: segmento_id && segmento_id.length > 0 ? segmento_id : undefined,
      ativo: ativoParam === null ? undefined : ativoParam === 'true',
      foto_necessaria: fotoNecessariaParam === null ? undefined : fotoNecessariaParam === 'true',
      geolocation_necessaria: geolocationNecessariaParam === null ? undefined : geolocationNecessariaParam === 'true',
      search,
    });

    return NextResponse.json({ success: true, data: result.formularios, total: result.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar formulários';
    console.error('Erro em GET /assinatura-digital/formularios:', error);
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
    const payload = upsertFormularioSchema.parse(body) as UpsertFormularioInput;
    const formulario = await createFormulario(payload);
    return NextResponse.json({ success: true, data: formulario }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar formulário';
    console.error('Erro em POST /assinatura-digital/formularios:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}