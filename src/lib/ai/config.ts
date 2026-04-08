/**
 * Configurações da camada de IA do Synthropic
 */

import type { EmbeddingModelConfig } from './types';

/**
 * Configuração padrão do modelo de embedding
 *
 * Usa OpenAI text-embedding-3-small por padrão.
 * Para mudar para Cohere, ajuste as variáveis de ambiente.
 */
export function getEmbeddingConfig(): EmbeddingModelConfig {
  const provider = (process.env.AI_EMBEDDING_PROVIDER || 'openai') as 'openai' | 'cohere';

  if (provider === 'cohere') {
    return {
      provider: 'cohere',
      model: process.env.COHERE_EMBEDDING_MODEL || 'embed-multilingual-v3.0',
      dimensions: 1024,
      maxTokensPerChunk: 512,
    };
  }

  // OpenAI padrão
  return {
    provider: 'openai',
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: 1536,
    maxTokensPerChunk: 512,
  };
}

/**
 * Configurações de chunking
 */
export const CHUNKING_CONFIG = {
  /** Tamanho máximo de caracteres por chunk (aproximadamente 512 tokens) */
  maxChunkSize: 2000,
  /** Overlap entre chunks para manter contexto */
  chunkOverlap: 200,
  /** Separadores para split de texto (em ordem de prioridade) */
  separators: ['\n\n', '\n', '. ', ', ', ' '],
};

/**
 * Configurações de busca semântica
 */
export const RETRIEVAL_CONFIG = {
  /** Threshold padrão de similaridade */
  defaultThreshold: 0.7,
  /** Número máximo padrão de resultados */
  defaultLimit: 10,
  /** Número máximo absoluto de resultados */
  maxLimit: 100,
};

/**
 * Configurações de cache de embeddings
 */
export const EMBEDDING_CACHE_CONFIG = {
  /** Habilitar cache de embeddings */
  enabled: process.env.AI_EMBEDDING_CACHE_ENABLED !== 'false',
  /** TTL do cache em segundos (7 dias) */
  ttl: parseInt(process.env.AI_EMBEDDING_CACHE_TTL || '604800', 10),
  /** Prefixo das chaves de cache */
  keyPrefix: 'embedding:',
};

/**
 * Verifica se as APIs de IA estão configuradas
 */
export function isAIConfigured(): boolean {
  const provider = process.env.AI_EMBEDDING_PROVIDER || 'openai';

  if (provider === 'openai') {
    return !!process.env.OPENAI_API_KEY;
  }

  if (provider === 'cohere') {
    return !!process.env.COHERE_API_KEY;
  }

  return false;
}

/**
 * Obtém a chave da API do provedor configurado
 */
export function getAIApiKey(): string {
  const provider = process.env.AI_EMBEDDING_PROVIDER || 'openai';

  if (provider === 'cohere') {
    const key = process.env.COHERE_API_KEY;
    if (!key) throw new Error('COHERE_API_KEY não configurada');
    return key;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY não configurada');
  return key;
}
