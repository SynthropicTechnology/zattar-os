'use server';

import { authenticateRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Enfileira uma peça de processo para indexação assíncrona via cron
 */
export async function actionIndexarPecaProcesso(
  processo_id: number,
  peca_id: number,
  storage_key: string,
  content_type: string
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar se indexação está habilitada
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[Processos] Indexação desabilitada via ENABLE_AI_INDEXING');
      return { success: true, message: 'Indexação desabilitada' };
    }

    // Enfileirar para processamento assíncrono
    queueMicrotask(async () => {
      try {
        const supabase = createServiceClient();
        await supabase.from('documentos_pendentes_indexacao').insert({
          tipo: 'processo',
          entity_id: peca_id,
          texto: '', // Será extraído pelo cron job
          metadata: {
            processo_id,
            storage_key,
            content_type,
            tipo: 'processo_peca',
            indexed_by: user.id,
            requer_extracao: true,
          },
        });
        console.log(`[Processos] Peça ${peca_id} do processo ${processo_id} adicionada à fila`);
      } catch (error) {
        console.error(`[Processos] Erro ao enfileirar peça ${peca_id}:`, error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[Processos] Erro na action de indexação de peça:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Enfileira um andamento de processo para indexação assíncrona via cron
 */
export async function actionIndexarAndamentoProcesso(
  processo_id: number,
  andamento_id: number,
  content: string
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar se indexação está habilitada
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[Processos] Indexação desabilitada via ENABLE_AI_INDEXING');
      return { success: true, message: 'Indexação desabilitada' };
    }

    // Enfileirar para processamento assíncrono
    queueMicrotask(async () => {
      try {
        const supabase = createServiceClient();
        await supabase.from('documentos_pendentes_indexacao').insert({
          tipo: 'processo',
          entity_id: andamento_id,
          texto: content,
          metadata: {
            processo_id,
            tipo: 'processo_andamento',
            indexed_by: user.id,
          },
        });
        console.log(`[Processos] Andamento ${andamento_id} do processo ${processo_id} adicionado à fila`);
      } catch (error) {
        console.error(`[Processos] Erro ao enfileirar andamento ${andamento_id}:`, error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[Processos] Erro na action de indexação de andamento:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reindexação em lote de todas as peças de um processo
 */
export async function actionReindexarProcesso(processo_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar se indexação está habilitada
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[Processos] Indexação desabilitada via ENABLE_AI_INDEXING');
      return { success: true, message: 'Indexação desabilitada' };
    }

    // Enfileirar reindexação assíncrona
    queueMicrotask(async () => {
      try {
        const supabase = createServiceClient();
        const { createClient } = await import('@/lib/supabase/server');

        console.log(`[Processos] Iniciando reindexação do processo ${processo_id}`);

        // Buscar todas as peças indexadas anteriormente
        const db = await createClient();
        const { data: uploads } = await db
          .from('documentos_uploads')
          .select('id, b2_key, tipo_mime, nome_arquivo, documento_id')
          .limit(1000);

        console.log(`[Processos] Encontrados ${uploads?.length || 0} uploads candidatos a peças`);

        // Enfileirar cada peça para reindexação
        if (uploads && uploads.length > 0) {
          for (const upload of uploads) {
            await supabase.from('documentos_pendentes_indexacao').insert({
              tipo: 'processo',
              entity_id: upload.id,
              texto: '',
              metadata: {
                processo_id,
                storage_key: upload.b2_key,
                content_type: upload.tipo_mime,
                tipo: 'processo_peca',
                indexed_by: user.id,
                nome_arquivo: upload.nome_arquivo,
                documento_id: upload.documento_id,
                requer_extracao: true,
              },
            });
          }
          console.log(`[Processos] ${uploads.length} peças enfileradas para reindexação`);
        }
      } catch (error) {
        console.error(`[Processos] Erro na reindexação do processo ${processo_id}:`, error);
      }
    });

    return {
      success: true,
      message: `Reindexação do processo ${processo_id} agendada. As peças serão reindexadas em background.`,
    };
  } catch (error) {
    console.error('[Processos] Erro na action de reindexação do processo:', error);
    return { success: false, error: String(error) };
  }
}

