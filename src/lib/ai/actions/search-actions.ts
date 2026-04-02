'use server';

import { authenticateRequest } from '@/lib/auth';
import { searchSchema } from '../domain';
import * as service from '../service';

export async function actionBuscarConhecimento(
  query: string,
  filters?: {
    entity_type?: string;
    parent_id?: number;
    match_threshold?: number;
    match_count?: number;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const params = searchSchema.parse({
      query,
      match_threshold: filters?.match_threshold ?? 0.7,
      match_count: filters?.match_count ?? 5,
      filter_entity_type: filters?.entity_type,
      filter_parent_id: filters?.parent_id,
      filter_metadata: filters?.metadata,
    });

    const results = await service.searchKnowledge(params);

    return { success: true, data: results };
  } catch (error) {
    console.error('[AI] Erro na busca semântica:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarNoProcesso(
  processoId: number,
  query: string,
  options?: {
    match_threshold?: number;
    match_count?: number;
  }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const results = await service.searchKnowledge({
      query,
      match_threshold: options?.match_threshold ?? 0.7,
      match_count: options?.match_count ?? 10,
      filter_parent_id: processoId,
    });

    return { success: true, data: results };
  } catch (error) {
    console.error('[AI] Erro na busca no processo:', error);
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarPorTipoEntidade(
  entityType: string,
  query: string,
  options?: {
    match_threshold?: number;
    match_count?: number;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const results = await service.searchKnowledge({
      query,
      match_threshold: options?.match_threshold ?? 0.7,
      match_count: options?.match_count ?? 10,
      filter_entity_type: entityType,
      filter_metadata: options?.metadata,
    });

    return { success: true, data: results };
  } catch (error) {
    console.error('[AI] Erro na busca por tipo:', error);
    return { success: false, error: String(error) };
  }
}
