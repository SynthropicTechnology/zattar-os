'use server';

import { authenticateRequest } from '@/lib/auth';
import { indexDocumentSchema } from '../domain';
import * as service from '../service';

export async function actionIndexarDocumento(
  params: {
    entity_type: string;
    entity_id: number;
    parent_id?: number | null;
    storage_provider: 'backblaze' | 'supabase' | 'google_drive';
    storage_key: string;
    content_type: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validated = indexDocumentSchema.parse(params);

    await service.indexDocument({
      ...validated,
      metadata: {
        ...validated.metadata,
        indexed_by: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[AI] Erro ao indexar documento:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionReindexarDocumento(
  params: {
    entity_type: string;
    entity_id: number;
    parent_id?: number | null;
    storage_provider: 'backblaze' | 'supabase' | 'google_drive';
    storage_key: string;
    content_type: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validated = indexDocumentSchema.parse(params);

    await service.reindexDocument({
      ...validated,
      metadata: {
        ...validated.metadata,
        reindexed_by: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[AI] Erro ao reindexar documento:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarEmbeddings(
  entityType: string,
  entityId: number
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    await service.deleteEmbeddings(entityType, entityId);

    return { success: true };
  } catch (error) {
    console.error('[AI] Erro ao deletar embeddings:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionVerificarIndexacao(
  entityType: string,
  entityId: number
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const isIndexed = await service.isIndexed(entityType, entityId);

    return { success: true, data: { isIndexed } };
  } catch (error) {
    console.error('[AI] Erro ao verificar indexação:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionObterContagemEmbeddings(
  entityType?: string,
  entityId?: number
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const count = await service.getEmbeddingsCount(entityType, entityId);

    return { success: true, data: { count } };
  } catch (error) {
    console.error('[AI] Erro ao obter contagem:', error);
    return { success: false, error: String(error) };
  }
}
