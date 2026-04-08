/**
 * Tipos compartilhados para a camada de IA do Synthropic
 */

/**
 * Metadados de um documento indexado
 */
export interface DocumentoMetadata {
  /** Tipo do documento (processo, documento, audiencia, expediente, etc.) */
  tipo: 'processo' | 'documento' | 'audiencia' | 'expediente' | 'cliente' | 'lancamento' | 'outro';
  /** ID do registro original */
  id: number;
  /** ID do processo relacionado (se aplicável) */
  processoId?: number;
  /** Número do processo (se aplicável) */
  numeroProcesso?: string;
  /** Status/estado do registro */
  status?: string;
  /** Grau do processo (se aplicável) */
  grau?: string;
  /** TRT relacionado (se aplicável) */
  trt?: string;
  /** Categoria do documento (se aplicável) */
  categoria?: string;
  /** Data de referência */
  dataReferencia?: string;
  /** Metadados adicionais */
  [key: string]: unknown;
}

/**
 * Parâmetros para indexação de documento
 */
export interface IndexarDocumentoParams {
  /** Texto a ser indexado */
  texto: string;
  /** Metadados do documento */
  metadata: DocumentoMetadata;
}

/**
 * Resultado de uma busca semântica
 */
export interface ResultadoBuscaSemantica {
  /** ID do embedding */
  id: number;
  /** Texto original */
  texto: string;
  /** Metadados associados */
  metadata: DocumentoMetadata;
  /** Pontuação de similaridade (0 a 1) */
  similaridade: number;
}

/**
 * Opções para busca semântica
 */
export interface BuscaSemanticaOptions {
  /** Número máximo de resultados */
  limite?: number;
  /** Limiar mínimo de similaridade (0 a 1) */
  threshold?: number;
  /** Filtros de metadados */
  filtros?: Partial<DocumentoMetadata>;
}

/**
 * Configuração de modelo de embedding
 */
export interface EmbeddingModelConfig {
  /** Provedor do modelo */
  provider: 'openai' | 'cohere';
  /** Nome/ID do modelo */
  model: string;
  /** Dimensão do vetor de embedding */
  dimensions: number;
  /** Tamanho máximo de tokens por chunk */
  maxTokensPerChunk: number;
}

/**
 * Chunk de texto para indexação
 */
export interface TextChunk {
  /** Texto do chunk */
  texto: string;
  /** Índice do chunk no documento original */
  index: number;
  /** Offset de caracteres no texto original */
  offset: number;
}

/**
 * Status de uma operação de indexação
 */
export interface IndexacaoStatus {
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Número de chunks indexados */
  chunksIndexados: number;
  /** IDs dos embeddings criados */
  embeddingIds: number[];
  /** Mensagem de erro (se houver) */
  error?: string;
}
