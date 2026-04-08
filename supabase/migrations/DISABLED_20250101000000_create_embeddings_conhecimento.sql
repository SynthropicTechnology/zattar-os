-- Migration: Create embeddings_conhecimento table for semantic search
-- Description: Tabela para armazenamento de vetores de embedding para busca semântica (RAG)
-- Author: Synthropic Architecture 2.0
-- Date: 2025-01-01
--
-- ⚠️ LEGACY: Esta migration está descontinuada.
-- A tabela embeddings_conhecimento foi substituída por public.embeddings (ver migration 2025-12-12-create-embeddings-system.sql).
-- Esta migration é mantida apenas para referência histórica e não deve ser aplicada em novos ambientes.
-- Use a tabela public.embeddings e a função match_embeddings para novas implementações.

-- Habilitar extensão pgvector (se ainda não habilitada)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- TABELA: embeddings_conhecimento
-- =============================================================================
-- Armazena chunks de texto com seus vetores de embedding para busca semântica.
-- Cada registro representa um chunk de um documento indexado.

CREATE TABLE IF NOT EXISTS embeddings_conhecimento (
  id BIGSERIAL PRIMARY KEY,

  -- Texto original do chunk
  texto TEXT NOT NULL,

  -- Vetor de embedding (OpenAI text-embedding-3-small = 1536 dimensões)
  embedding vector(1536),

  -- Metadados do documento original
  -- Estrutura esperada:
  -- {
  --   "tipo": "processo" | "documento" | "audiencia" | "expediente" | "cliente" | "lancamento" | "outro",
  --   "id": number,
  --   "processoId": number (opcional),
  --   "numeroProcesso": string (opcional),
  --   "status": string (opcional),
  --   "grau": string (opcional),
  --   "trt": string (opcional),
  --   "categoria": string (opcional),
  --   "dataReferencia": string (opcional),
  --   "chunkIndex": number,
  --   "chunkOffset": number,
  --   "totalChunks": number
  -- }
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Índice para busca vetorial usando IVFFlat
-- lists = 100 é adequado para até ~100k registros
-- Para datasets maiores, aumentar proporcionalmente (sqrt(n))
CREATE INDEX IF NOT EXISTS idx_embeddings_conhecimento_embedding
  ON embeddings_conhecimento
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Índice GIN para busca em metadados JSONB
CREATE INDEX IF NOT EXISTS idx_embeddings_conhecimento_metadata
  ON embeddings_conhecimento
  USING gin (metadata);

-- Índice para busca por tipo de documento
CREATE INDEX IF NOT EXISTS idx_embeddings_conhecimento_tipo
  ON embeddings_conhecimento ((metadata->>'tipo'));

-- Índice para busca por ID do documento original
CREATE INDEX IF NOT EXISTS idx_embeddings_conhecimento_doc_id
  ON embeddings_conhecimento ((metadata->>'id'));

-- Índice para busca por processo relacionado
CREATE INDEX IF NOT EXISTS idx_embeddings_conhecimento_processo
  ON embeddings_conhecimento ((metadata->>'processoId'));

-- =============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION update_embeddings_conhecimento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_embeddings_conhecimento_updated_at ON embeddings_conhecimento;
CREATE TRIGGER tr_embeddings_conhecimento_updated_at
  BEFORE UPDATE ON embeddings_conhecimento
  FOR EACH ROW
  EXECUTE FUNCTION update_embeddings_conhecimento_updated_at();

-- =============================================================================
-- FUNÇÃO: buscar_conhecimento_semantico
-- =============================================================================
-- Realiza busca semântica por similaridade de cosseno.
-- Retorna documentos ordenados por similaridade decrescente.

CREATE OR REPLACE FUNCTION buscar_conhecimento_semantico(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id bigint,
  texto text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.texto,
    e.metadata,
    (1 - (e.embedding <=> query_embedding))::float AS similarity
  FROM embeddings_conhecimento e
  WHERE
    -- Filtro de metadados (se fornecido)
    (filter_metadata = '{}' OR e.metadata @> filter_metadata)
    -- Filtro de similaridade mínima
    AND (1 - (e.embedding <=> query_embedding)) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- FUNÇÃO: contar_embeddings_por_tipo
-- =============================================================================
-- Retorna contagem de embeddings agrupados por tipo.

CREATE OR REPLACE FUNCTION contar_embeddings_por_tipo()
RETURNS TABLE (
  tipo text,
  quantidade bigint
)
LANGUAGE sql
AS $$
  SELECT
    metadata->>'tipo' as tipo,
    COUNT(*) as quantidade
  FROM embeddings_conhecimento
  GROUP BY metadata->>'tipo'
  ORDER BY quantidade DESC;
$$;

-- =============================================================================
-- FUNÇÃO: limpar_embeddings_por_documento
-- =============================================================================
-- Remove todos os embeddings de um documento específico.

CREATE OR REPLACE FUNCTION limpar_embeddings_por_documento(
  p_tipo text,
  p_id bigint
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM embeddings_conhecimento
  WHERE metadata->>'tipo' = p_tipo
    AND (metadata->>'id')::bigint = p_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================================================
-- Por padrão, embeddings são acessíveis apenas via funções autenticadas.
-- Ajustar conforme necessidade de segurança.

ALTER TABLE embeddings_conhecimento ENABLE ROW LEVEL SECURITY;

-- Política para leitura (usuários autenticados)
CREATE POLICY "Embeddings são legíveis por usuários autenticados"
  ON embeddings_conhecimento
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (usuários autenticados)
CREATE POLICY "Embeddings podem ser inseridos por usuários autenticados"
  ON embeddings_conhecimento
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para atualização (usuários autenticados)
CREATE POLICY "Embeddings podem ser atualizados por usuários autenticados"
  ON embeddings_conhecimento
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para exclusão (usuários autenticados)
CREATE POLICY "Embeddings podem ser excluídos por usuários autenticados"
  ON embeddings_conhecimento
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON TABLE embeddings_conhecimento IS 'Tabela para armazenamento de vetores de embedding para busca semântica (RAG)';
COMMENT ON COLUMN embeddings_conhecimento.texto IS 'Texto original do chunk indexado';
COMMENT ON COLUMN embeddings_conhecimento.embedding IS 'Vetor de embedding (1536 dimensões - OpenAI text-embedding-3-small)';
COMMENT ON COLUMN embeddings_conhecimento.metadata IS 'Metadados do documento original (tipo, id, processoId, etc.)';
COMMENT ON FUNCTION buscar_conhecimento_semantico IS 'Busca semântica por similaridade de cosseno com filtros opcionais';
COMMENT ON FUNCTION contar_embeddings_por_tipo IS 'Retorna estatísticas de embeddings por tipo de documento';
COMMENT ON FUNCTION limpar_embeddings_por_documento IS 'Remove embeddings de um documento específico por tipo e id';
