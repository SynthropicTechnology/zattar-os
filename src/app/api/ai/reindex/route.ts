import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { indexDocument, reindexDocument } from '@/lib/ai/services/indexing.service';
import { indexDocumentSchema } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Validar parâmetros
    const validated = indexDocumentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { entity_type, entity_id, parent_id, storage_provider, storage_key, content_type, metadata } = validated.data;

    // Verificar se é reindexação (forçada)
    const forceReindex = body.force === true;

    if (forceReindex) {
      await reindexDocument({
        entity_type,
        entity_id,
        parent_id,
        storage_provider,
        storage_key,
        content_type,
        metadata: {
          ...metadata,
          reindexed_by: user.id,
          reindexed_at: new Date().toISOString(),
        },
      });
    } else {
      await indexDocument({
        entity_type,
        entity_id,
        parent_id,
        storage_provider,
        storage_key,
        content_type,
        metadata: {
          ...metadata,
          indexed_by: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: forceReindex ? 'Documento reindexado com sucesso' : 'Documento indexado com sucesso',
    });
  } catch (error) {
    console.error('[API] Erro na indexação:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
