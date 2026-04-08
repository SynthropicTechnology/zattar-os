/**
 * Camada de Inteligência Artificial do Synthropic
 *
 * Exporta funções para:
 * - Geração de embeddings
 * - Indexação de documentos
 * - Busca semântica (RAG)
 * - Resumo de chamadas
 */

// Tipos
export type {
  DocumentoMetadata,
  IndexarDocumentoParams,
  ResultadoBuscaSemantica,
  BuscaSemanticaOptions,
  EmbeddingModelConfig,
  TextChunk,
  IndexacaoStatus,
} from './types';

// Configuração
export {
  getEmbeddingConfig,
  isAIConfigured,
  CHUNKING_CONFIG,
  RETRIEVAL_CONFIG,
  EMBEDDING_CACHE_CONFIG,
} from './config';

// Embeddings
export {
  gerarEmbedding,
  gerarEmbeddingsBatch,
  gerarEmbeddingQuery,
} from './embedding';

// Indexação
export {
  indexarDocumento,
  removerDocumentoDoIndice,
  atualizarDocumentoNoIndice,
  reindexarTudo,
} from './indexing';

// Busca/Retrieval
export {
  buscaSemantica,
  buscarSimilares,
  buscaHibrida,
  obterContextoRAG,
} from './retrieval';

// Summarization
export * from './summarization';

// Domain
export * from './domain';

// Service
export * from './service';

// Actions
export * from './actions/embeddings-actions';
export * from './actions/search-actions';

// Components
export { RAGChat } from './components/rag-chat';

// Services (para uso interno ou avançado)
export { generateEmbedding, generateEmbeddings } from './services/embedding.service';
export { chunkText, type Chunk, type ChunkOptions } from './services/chunking.service';
export { extractText, isContentTypeSupported, getSupportedContentTypes } from './services/extraction.service';
export { downloadFile, extractKeyFromUrl, getMimeType, type StorageProvider } from './services/storage-adapter.service';
export { indexDocument, reindexDocument } from './services/indexing.service';
