import { createClient } from '@/lib/supabase/server';
import type { Embedding, SearchParams, SearchResult, EntityType } from './domain';

export async function saveEmbeddings(
  embeddings: Omit<Embedding, 'id'>[]
): Promise<void> {
  const supabase = await createClient();

  // Inserir em batches para evitar payload muito grande
  const BATCH_SIZE = 100;
  for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
    const batch = embeddings.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('embeddings').insert(batch);

    if (error) {
      throw new Error(`Erro ao salvar embeddings (batch ${i / BATCH_SIZE}): ${error.message}`);
    }
  }
}

export async function searchEmbeddings(params: SearchParams): Promise<SearchResult[]> {
  const supabase = await createClient();
  const { generateEmbedding } = await import('./services/embedding.service');

  const queryVector = await generateEmbedding(params.query);

  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryVector,
    match_threshold: params.match_threshold ?? 0.7,
    match_count: params.match_count ?? 5,
    filter_entity_type: params.filter_entity_type ?? null,
    filter_parent_id: params.filter_parent_id ?? null,
    filter_metadata: params.filter_metadata ?? null,
  });

  if (error) {
    throw new Error(`Erro na busca semântica: ${error.message}`);
  }

  return (data ?? []) as SearchResult[];
}

export async function deleteEmbeddingsByEntity(
  entity_type: EntityType | string,
  entity_id: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('embeddings')
    .delete()
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id);

  if (error) {
    throw new Error(`Erro ao deletar embeddings: ${error.message}`);
  }
}

export async function deleteEmbeddingsByParent(parent_id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('embeddings')
    .delete()
    .eq('parent_id', parent_id);

  if (error) {
    throw new Error(`Erro ao deletar embeddings por parent: ${error.message}`);
  }
}

export async function getEmbeddingsCount(
  entity_type?: EntityType | string,
  entity_id?: number
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from('embeddings')
    .select('*', { count: 'exact', head: true });

  if (entity_type) {
    query = query.eq('entity_type', entity_type);
  }

  if (entity_id) {
    query = query.eq('entity_id', entity_id);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao contar embeddings: ${error.message}`);
  }

  return count ?? 0;
}

export async function hasEmbeddings(
  entity_type: EntityType | string,
  entity_id: number
): Promise<boolean> {
  const count = await getEmbeddingsCount(entity_type, entity_id);
  return count > 0;
}
