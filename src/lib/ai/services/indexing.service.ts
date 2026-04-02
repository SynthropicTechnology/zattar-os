import type { IndexDocumentParams } from '../domain';
import { downloadFile } from './storage-adapter.service';
import { extractText, isContentTypeSupported } from './extraction.service';
import { chunkText } from './chunking.service';
import { generateEmbeddings } from './embedding.service';
import * as repository from '../repository';
import type { SupabaseClient } from '@supabase/supabase-js';

const MIN_TEXT_LENGTH = 50;

/**
 * Versão do repository que aceita cliente Supabase opcional (para scripts)
 */
async function deleteEmbeddingsByEntityWithClient(
  entity_type: string,
  entity_id: number,
  supabaseClient?: SupabaseClient
): Promise<void> {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('embeddings')
      .delete()
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id);
    if (error) {
      throw new Error(`Erro ao deletar embeddings: ${error.message}`);
    }
    return;
  }
  return repository.deleteEmbeddingsByEntity(entity_type, entity_id);
}

async function saveEmbeddingsWithClient(
  embeddings: Array<{
    content: string;
    embedding: number[];
    entity_type: string;
    entity_id: number;
    parent_id: number | null;
    metadata: Record<string, unknown>;
  }>,
  supabaseClient?: SupabaseClient
): Promise<void> {
  if (supabaseClient) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
      const batch = embeddings.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseClient.from('embeddings').insert(batch);
      if (error) {
        throw new Error(`Erro ao salvar embeddings (batch ${i / BATCH_SIZE}): ${error.message}`);
      }
    }
    return;
  }
  return repository.saveEmbeddings(embeddings);
}

export async function indexDocument(
  params: IndexDocumentParams,
  supabaseClient?: SupabaseClient
): Promise<void> {
  console.log(`🧠 [AI] Iniciando indexação: ${params.entity_type}/${params.entity_id}`);

  // Verificar se o tipo de conteúdo é suportado
  if (!isContentTypeSupported(params.content_type)) {
    console.warn(
      `⚠️ [AI] Tipo de conteúdo não suportado: ${params.content_type}. Pulando indexação.`
    );
    // Registrar tentativa falha nos metadados (opcional - pode ser usado para analytics)
    console.log(
      `📝 [AI] Tipo não suportado registrado: ${params.entity_type}/${params.entity_id} - ${params.content_type}`
    );
    return;
  }

  try {
    // 1. Baixar arquivo
    const buffer = await downloadFile(params.storage_provider, params.storage_key);
    console.log(`📥 [AI] Arquivo baixado: ${buffer.length} bytes`);

    // 2. Extrair texto
    const text = await extractText(buffer, params.content_type);
    console.log(`📄 [AI] Texto extraído: ${text.length} caracteres`);

    if (!text || text.trim().length < MIN_TEXT_LENGTH) {
      console.warn(
        `⚠️ [AI] Texto muito curto (${text.trim().length} chars), pulando indexação`
      );
      return;
    }

    // 3. Chunking
    const chunks = await chunkText(text, {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveParagraphs: true,
    });
    console.log(`✂️ [AI] Texto dividido em ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.warn(`⚠️ [AI] Nenhum chunk gerado, pulando indexação`);
      return;
    }

    // 4. Filtrar chunks com conteúdo vazio ANTES de gerar embeddings
    // Isso garante que chunks e embeddings tenham sempre o mesmo comprimento
    const validChunks = chunks.filter((chunk) => chunk.content.trim().length > 0);
    console.log(`✂️ [AI] ${validChunks.length} chunks válidos (${chunks.length - validChunks.length} vazios removidos)`);

    if (validChunks.length === 0) {
      console.warn(`⚠️ [AI] Nenhum chunk válido após filtro, pulando indexação`);
      return;
    }

    // 5. Gerar embeddings em batch usando apenas chunks válidos
    const texts = validChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts);
    console.log(`🔢 [AI] ${embeddings.length} embeddings gerados`);

    // Garantir que o comprimento seja idêntico
    if (validChunks.length !== embeddings.length) {
      throw new Error(
        `Desalinhamento: ${validChunks.length} chunks válidos mas ${embeddings.length} embeddings gerados`
      );
    }

    // 6. Remover embeddings antigos da mesma entidade
    await deleteEmbeddingsByEntityWithClient(params.entity_type, params.entity_id, supabaseClient);

    // 7. Salvar no banco usando arrays alinhados
    await saveEmbeddingsWithClient(
      validChunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        parent_id: params.parent_id ?? null,
        metadata: {
          ...params.metadata,
          chunk_index: chunk.index,
          start_char: chunk.metadata.start_char,
          end_char: chunk.metadata.end_char,
        },
      })),
      supabaseClient
    );

    console.log(`✅ [AI] Indexação concluída: ${validChunks.length} chunks salvos`);
  } catch (error) {
    console.error(`❌ [AI] Erro na indexação:`, error);
    throw error;
  }
}

export async function reindexDocument(params: IndexDocumentParams): Promise<void> {
  // Remove embeddings existentes e reindexa
  await repository.deleteEmbeddingsByEntity(params.entity_type, params.entity_id);
  await indexDocument(params);
}

/**
 * Indexa texto puro (sem arquivo) - usado para andamentos, comentários, etc.
 */
export async function indexText(
  text: string,
  params: {
    entity_type: IndexDocumentParams['entity_type'];
    entity_id: number;
    parent_id?: number | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  console.log(`🧠 [AI] Iniciando indexação de texto: ${params.entity_type}/${params.entity_id}`);

  const MIN_TEXT_LENGTH = 50;

  if (!text || text.trim().length < MIN_TEXT_LENGTH) {
    console.warn(
      `⚠️ [AI] Texto muito curto (${text.trim().length} chars), pulando indexação`
    );
    return;
  }

  try {
    // 1. Chunking
    const chunks = await chunkText(text, {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveParagraphs: true,
    });
    console.log(`✂️ [AI] Texto dividido em ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.warn(`⚠️ [AI] Nenhum chunk gerado, pulando indexação`);
      return;
    }

    // 2. Filtrar chunks com conteúdo vazio
    const validChunks = chunks.filter((chunk) => chunk.content.trim().length > 0);
    console.log(`✂️ [AI] ${validChunks.length} chunks válidos (${chunks.length - validChunks.length} vazios removidos)`);

    if (validChunks.length === 0) {
      console.warn(`⚠️ [AI] Nenhum chunk válido após filtro, pulando indexação`);
      return;
    }

    // 3. Gerar embeddings em batch
    const texts = validChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts);
    console.log(`🔢 [AI] ${embeddings.length} embeddings gerados`);

    // Garantir alinhamento
    if (validChunks.length !== embeddings.length) {
      throw new Error(
        `Desalinhamento: ${validChunks.length} chunks válidos mas ${embeddings.length} embeddings gerados`
      );
    }

    // 4. Remover embeddings antigos da mesma entidade
    await repository.deleteEmbeddingsByEntity(params.entity_type, params.entity_id);

    // 5. Salvar no banco
    await repository.saveEmbeddings(
      validChunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        parent_id: params.parent_id ?? null,
        metadata: {
          ...params.metadata,
          chunk_index: chunk.index,
          start_char: chunk.metadata.start_char,
          end_char: chunk.metadata.end_char,
        },
      }))
    );

    console.log(`✅ [AI] Indexação de texto concluída: ${validChunks.length} chunks salvos`);
  } catch (error) {
    console.error(`❌ [AI] Erro na indexação de texto:`, error);
    throw error;
  }
}
