'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';
import { capturarTimeline, type CapturaTimelineParams } from '../services/timeline/timeline-capture.service';
import { relinkBackblazeDocumentos } from '../services/timeline/timeline-relink.service';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function createErrorResponse(error: unknown, defaultMessage: string): ActionResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage,
  };
}

/**
 * Captures process timeline from TRT PJE
 *
 * Timeline is persisted directly to PostgreSQL (acervo.timeline_jsonb)
 * for improved query performance and simplified architecture.
 */
export async function actionCapturarTimeline(
  params: CapturaTimelineParams
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Check permission
    // Assuming 'acervo' permission covers this, or maybe there's a specific 'captura' permission
    const hasPermission = await checkPermission(user.id, 'acervo', 'editar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para capturar timeline' };
    }

    console.log('📋 [actionCapturarTimeline] Iniciando captura', params);

    // Timeline will be automatically persisted to PostgreSQL (timeline_jsonb) during capture
    const result = await capturarTimeline(params);

    console.log('✅ [actionCapturarTimeline] Captura concluída', {
      totalItens: result.totalItens,
      totalBaixadosSucesso: result.totalBaixadosSucesso,
    });

    // Strip large buffers if any (though capturarTimeline returns lighter structure mostly)
    const resultSanitized = {
      ...result,
      documentosBaixados: result.documentosBaixados.map((doc) => ({
        detalhes: doc.detalhes,
        pdfTamanho: doc.pdf?.length,
        erro: doc.erro,
      })),
    };

    // Revalidate relevant paths
    revalidatePath(`/app/processos/${params.processoId}/timeline`);
    revalidatePath(`/app/processos/${params.processoId}`);

    return { success: true, data: resultSanitized };
  } catch (error) {
    console.error('[actionCapturarTimeline] Error:', error);
    return createErrorResponse(error, 'Erro ao capturar timeline');
  }
}

/**
 * Re-vincula documentos do Backblaze B2 aos itens da timeline.
 *
 * Útil quando os links foram perdidos no banco mas os PDFs ainda existem
 * no Backblaze. Lista os arquivos pelo prefixo do processo, extrai o
 * documentoId do nome (`doc_{id}.pdf`), e reconstrói o campo `backblaze`.
 *
 * Não requer autenticação no PJE — opera apenas no Backblaze e PostgreSQL.
 */
export async function actionRelinkBackblaze(
  processoIdPje: string,
  numeroProcesso: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const hasPermission = await checkPermission(user.id, 'acervo', 'editar');
    if (!hasPermission) {
      return { success: false, error: 'Sem permissão para relinkar documentos' };
    }

    console.log('[actionRelinkBackblaze] Iniciando relink', { processoIdPje, numeroProcesso });

    const result = await relinkBackblazeDocumentos(processoIdPje, numeroProcesso);

    console.log('[actionRelinkBackblaze] Relink concluído', result);

    // Revalidate relevant paths
    revalidatePath(`/app/processos/${processoIdPje}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('[actionRelinkBackblaze] Error:', error);
    return createErrorResponse(error, 'Erro ao re-vincular documentos do Backblaze');
  }
}
