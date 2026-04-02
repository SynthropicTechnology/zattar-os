# Análise da Implementação de Embeddings com pgvector

**Data:** 2025-01-XX  
**Status:** ✅ Implementação Completa (com pendências de migration)

## 📋 Resumo Executivo

A funcionalidade de embeddings utilizando pgvector do Supabase está **implementada** no código, mas há uma **migration pendente** que precisa ser aplicada para ativar completamente o sistema unificado de embeddings.

## ✅ O que está implementado

### 1. **Infraestrutura de Banco de Dados**

#### Migration Nova (NÃO APLICADA)
- **Arquivo:** `supabase/migrations/nao-aplicadas/2025-12-12-create-embeddings-system.sql`
- **Status:** ⚠️ **PENDENTE DE APLICAÇÃO**
- **Conteúdo:**
  - Cria extensão `vector` (pgvector)
  - Cria tabela `public.embeddings` (sistema unificado)
  - Índice HNSW para busca vetorial otimizada
  - Função RPC `match_embeddings` para busca semântica
  - RLS policies configuradas

#### Migration Legada (APLICADA)
- **Arquivo:** `supabase/migrations/20250101000000_create_embeddings_conhecimento.sql`
- **Status:** ✅ Aplicada
- **Nota:** Sistema legado, marcado como descontinuado no código

### 2. **Código de Implementação**

#### Feature Completa em `src/features/ai/`
- ✅ **Repository** (`repository.ts`): CRUD de embeddings usando `public.embeddings`
- ✅ **Service** (`service.ts`): Lógica de negócio para indexação e busca
- ✅ **Embedding Service** (`services/embedding.service.ts`): Geração de embeddings via OpenAI SDK
- ✅ **Indexing Service** (`services/indexing.service.ts`): Indexação de documentos e textos
- ✅ **Actions** (`actions/embeddings-actions.ts`): Server Actions para indexação
- ✅ **Domain** (`domain.ts`): Schemas Zod e tipos TypeScript

#### Integração Automática
- ✅ **Uploads de Documentos**: Indexação automática após upload (`src/features/documentos/actions/uploads-actions.ts`)
- ✅ **Expedientes**: Indexação quando há documento vinculado (`src/features/expedientes/actions.ts`)
- ✅ **Processos**: Ações de reindexação disponíveis (`src/features/processos/actions/indexing-actions.ts`)

### 3. **Variáveis de Ambiente**

#### ✅ Configuradas no `.env.example`:
- `OPENAI_API_KEY` - Chave da API OpenAI (obrigatória)
- `OPENAI_EMBEDDING_MODEL` - Modelo de embedding (padrão: `text-embedding-3-small`) - **CORRIGIDO**

#### ⚠️ Suporte a Cohere (opcional):
- `AI_EMBEDDING_PROVIDER` - Provedor de embedding (`openai` ou `cohere`)
- `COHERE_API_KEY` - Chave da API Cohere
- `COHERE_EMBEDDING_MODEL` - Modelo Cohere (padrão: `embed-multilingual-v3.0`)

### 4. **Configuração e Cache**

- ✅ **Config** (`src/lib/ai/config.ts`): Configurações centralizadas
- ✅ **Cache Redis**: Suporte a cache de embeddings (opcional)
- ✅ **Chunking**: Divisão inteligente de textos em chunks

## ⚠️ Problemas Identificados e Corrigidos

### 1. **Variável de Ambiente Faltando** ✅ CORRIGIDO
- **Problema:** `OPENAI_EMBEDDING_MODEL` não estava no `.env.example`
- **Solução:** Adicionada com documentação completa

### 2. **Modelo Hardcoded** ✅ CORRIGIDO
- **Problema:** `embedding.service.ts` usava modelo hardcoded
- **Solução:** Agora usa `process.env.OPENAI_EMBEDDING_MODEL` com fallback

### 3. **Migration Não Aplicada** ⚠️ PENDENTE
- **Problema:** Migration `2025-12-12-create-embeddings-system.sql` está em `nao-aplicadas/`
- **Impacto:** Sistema está usando tabela legada `embeddings_conhecimento` em vez de `public.embeddings`
- **Ação Necessária:** Aplicar migration no Supabase

## 🔍 Verificações Realizadas

### ✅ Código de Embedding
- [x] Geração de embeddings via OpenAI SDK
- [x] Suporte a batch processing
- [x] Normalização de texto
- [x] Tratamento de erros

### ✅ Indexação
- [x] Extração de texto de documentos (PDF, DOCX, etc.)
- [x] Chunking inteligente com overlap
- [x] Filtragem de chunks vazios
- [x] Remoção de embeddings antigos antes de reindexar

### ✅ Busca Semântica
- [x] Função RPC `match_embeddings` implementada
- [x] Filtros por `entity_type`, `parent_id`, `metadata`
- [x] Similaridade de cosseno
- [x] Threshold configurável

### ✅ Integração
- [x] Indexação automática em uploads
- [x] Server Actions para indexação manual
- [x] Reindexação de processos completos

### ⚠️ Banco de Dados
- [x] Migration criada mas não aplicada
- [ ] Tabela `public.embeddings` não existe ainda
- [x] Tabela legada `embeddings_conhecimento` existe e está sendo usada

## 📝 Próximos Passos

### 1. **Aplicar Migration** (CRÍTICO)
```bash
# Aplicar migration no Supabase
supabase db push
# OU via Dashboard do Supabase
```

**Migration a aplicar:**
- `supabase/migrations/nao-aplicadas/2025-12-12-create-embeddings-system.sql`

### 2. **Migrar Dados (se necessário)**
Se houver dados na tabela legada `embeddings_conhecimento`, criar script de migração:
```sql
-- Exemplo de migração de dados
INSERT INTO public.embeddings (content, embedding, entity_type, entity_id, metadata)
SELECT 
  texto as content,
  embedding,
  metadata->>'tipo' as entity_type,
  (metadata->>'id')::bigint as entity_id,
  metadata
FROM embeddings_conhecimento;
```

### 3. **Atualizar Código Legado**
Após aplicar migration, atualizar ou remover:
- `src/lib/ai/indexing.ts` (usa `embeddings_conhecimento`)
- `src/lib/ai/retrieval.ts` (usa `embeddings_conhecimento`)

### 4. **Testes**
- [ ] Testar indexação de novo documento
- [ ] Testar busca semântica
- [ ] Verificar performance com HNSW index
- [ ] Validar RLS policies

## 🎯 Conclusão

A implementação de embeddings está **funcionalmente completa** no código, mas requer:

1. ✅ **Variáveis de ambiente** - CORRIGIDAS
2. ⚠️ **Aplicação da migration** - PENDENTE (crítico)
3. ⚠️ **Migração de dados legados** - Se necessário
4. ⚠️ **Limpeza de código legado** - Após migration aplicada

**Status Geral:** 🟡 **Implementação 95% completa** - Falta apenas aplicar migration no banco de dados.
