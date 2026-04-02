import { NextRequest, NextResponse } from 'next/server';
import { createDifyServiceForApp } from '@/lib/dify/factory';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const appId = formData.get('app_id') as string | null;
    const user = (formData.get('user') as string) || 'anonymous-user';

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    if (!appId) {
      return NextResponse.json({ error: 'app_id é obrigatório' }, { status: 400 });
    }

    const service = await createDifyServiceForApp(appId);
    const result = await service.uploadArquivo(file, user);

    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.value);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload', details: message },
      { status: 500 }
    );
  }
}
