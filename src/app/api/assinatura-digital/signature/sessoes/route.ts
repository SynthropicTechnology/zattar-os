import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import { listSessoes } from '@/shared/assinatura-digital/services/signature.service';
import type { ListSessoesParams } from '@/shared/assinatura-digital';

const querySchema = z.object({
  segmento_id: z.string().optional(),
  formulario_id: z.string().optional(),
  status: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const params: ListSessoesParams = {
      segmento_id: parsed.segmento_id ? Number(parsed.segmento_id) : undefined,
      formulario_id: parsed.formulario_id ? Number(parsed.formulario_id) : undefined,
      status: parsed.status,
      data_inicio: parsed.data_inicio,
      data_fim: parsed.data_fim,
      search: parsed.search,
      page: parsed.page ? Number(parsed.page) : undefined,
      pageSize: parsed.pageSize ? Number(parsed.pageSize) : undefined,
    };

    const result = await listSessoes(params);
    return NextResponse.json({ success: true, data: result.sessoes, total: result.total, page: result.page, pageSize: result.pageSize });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', issues: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao listar sessões';
    console.error('Erro em GET /assinatura-digital/signature/sessoes:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
