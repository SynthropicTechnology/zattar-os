'use server';

/**
 * Server Actions para Busca Semântica
 *
 * Implementa busca por similaridade de vetores usando a camada de IA
 */

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import {
  buscaSemantica,
  buscaHibrida,
  obterContextoRAG,
  buscarSimilares,
} from '@/lib/ai/retrieval';
import type { DocumentoMetadata } from '@/lib/ai/types';

// =============================================================================
// SCHEMAS
// =============================================================================

const buscaSemanticaSchema = z.object({
  query: z.string().min(3, 'A busca deve ter pelo menos 3 caracteres'),
  tipo: z
    .enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro'])
    .optional()
    .describe('Filtrar por tipo de documento'),
  limite: z.number().min(1).max(50).describe('Número máximo de resultados'),
  threshold: z
    .number()
    .min(0)
    .max(1)
    .describe('Limiar mínimo de similaridade (0-1)'),
});

const buscaHibridaSchema = z.object({
  query: z.string().min(3, 'A busca deve ter pelo menos 3 caracteres'),
  tipo: z
    .enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro'])
    .optional(),
  limite: z.number().min(1).max(50),
});

const contextoRAGSchema = z.object({
  query: z.string().min(3, 'A pergunta deve ter pelo menos 3 caracteres'),
  maxTokens: z.number().min(500).max(8000),
});

const buscarSimilaresSchema = z.object({
  tipo: z.enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro']),
  id: z.number().int().positive(),
  limite: z.number().min(1).max(20),
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Busca semântica no conhecimento indexado
 *
 * Usa embeddings e similaridade de cosseno para encontrar documentos relevantes.
 */
async function buscaSemanticaHandler(data: z.infer<typeof buscaSemanticaSchema>) {
  const limite = data.limite ?? 10;
  const threshold = data.threshold ?? 0.7;
  const filtros: Partial<DocumentoMetadata> = data.tipo ? { tipo: data.tipo } : {};

  const resultados = await buscaSemantica(data.query, {
    limite,
    threshold,
    filtros,
  });

  return {
    query: data.query,
    total: resultados.length,
    resultados: resultados.map((r) => ({
      id: r.id,
      texto: r.texto.length > 500 ? r.texto.substring(0, 500) + '...' : r.texto,
      tipo: r.metadata.tipo,
      documentoId: r.metadata.id,
      processoId: r.metadata.processoId,
      numeroProcesso: r.metadata.numeroProcesso,
      similaridade: Math.round(r.similaridade * 100) / 100,
    })),
  };
}

export async function actionBuscaSemantica(input: BuscaSemanticaInput) {
  const action = authenticatedAction(buscaSemanticaSchema, buscaSemanticaHandler);
  const result = await action(input);
  if (result && typeof result === 'object' && 'success' in result) return result;
  return { success: true, data: result };
}

/**
 * Busca híbrida combinando semântica e textual
 *
 * Combina busca por similaridade de vetores com busca textual tradicional.
 */
async function buscaHibridaHandler(data: z.infer<typeof buscaHibridaSchema>) {
  const limite = data.limite ?? 10;
  const filtros: Partial<DocumentoMetadata> = data.tipo ? { tipo: data.tipo } : {};

  const resultados = await buscaHibrida(data.query, {
    limite,
    filtros,
  });

  return {
    query: data.query,
    total: resultados.length,
    resultados: resultados.map((r) => ({
      id: r.id,
      texto: r.texto.length > 500 ? r.texto.substring(0, 500) + '...' : r.texto,
      tipo: r.metadata.tipo,
      documentoId: r.metadata.id,
      processoId: r.metadata.processoId,
      similaridade: Math.round(r.similaridade * 100) / 100,
    })),
  };
}

export async function actionBuscaHibrida(input: BuscaHibridaInput) {
  const action = authenticatedAction(buscaHibridaSchema, buscaHibridaHandler);
  const result = await action(input);
  if (result && typeof result === 'object' && 'success' in result) return result;
  return { success: true, data: result };
}

/**
 * Obtém contexto RAG para uso com LLMs
 *
 * Retorna texto formatado com documentos relevantes para uso em prompts.
 */
async function obterContextoRAGHandler(data: z.infer<typeof contextoRAGSchema>) {
  const maxTokens = data.maxTokens ?? 2000;
  const { contexto, fontes } = await obterContextoRAG(data.query, maxTokens);

  return {
    query: data.query,
    contexto,
    fontesUsadas: fontes.length,
    fontes: fontes.map((f) => ({
      tipo: f.metadata.tipo,
      id: f.metadata.id,
      similaridade: Math.round(f.similaridade * 100) / 100,
    })),
  };
}

export async function actionObterContextoRAG(input: ContextoRAGInput) {
  const action = authenticatedAction(contextoRAGSchema, obterContextoRAGHandler);
  const result = await action(input);
  if (result && typeof result === 'object' && 'success' in result) return result;
  return { success: true, data: result };
}

/**
 * Busca documentos similares a um documento específico
 *
 * Encontra documentos com conteúdo semelhante ao documento de referência.
 */
async function buscarSimilaresHandler(data: z.infer<typeof buscarSimilaresSchema>) {
  const limite = data.limite ?? 5;
  const resultados = await buscarSimilares(data.tipo, data.id, limite);

  return {
    referencia: { tipo: data.tipo, id: data.id },
    total: resultados.length,
    similares: resultados.map((r) => ({
      id: r.id,
      texto: r.texto.length > 300 ? r.texto.substring(0, 300) + '...' : r.texto,
      tipo: r.metadata.tipo,
      documentoId: r.metadata.id,
      similaridade: Math.round(r.similaridade * 100) / 100,
    })),
  };
}

export async function actionBuscarSimilares(input: BuscarSimilaresInput) {
  const action = authenticatedAction(buscarSimilaresSchema, buscarSimilaresHandler);
  const result = await action(input);
  if (result && typeof result === 'object' && 'success' in result) return result;
  return { success: true, data: result };
}

// =============================================================================
// TIPOS EXPORTADOS
// =============================================================================

export type BuscaSemanticaInput = z.infer<typeof buscaSemanticaSchema>;
export type BuscaHibridaInput = z.infer<typeof buscaHibridaSchema>;
export type ContextoRAGInput = z.infer<typeof contextoRAGSchema>;
export type BuscarSimilaresInput = z.infer<typeof buscarSimilaresSchema>;
