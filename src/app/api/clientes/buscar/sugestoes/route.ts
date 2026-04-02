import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { listarClientes } from '@/app/app/partes/server';

/**
 * GET /api/clientes/buscar/sugestoes
 *
 * Retorna sugestões de clientes para autocomplete
 *
 * Query params:
 * - limit: número máximo de sugestões (default: 20, max: 100)
 * - search: termo de busca opcional
 */
export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'clientes', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') ?? undefined;

    const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 20;

    // Chamar service diretamente (não Server Action)
    const result = await listarClientes({ pagina: 1, limite: limit, busca: search });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    // Mapear para formato de opções
    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.cpf,
      cnpj: c.cnpj,
    }));

    return NextResponse.json({ success: true, data: { options } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar sugestões de clientes';
    console.error('Erro em GET /api/clientes/buscar/sugestoes:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
