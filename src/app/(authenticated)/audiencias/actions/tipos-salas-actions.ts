'use server';

import { createDbClient } from '@/lib/supabase';
import type { ActionResult } from './audiencias-actions';

export async function actionListarTiposAudiencia(params?: {
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; descricao: string; is_virtual: boolean }>>> {
  try {
    const db = createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 200, 1), 1000);

    const { data, error } = await db
      .from('tipo_audiencia')
      .select('id, descricao, is_virtual')
      .order('descricao', { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar tipos de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; descricao: string; is_virtual: boolean }>) ?? [], message: 'Tipos listados com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar tipos de audiência.',
    };
  }
}

export async function actionListarSalasAudiencia(params?: {
  trt?: string;
  grau?: string;
  orgao_julgador_id?: number;
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; nome: string }>>> {
  try {
    const db = createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 500, 1), 2000);

    let query = db
      .from('sala_audiencia')
      .select('id, nome')
      .order('nome', { ascending: true })
      .limit(limit);

    if (params?.trt) query = query.eq('trt', params.trt);
    if (params?.grau) query = query.eq('grau', params.grau);
    if (params?.orgao_julgador_id) query = query.eq('orgao_julgador_id', params.orgao_julgador_id);

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar salas de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; nome: string }>) ?? [], message: 'Salas listadas com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar salas de audiência.',
    };
  }
}
