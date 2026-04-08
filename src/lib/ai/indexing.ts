/**
 * Pipeline de indexação de documentos para o Synthropic
 *
 * ⚠️ LEGACY: Este módulo está descontinuado.
 * Use src/features/ai/services/indexing.service.ts para novas implementações.
 * Este módulo usa a tabela embeddings_conhecimento (legacy).
 * O novo sistema usa public.embeddings e a função match_embeddings.
 *
 * Responsável por:
 * - Chunking inteligente de textos
 * - Geração de embeddings
 * - Armazenamento no Supabase (pgvector)
 */

import { createClient } from '@/lib/supabase/server';
import { gerarEmbedding } from './embedding';
import { CHUNKING_CONFIG } from './config';
import type { IndexarDocumentoParams, IndexacaoStatus, TextChunk, DocumentoMetadata } from './types';

/**
 * Divide texto em chunks respeitando limites de tokens
 */
function chunkTexto(texto: string): TextChunk[] {
  const { maxChunkSize, chunkOverlap, separators } = CHUNKING_CONFIG;
  const chunks: TextChunk[] = [];

  // Texto muito pequeno - retorna como único chunk
  if (texto.length <= maxChunkSize) {
    return [{ texto, index: 0, offset: 0 }];
  }

  let offset = 0;
  let index = 0;

  while (offset < texto.length) {
    // Determina o fim do chunk
    let end = Math.min(offset + maxChunkSize, texto.length);

    // Se não é o último chunk, tenta quebrar em um separador natural
    if (end < texto.length) {
      let bestBreak = -1;

      for (const separator of separators) {
        const searchArea = texto.substring(offset + maxChunkSize - 200, end);
        const lastIndex = searchArea.lastIndexOf(separator);

        if (lastIndex !== -1) {
          bestBreak = offset + maxChunkSize - 200 + lastIndex + separator.length;
          break;
        }
      }

      if (bestBreak !== -1 && bestBreak > offset) {
        end = bestBreak;
      }
    }

    // Extrai o chunk
    const chunkTexto = texto.substring(offset, end).trim();

    if (chunkTexto) {
      chunks.push({
        texto: chunkTexto,
        index,
        offset,
      });
      index++;
    }

    // Move para o próximo chunk com overlap
    offset = end - chunkOverlap;
    if (offset <= chunks[chunks.length - 1]?.offset) {
      offset = end; // Evita loop infinito
    }
  }

  return chunks;
}

/**
 * Indexa um documento no sistema de busca semântica
 *
 * @param params - Parâmetros do documento a indexar
 * @returns Status da indexação
 *
 * @example
 * ```ts
 * await indexarDocumento({
 *   texto: 'Processo 0001234-12.2024.5.00.0000 - João vs Empresa XYZ',
 *   metadata: {
 *     tipo: 'processo',
 *     id: 123,
 *     numeroProcesso: '0001234-12.2024.5.00.0000',
 *     status: 'ativo'
 *   }
 * });
 * ```
 */
export async function indexarDocumento(params: IndexarDocumentoParams): Promise<IndexacaoStatus> {
  const { texto, metadata } = params;

  try {
    // 1. Dividir texto em chunks
    const chunks = chunkTexto(texto);

    if (chunks.length === 0) {
      return {
        success: false,
        chunksIndexados: 0,
        embeddingIds: [],
        error: 'Texto vazio ou inválido para indexação',
      };
    }

    const supabase = await createClient();
    const embeddingIds: number[] = [];

    // 2. Processar em batches para reduzir I/O
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      // Gerar embeddings do batch em paralelo
      const embeddings = await Promise.all(batch.map((chunk) => gerarEmbedding(chunk.texto)));

      // Preparar payload do batch
      const batchData = batch.map((chunk, idx) => ({
        texto: chunk.texto,
        embedding: embeddings[idx],
        metadata: {
          ...metadata,
          chunkIndex: chunk.index,
          chunkOffset: chunk.offset,
          totalChunks: chunks.length,
        },
      }));

      const { data, error } = await supabase
        .from('embeddings_conhecimento')
        .insert(batchData)
        .select('id');

      if (error) {
        console.error(`[Indexing] Erro ao inserir batch ${Math.floor(i / BATCH_SIZE)}:`, error);
        throw new Error(`Erro ao inserir batch: ${error.message}`);
      }

      if (data) {
        embeddingIds.push(...data.map((d: { id: number }) => d.id));
      }
    }

    return {
      success: true,
      chunksIndexados: chunks.length,
      embeddingIds,
    };
  } catch (error) {
    console.error('[Indexing] Erro na indexação:', error);
    return {
      success: false,
      chunksIndexados: 0,
      embeddingIds: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido na indexação',
    };
  }
}

/**
 * Remove embeddings de um documento do índice
 *
 * @param tipo - Tipo do documento
 * @param id - ID do documento original
 */
export async function removerDocumentoDoIndice(
  tipo: DocumentoMetadata['tipo'],
  id: number
): Promise<{ success: boolean; removidos: number; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('embeddings_conhecimento')
      .delete()
      .eq('metadata->tipo', tipo)
      .eq('metadata->id', id)
      .select('id');

    if (error) {
      throw new Error(`Erro ao remover embeddings: ${error.message}`);
    }

    return {
      success: true,
      removidos: data?.length || 0,
    };
  } catch (error) {
    console.error('[Indexing] Erro ao remover do índice:', error);
    return {
      success: false,
      removidos: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza embeddings de um documento
 *
 * Remove os embeddings antigos e cria novos
 */
export async function atualizarDocumentoNoIndice(
  params: IndexarDocumentoParams
): Promise<IndexacaoStatus> {
  const { metadata } = params;

  // Remove embeddings antigos
  await removerDocumentoDoIndice(metadata.tipo, metadata.id);

  // Cria novos embeddings
  return indexarDocumento(params);
}

/**
 * Reindexação completa de todos os documentos
 *
 * ATENÇÃO: Operação custosa! Usar com cuidado.
 */
export async function reindexarTudo(): Promise<{
  success: boolean;
  estatisticas: {
    processos: number;
    documentos: number;
    audiencias: number;
    expedientes: number;
    erros: number;
  };
}> {
  const supabase = await createClient();

  const estatisticas = {
    processos: 0,
    documentos: 0,
    audiencias: 0,
    expedientes: 0,
    erros: 0,
  };

  try {
    // 1. Limpar embeddings existentes
    console.log('[Reindex] Removendo embeddings antigos...');
    await supabase.from('embeddings_conhecimento').delete().neq('id', 0);

    // 2. Reindexar processos (em lotes com delay e concorrência controlada)
    console.log('[Reindex] Indexando processos...');
    const { data: processos } = await supabase
      .from('processos')
      .select('id, numero_processo, classe_judicial, nome_parte_autora, nome_parte_re, descricao_orgao_julgador, codigo_status_processo, grau, trt')
      .order('id');

    const PROC_BATCH_SIZE = 100;
    const DELAY_MS = 5000; // 5s entre batches
    const CONCURRENCY_LIMIT = 10;

    for (let i = 0; i < (processos || []).length; i += PROC_BATCH_SIZE) {
      const batch = (processos || []).slice(i, i + PROC_BATCH_SIZE);
      console.log(
        `[Reindex] Processando batch de processos ${Math.floor(i / PROC_BATCH_SIZE) + 1}/${Math.ceil(((processos || []).length) / PROC_BATCH_SIZE)}`
      );

      for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
        const concurrentBatch = batch.slice(j, j + CONCURRENCY_LIMIT);
        await Promise.allSettled(
          concurrentBatch.map(async (processo) => {
            try {
              const texto = `
                Processo ${processo.numero_processo}
                Classe: ${processo.classe_judicial || 'N/A'}
                Parte Autora: ${processo.nome_parte_autora || 'N/A'}
                Parte Ré: ${processo.nome_parte_re || 'N/A'}
                Órgão: ${processo.descricao_orgao_julgador || 'N/A'}
                Status: ${processo.codigo_status_processo || 'N/A'}
              `.trim();

              await indexarDocumento({
                texto,
                metadata: {
                  tipo: 'processo',
                  id: processo.id,
                  numeroProcesso: processo.numero_processo,
                  status: processo.codigo_status_processo,
                  grau: processo.grau,
                  trt: processo.trt,
                },
              });

              estatisticas.processos++;
            } catch (error) {
              console.error(`[Reindex] Erro ao indexar processo ${processo.id}:`, error);
              estatisticas.erros++;
            }
          })
        );
      }

      if (i + PROC_BATCH_SIZE < (processos || []).length) {
        console.log(`[Reindex] Aguardando ${DELAY_MS}ms antes do próximo batch de processos...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
    console.log(`[Reindex] ${estatisticas.processos} processos indexados`);

    // 3. Reindexar audiências (em lotes com delay e concorrência controlada)
    console.log('[Reindex] Indexando audiências...');
    const { data: audiencias } = await supabase
      .from('audiencias')
      .select('id, processo_id, tipo_audiencia, data_audiencia, observacoes')
      .order('id');

    const AUD_BATCH_SIZE = 100;
    for (let i = 0; i < (audiencias || []).length; i += AUD_BATCH_SIZE) {
      const batch = (audiencias || []).slice(i, i + AUD_BATCH_SIZE);
      console.log(
        `[Reindex] Processando batch de audiências ${Math.floor(i / AUD_BATCH_SIZE) + 1}/${Math.ceil(((audiencias || []).length) / AUD_BATCH_SIZE)}`
      );

      for (let j = 0; j < batch.length; j += CONCURRENCY_LIMIT) {
        const concurrentBatch = batch.slice(j, j + CONCURRENCY_LIMIT);
        await Promise.allSettled(
          concurrentBatch.map(async (audiencia) => {
            try {
              const texto = `
                Audiência do tipo ${audiencia.tipo_audiencia || 'N/A'}
                Data: ${audiencia.data_audiencia || 'N/A'}
                Observações: ${audiencia.observacoes || 'N/A'}
              `.trim();

              await indexarDocumento({
                texto,
                metadata: {
                  tipo: 'audiencia',
                  id: audiencia.id,
                  processoId: audiencia.processo_id,
                  dataReferencia: audiencia.data_audiencia,
                },
              });

              estatisticas.audiencias++;
            } catch (error) {
              console.error(`[Reindex] Erro ao indexar audiência ${audiencia.id}:`, error);
              estatisticas.erros++;
            }
          })
        );
      }

      if (i + AUD_BATCH_SIZE < (audiencias || []).length) {
        console.log(`[Reindex] Aguardando ${DELAY_MS}ms antes do próximo batch de audiências...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
    console.log(`[Reindex] ${estatisticas.audiencias} audiências indexadas`);

    console.log('[Reindex] Reindexação completa!');
    console.log(`[Reindex] Estatísticas:`, estatisticas);

    return { success: true, estatisticas };
  } catch (error) {
    console.error('[Reindex] Erro na reindexação:', error);
    return { success: false, estatisticas };
  }
}
