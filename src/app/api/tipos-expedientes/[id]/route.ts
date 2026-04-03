import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { buscar, atualizar, deletar } from '@/app/(authenticated)/tipos-expedientes';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await props.params;
    const id = Number(idStr);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await buscar(id);
    if (!data) {
      return NextResponse.json({ error: 'Tipo de expediente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar tipo de expediente:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await props.params;
    const id = Number(idStr);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const tipoExpediente = body.tipo_expediente || body.tipoExpediente;

    if (!tipoExpediente) {
      return NextResponse.json({ error: 'Campo tipo de expediente é obrigatório' }, { status: 400 });
    }

    const data = await atualizar(id, { tipoExpediente });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao atualizar tipo de expediente:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    let status = 500;

    if (msg.includes('não encontrado')) status = 404;
    else if (msg.includes('já cadastrado') || msg.includes('inválido')) status = 400;

    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await props.params;
    const id = Number(idStr);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await deletar(id);

    return NextResponse.json({ success: true, message: 'Tipo de expediente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tipo de expediente:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    let status = 500;

    if (msg.includes('não encontrado')) status = 404;
    else if (msg.includes('em uso') || msg.includes('não pode ser deletado')) status = 400;

    return NextResponse.json({ error: msg }, { status });
  }
}
