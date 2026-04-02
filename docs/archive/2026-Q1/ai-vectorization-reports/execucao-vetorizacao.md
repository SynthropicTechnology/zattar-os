# Execução da Vetorização de Documentos

**Data:** 2025-12-16  
**Status:** 🟡 **Em Execução**

## 📊 Status da Execução

### Script Otimizado
- ✅ **Batching implementado** - `generateEmbeddings()` já usa `embedMany()` para processar múltiplos chunks em uma única chamada
- ✅ **Processamento paralelo** - 3 documentos simultâneos (CONCURRENCY_LIMIT = 3)
- ✅ **Extração de PDF corrigida** - Usa `pdf-parse` para Node.js (mais confiável que pdfjs-dist)

### Melhorias Aplicadas

1. **Batching de Embeddings**
   - Cada documento já processa todos os chunks em batch via `embedMany()`
   - Reduz custos da API OpenAI significativamente
   - Processamento mais rápido

2. **Processamento Paralelo**
   - 3 documentos processados simultaneamente
   - Aproveita melhor recursos do servidor
   - Mantém controle de concorrência para evitar sobrecarga

3. **Extração de PDF**
   - Instalado `pdf-parse` para Node.js
   - Mais confiável que pdfjs-dist em ambiente Node.js
   - Fallback para pdfjs-dist no browser/SSR

## 🚀 Executando o Script

```bash
# Teste com 1 documento
npm run ai:index-existing -- --limit=1

# Indexar todos os documentos (sem limite)
npm run ai:index-existing

# Ver quais seriam indexados (dry-run)
npm run ai:index-dry-run
```

## 📈 Monitoramento

Para verificar progresso:

```sql
-- Total de embeddings indexados
SELECT COUNT(*) FROM public.embeddings;

-- Por tipo de entidade
SELECT 
  entity_type,
  COUNT(*) as total,
  COUNT(DISTINCT entity_id) as entidades_unicas
FROM public.embeddings
GROUP BY entity_type;

-- Últimos embeddings indexados
SELECT 
  entity_type,
  entity_id,
  COUNT(*) as chunks,
  MAX(created_at) as ultimo_chunk
FROM public.embeddings
GROUP BY entity_type, entity_id
ORDER BY ultimo_chunk DESC
LIMIT 10;
```

## ⚡ Otimizações de Custo

### Batching de Embeddings
- **Antes:** 1 chamada API por chunk (ex: 10 chunks = 10 chamadas)
- **Depois:** 1 chamada API para todos os chunks (ex: 10 chunks = 1 chamada)
- **Economia:** ~90% de redução em chamadas API

### Processamento Paralelo
- **Antes:** 1 documento por vez
- **Depois:** 3 documentos simultâneos
- **Ganho:** ~3x mais rápido

## 📝 Notas

- O script processa expedientes com arquivos PDF
- Cada documento é dividido em chunks de ~1000 caracteres
- Embeddings são gerados em batch para todos os chunks de um documento
- Rate limiting de 1 segundo foi removido (não necessário com batching)

## 🎯 Próximos Passos

Após a execução:
1. Verificar total de embeddings indexados
2. Testar busca semântica
3. Monitorar custos da API OpenAI
4. Considerar criar cron job para indexação periódica

