# Regras de Negócio - Busca Semântica

## Contexto
Módulo de busca inteligente que utiliza embeddings de IA para encontrar informações relevantes no sistema. Implementa Retrieval-Augmented Generation (RAG) para fornecer contexto a agentes de IA.

## Entidades Principais
- **Embedding**: Vetor de representação semântica de um texto
- **Chunk**: Fragmento de texto indexado
- **ResultadoBusca**: Documento encontrado com score de similaridade

## Tipos de Busca

### Busca Semântica
- Usa similaridade de cosseno entre vetores
- Encontra documentos semanticamente relacionados
- Funciona mesmo com termos diferentes do original

### Busca Híbrida
- Combina busca semântica com busca textual (ILIKE)
- Prioriza resultados semânticos
- Complementa com matches textuais exatos

### Contexto RAG
- Formata resultados para uso em prompts de LLM
- Respeita limite de tokens
- Inclui referências às fontes

## Regras de Validação

### Query de Busca
- Mínimo 3 caracteres
- Normalizada (trim, espaços múltiplos removidos)
- Sem caracteres especiais perigosos

### Parâmetros
- `limite`: 1-50 resultados (padrão: 10)
- `threshold`: 0-1 similaridade mínima (padrão: 0.7)
- `maxTokens`: 500-8000 para contexto RAG (padrão: 2000)

## Regras de Negócio

### Busca Semântica
1. Gerar embedding da query
2. Buscar vetores similares no pgvector
3. Filtrar por threshold de similaridade
4. Ordenar por similaridade decrescente
5. Aplicar filtros de metadados se fornecidos

### Indexação de Documentos
1. Dividir texto em chunks (máx 2000 chars)
2. Manter overlap entre chunks (200 chars)
3. Gerar embedding para cada chunk
4. Armazenar com metadados do documento
5. Cache de embeddings para otimização

### Atualização de Índice
1. Ao criar documento: indexar imediatamente
2. Ao atualizar documento: reindexar chunks
3. Ao excluir documento: remover embeddings
4. Processamento assíncrono (after())

## Metadados Indexados

### Estrutura
```json
{
  "tipo": "processo|documento|audiencia|...",
  "id": 123,
  "processoId": 456,
  "numeroProcesso": "0001234-12.2024.5.15.0001",
  "status": "ativo",
  "grau": "primeiro_grau",
  "trt": "TRT15",
  "chunkIndex": 0,
  "chunkOffset": 0,
  "totalChunks": 3
}
```

### Filtros Suportados
- Por tipo de documento
- Por processo relacionado
- Por TRT/tribunal
- Por status

## Fluxos Especiais

### Cache de Embeddings
1. Hash MD5 do texto como chave
2. Armazenamento em Redis
3. TTL de 7 dias
4. Verificar cache antes de gerar

### Reindexação Completa
1. Limpar embeddings existentes
2. Reindexar processos
3. Reindexar audiências
4. Reindexar documentos (com OCR)
5. Reindexar expedientes

### Documentos Similares
1. Buscar embedding do documento referência
2. Encontrar documentos com vetores próximos
3. Filtrar documento original
4. Útil para sugestões "ver também"

## Performance

### Otimizações
- Índice IVFFlat no pgvector
- Cache Redis para embeddings
- Chunking eficiente
- Batch processing quando possível

### Limites
- Máximo 50 resultados por busca
- Máximo 8000 tokens de contexto
- Máximo 1M embeddings com performance aceitável

## Integrações
- **OpenAI**: Geração de embeddings (text-embedding-3-small)
- **Cohere**: Alternativa para embeddings
- **pgvector**: Busca vetorial no Supabase
- **Redis**: Cache de embeddings
- **PDF.js**: Extração de texto de documentos

## Restrições de Acesso
- Busca respeita permissões do usuário
- Documentos sigilosos filtrados automaticamente
- Rate limiting: 100 buscas/minuto por usuário
