import type { SearchParams, SearchResult, IndexDocumentParams } from './domain';
import * as repository from './repository';
import { indexDocument as indexDoc, reindexDocument as reindexDoc } from './services/indexing.service';

/**
 * Busca conhecimento na base vetorial usando busca semântica
 */
export async function searchKnowledge(params: SearchParams): Promise<SearchResult[]> {
  return repository.searchEmbeddings(params);
}

/**
 * Indexa um documento na base vetorial
 * Usado internamente pelo sistema de uploads
 */
export async function indexDocument(params: IndexDocumentParams): Promise<void> {
  return indexDoc(params);
}

/**
 * Reindexa um documento (remove embeddings antigos e cria novos)
 */
export async function reindexDocument(params: IndexDocumentParams): Promise<void> {
  return reindexDoc(params);
}

/**
 * Remove embeddings de uma entidade específica
 */
export async function deleteEmbeddings(
  entityType: string,
  entityId: number
): Promise<void> {
  return repository.deleteEmbeddingsByEntity(entityType, entityId);
}

/**
 * Remove todos os embeddings relacionados a um parent (ex: processo)
 */
export async function deleteEmbeddingsByParent(parentId: number): Promise<void> {
  return repository.deleteEmbeddingsByParent(parentId);
}

/**
 * Verifica se uma entidade já possui embeddings indexados
 */
export async function isIndexed(entityType: string, entityId: number): Promise<boolean> {
  return repository.hasEmbeddings(entityType, entityId);
}

/**
 * Retorna a contagem de embeddings por entidade ou total
 */
export async function getEmbeddingsCount(
  entityType?: string,
  entityId?: number
): Promise<number> {
  return repository.getEmbeddingsCount(entityType, entityId);
}
