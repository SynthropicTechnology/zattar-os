/**
 * Módulo de geração de embeddings para o Synthropic
 *
 * Suporta OpenAI e Cohere como provedores.
 * Inclui cache em Redis para otimização.
 */

import { createHash } from 'crypto';
import { getRedisClient } from '@/lib/redis/client';
import {
  getEmbeddingConfig,
  getAIApiKey,
  isAIConfigured,
  EMBEDDING_CACHE_CONFIG,
} from './config';

/**
 * Gera um hash MD5 do texto para uso como chave de cache
 */
function hashTexto(texto: string): string {
  return createHash('md5').update(texto).digest('hex');
}

/**
 * Tenta obter embedding do cache
 */
async function getFromCache(texto: string): Promise<number[] | null> {
  if (!EMBEDDING_CACHE_CONFIG.enabled) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `${EMBEDDING_CACHE_CONFIG.keyPrefix}${hashTexto(texto)}`;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('[Embedding] Erro ao buscar do cache:', error);
  }

  return null;
}

/**
 * Salva embedding no cache
 */
async function saveToCache(texto: string, embedding: number[]): Promise<void> {
  if (!EMBEDDING_CACHE_CONFIG.enabled) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `${EMBEDDING_CACHE_CONFIG.keyPrefix}${hashTexto(texto)}`;
    await redis.setex(key, EMBEDDING_CACHE_CONFIG.ttl, JSON.stringify(embedding));
  } catch (error) {
    console.warn('[Embedding] Erro ao salvar no cache:', error);
  }
}

/**
 * Gera embedding usando OpenAI
 */
async function gerarEmbeddingOpenAI(texto: string): Promise<number[]> {
  const config = getEmbeddingConfig();
  const apiKey = getAIApiKey();

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texto,
      model: config.model,
      dimensions: config.dimensions,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Gera embedding usando Cohere
 */
async function gerarEmbeddingCohere(texto: string): Promise<number[]> {
  const config = getEmbeddingConfig();
  const apiKey = getAIApiKey();

  const response = await fetch('https://api.cohere.ai/v1/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      texts: [texto],
      model: config.model,
      input_type: 'search_document',
      truncate: 'END',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Cohere API Error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.embeddings[0];
}

/**
 * Gera embedding de texto
 *
 * @param texto - Texto para gerar embedding
 * @returns Vetor de embedding (número de dimensões depende do modelo)
 *
 * @example
 * ```ts
 * const embedding = await gerarEmbedding('Texto para indexar');
 * // embedding = [0.123, -0.456, 0.789, ...]
 * ```
 */
export async function gerarEmbedding(texto: string): Promise<number[]> {
  if (!isAIConfigured()) {
    throw new Error('API de IA não configurada. Configure OPENAI_API_KEY ou COHERE_API_KEY.');
  }

  // Normalizar texto
  const textoNormalizado = texto.trim().replace(/\s+/g, ' ');

  if (!textoNormalizado) {
    throw new Error('Texto vazio não pode ser convertido em embedding');
  }

  // Tentar cache primeiro
  const cached = await getFromCache(textoNormalizado);
  if (cached) {
    return cached;
  }

  // Gerar embedding
  const config = getEmbeddingConfig();
  let embedding: number[];

  if (config.provider === 'cohere') {
    embedding = await gerarEmbeddingCohere(textoNormalizado);
  } else {
    embedding = await gerarEmbeddingOpenAI(textoNormalizado);
  }

  // Salvar no cache
  await saveToCache(textoNormalizado, embedding);

  return embedding;
}

/**
 * Gera embeddings para múltiplos textos em batch
 *
 * @param textos - Array de textos para gerar embeddings
 * @returns Array de vetores de embedding
 */
export async function gerarEmbeddingsBatch(textos: string[]): Promise<number[][]> {
  // Para simplicidade, processa sequencialmente com cache
  // Em produção, pode ser otimizado para batch API calls
  const embeddings: number[][] = [];

  for (const texto of textos) {
    const embedding = await gerarEmbedding(texto);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * Gera embedding para query de busca
 *
 * Para Cohere, usa input_type diferente para queries
 */
export async function gerarEmbeddingQuery(query: string): Promise<number[]> {
  if (!isAIConfigured()) {
    throw new Error('API de IA não configurada. Configure OPENAI_API_KEY ou COHERE_API_KEY.');
  }

  const config = getEmbeddingConfig();
  const queryNormalizada = query.trim().replace(/\s+/g, ' ');

  if (!queryNormalizada) {
    throw new Error('Query vazia não pode ser convertida em embedding');
  }

  // Para queries, não usamos cache pois geralmente são únicas
  if (config.provider === 'cohere') {
    const apiKey = getAIApiKey();

    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        texts: [queryNormalizada],
        model: config.model,
        input_type: 'search_query',
        truncate: 'END',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Cohere API Error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  }

  // OpenAI não diferencia query de documento
  return gerarEmbeddingOpenAI(queryNormalizada);
}
