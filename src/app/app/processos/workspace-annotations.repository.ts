import 'server-only';

import { createDbClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/database.types';
import { appError, err, ok, type Result } from '@/types';
import type {
  CriarProcessoWorkspaceAnotacaoInput,
  ProcessoWorkspaceAnnotation,
} from './workspace-annotations-domain';

const TABLE_PROCESSO_WORKSPACE_ANOTACOES = 'processo_workspace_anotacoes';

type ProcessoWorkspaceAnnotationRow =
  Database['public']['Tables']['processo_workspace_anotacoes']['Row'];

function rowToProcessoWorkspaceAnnotation(
  row: ProcessoWorkspaceAnnotationRow
): ProcessoWorkspaceAnnotation {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    processoId: row.processo_id,
    numeroProcesso: row.numero_processo,
    timelineItemId: row.timeline_item_id,
    itemTitle: row.item_titulo,
    itemDate: row.item_data,
    content: row.conteudo,
    anchor: (row.anchor as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProcessoWorkspaceAnnotations(
  usuarioId: number,
  processoId: number
): Promise<Result<ProcessoWorkspaceAnnotation[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PROCESSO_WORKSPACE_ANOTACOES)
      .select(
        'id, usuario_id, processo_id, numero_processo, timeline_item_id, item_titulo, item_data, conteudo, anchor, created_at, updated_at'
      )
      .eq('usuario_id', usuarioId)
      .eq('processo_id', processoId)
      .order('created_at', { ascending: false });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(((data as ProcessoWorkspaceAnnotationRow[]) ?? []).map(rowToProcessoWorkspaceAnnotation));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar anotações do workspace do processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function createProcessoWorkspaceAnnotation(
  usuarioId: number,
  input: CriarProcessoWorkspaceAnotacaoInput
): Promise<Result<ProcessoWorkspaceAnnotation>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_PROCESSO_WORKSPACE_ANOTACOES)
      .insert({
        usuario_id: usuarioId,
        processo_id: input.processoId,
        numero_processo: input.numeroProcesso,
        timeline_item_id: input.timelineItemId,
        item_titulo: input.itemTitle ?? null,
        item_data: input.itemDate ?? null,
        conteudo: input.content,
        anchor: input.anchor ?? {},
      })
      .select(
        'id, usuario_id, processo_id, numero_processo, timeline_item_id, item_titulo, item_data, conteudo, anchor, created_at, updated_at'
      )
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(rowToProcessoWorkspaceAnnotation(data as ProcessoWorkspaceAnnotationRow));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar anotação do workspace do processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function deleteProcessoWorkspaceAnnotation(
  usuarioId: number,
  annotationId: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_PROCESSO_WORKSPACE_ANOTACOES)
      .delete()
      .eq('id', annotationId)
      .eq('usuario_id', usuarioId);

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao remover anotação do workspace do processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}