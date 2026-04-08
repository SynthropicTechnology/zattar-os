/**
 * Módulo de busca semântica para o Synthropic
 *
 * ⚠️ LEGACY: Este módulo está descontinuado.
 * Use src/features/ai/repository.ts e searchEmbeddings() para novas implementações.
 * Este módulo usa a tabela embeddings_conhecimento (legacy).
 * O novo sistema usa public.embeddings e a função match_embeddings.
 *
 * Implementa busca por similaridade de vetores usando pgvector no Supabase
 */

import { createClient } from '@/lib/supabase/server';
import { gerarEmbeddingQuery } from './embedding';
import { RETRIEVAL_CONFIG } from './config';
import type { BuscaSemanticaOptions, ResultadoBuscaSemantica, DocumentoMetadata } from './types';

/**
 * Realiza busca semântica no conhecimento indexado
 *
 * @param query - Texto da busca
 * @param options - Opções de busca (limite, threshold, filtros)
 * @returns Lista de resultados ordenados por similaridade
 *
 * @example
 * ```ts
 * const resultados = await buscaSemantica('processo trabalhista', {
 *   limite: 5,
 *   filtros: { tipo: 'processo' }
 * });
 *
 * for (const r of resultados) {
 *   console.log(`${r.metadata.tipo} (${r.similaridade.toFixed(2)}): ${r.texto}`);
 * }
 * ```
 */
export async function buscaSemantica(
  query: string,
  options: BuscaSemanticaOptions = {}
): Promise<ResultadoBuscaSemantica[]> {
  const {
    limite = RETRIEVAL_CONFIG.defaultLimit,
    threshold = RETRIEVAL_CONFIG.defaultThreshold,
    filtros = {},
  } = options;

  // Limitar quantidade de resultados
  const limiteAjustado = Math.min(limite, RETRIEVAL_CONFIG.maxLimit);

  try {
    // 1. Gerar embedding da query
    const queryEmbedding = await gerarEmbeddingQuery(query);

    // 2. Buscar no Supabase usando função RPC
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('buscar_conhecimento_semantico', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limiteAjustado,
      filter_metadata: Object.keys(filtros).length > 0 ? filtros : {},
    });

    if (error) {
      console.error('[Retrieval] Erro na busca semântica:', error);
      throw new Error(`Erro na busca semântica: ${error.message}`);
    }

    // 3. Mapear resultados
    return (data || []).map((row: { id: number; texto: string; metadata: DocumentoMetadata; similarity: number }) => ({
      id: row.id,
      texto: row.texto,
      metadata: row.metadata as DocumentoMetadata,
      similaridade: row.similarity,
    }));
  } catch (error) {
    console.error('[Retrieval] Erro:', error);
    throw error;
  }
}

/**
 * Busca documentos similares a um documento específico
 *
 * @param tipo - Tipo do documento de referência
 * @param id - ID do documento de referência
 * @param limite - Número máximo de resultados
 */
export async function buscarSimilares(
  tipo: DocumentoMetadata['tipo'],
  id: number,
  limite: number = 5
): Promise<ResultadoBuscaSemantica[]> {
  const supabase = await createClient();

  // 1. Buscar embedding do documento de referência
  const { data: docRef, error: refError } = await supabase
    .from('embeddings_conhecimento')
    .select('embedding, texto')
    .eq('metadata->tipo', tipo)
    .eq('metadata->id', id)
    .eq('metadata->chunkIndex', 0) // Pega o primeiro chunk
    .single();

  if (refError || !docRef) {
    throw new Error(`Documento de referência não encontrado: ${tipo}/${id}`);
  }

  // 2. Buscar similares usando o embedding do documento
  const { data, error } = await supabase.rpc('buscar_conhecimento_semantico', {
    query_embedding: docRef.embedding,
    match_threshold: RETRIEVAL_CONFIG.defaultThreshold,
    match_count: limite + 1, // +1 porque pode incluir o próprio documento
    filter_metadata: {},
  });

  if (error) {
    throw new Error(`Erro na busca de similares: ${error.message}`);
  }

  // 3. Filtrar o próprio documento e mapear resultados
  return (data || [])
    .filter((row: { metadata: DocumentoMetadata }) => !(row.metadata.tipo === tipo && row.metadata.id === id))
    .slice(0, limite)
    .map((row: { id: number; texto: string; metadata: DocumentoMetadata; similarity: number }) => ({
      id: row.id,
      texto: row.texto,
      metadata: row.metadata as DocumentoMetadata,
      similaridade: row.similarity,
    }));
}

/**
 * Busca híbrida: combina busca semântica com busca textual
 *
 * @param query - Texto da busca
 * @param options - Opções de busca
 */
export async function buscaHibrida(
  query: string,
  options: BuscaSemanticaOptions = {}
): Promise<ResultadoBuscaSemantica[]> {
  const { limite = RETRIEVAL_CONFIG.defaultLimit, filtros = {} } = options;

  const supabase = await createClient();

  // 1. Busca semântica
  const resultadosSemanticos = await buscaSemantica(query, {
    ...options,
    limite: limite * 2, // Busca mais para combinar
  });

  // 2. Busca textual simples (ILIKE)
  let textQuery = supabase
    .from('embeddings_conhecimento')
    .select('id, texto, metadata')
    .ilike('texto', `%${query}%`)
    .limit(limite);

  // Aplicar filtros
  if (filtros.tipo) {
    textQuery = textQuery.eq('metadata->tipo', filtros.tipo);
  }

  const { data: resultadosTextuais } = await textQuery;

  // 3. Combinar e deduplicar resultados
  const idsVistos = new Set<number>();
  const resultadosCombinados: ResultadoBuscaSemantica[] = [];

  // Adiciona semânticos primeiro (maior relevância)
  for (const r of resultadosSemanticos) {
    if (!idsVistos.has(r.id)) {
      idsVistos.add(r.id);
      resultadosCombinados.push(r);
    }
  }

  // Adiciona textuais que não estão nos semânticos (com similaridade menor)
  for (const r of resultadosTextuais || []) {
    if (!idsVistos.has(r.id)) {
      idsVistos.add(r.id);
      resultadosCombinados.push({
        id: r.id,
        texto: r.texto,
        metadata: r.metadata as DocumentoMetadata,
        similaridade: 0.5, // Score arbitrário para matches textuais
      });
    }
  }

  // Retorna limitado
  return resultadosCombinados.slice(0, limite);
}

/**
 * Obtém contexto RAG para uso com LLMs
 *
 * @param query - Pergunta ou contexto da busca
 * @param maxTokens - Número máximo aproximado de tokens no contexto
 */
export async function obterContextoRAG(
  query: string,
  maxTokens: number = 2000
): Promise<{ contexto: string; fontes: ResultadoBuscaSemantica[] }> {
  // Buscar documentos relevantes
  const resultados = await buscaSemantica(query, {
    limite: 10,
    threshold: 0.65, // Threshold mais baixo para mais contexto
  });

  // Construir contexto respeitando limite de tokens
  // Aproximação: 1 token ~ 4 caracteres
  const maxChars = maxTokens * 4;
  let contexto = '';
  const fontesUsadas: ResultadoBuscaSemantica[] = [];

  for (const r of resultados) {
    const trecho = `[${r.metadata.tipo.toUpperCase()} ID:${r.metadata.id}]\n${r.texto}\n\n`;

    if (contexto.length + trecho.length > maxChars) {
      break;
    }

    contexto += trecho;
    fontesUsadas.push(r);
  }

  return {
    contexto: contexto.trim(),
    fontes: fontesUsadas,
  };
}
