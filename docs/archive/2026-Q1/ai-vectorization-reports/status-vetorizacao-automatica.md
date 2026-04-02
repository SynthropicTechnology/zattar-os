# Status da Vetorização Automática

**Data:** 2025-12-16  
**Status:** ⚠️ **Indexação Automática Parcial - Sem Cron para Documentos Existentes**

## 📊 Status Atual

### Tabela de Embeddings
- **Total de embeddings:** 0
- **Documentos indexados:** 0
- **Status:** Tabela vazia, pronta para receber embeddings

## ✅ O que está funcionando (Indexação Automática)

### 1. **Indexação Automática de Novos Documentos**

A indexação acontece **automaticamente** quando:

#### Uploads de Documentos
- **Localização:** `src/features/documentos/actions/uploads-actions.ts`
- **Trigger:** Após upload de arquivo
- **Método:** `after()` assíncrono (não bloqueia resposta)
- **Status:** ✅ Funcionando

```typescript
after(async () => {
  await indexDocument({
    entity_type: 'documento',
    entity_id: upload.id,
    // ...
  });
});
```

#### Expedientes com Documentos
- **Localização:** `src/features/expedientes/actions.ts`
- **Trigger:** Ao criar expediente com documento vinculado
- **Status:** ✅ Funcionando

#### Peças de Processo
- **Localização:** `src/features/processos/actions/indexing-actions.ts`
- **Trigger:** Ao indexar peça de processo
- **Status:** ✅ Funcionando

#### Andamentos de Processo
- **Localização:** `src/features/processos/actions/indexing-actions.ts`
- **Trigger:** Ao indexar andamento
- **Status:** ✅ Funcionando

## ❌ O que NÃO está funcionando (Cron Automático)

### 1. **Não há Cron Job para Vetorização Retroativa**

- ❌ **Nenhum cron job** configurado para indexar documentos existentes
- ❌ **Nenhum processo automático** para vetorizar documentos antigos
- ❌ **Nenhum scheduler** rodando em background

### 2. **Script Manual Disponível**

Existe um script para indexação manual de documentos existentes:

- **Arquivo:** `scripts/ai/index-existing-documents.ts`
- **Comando:** `npm run ai:index-existing`
- **Dry-run:** `npm run ai:index-dry-run`
- **Status:** ✅ Disponível, mas precisa ser executado manualmente

## 🔧 Como Indexar Documentos Existentes

### Opção 1: Script Manual (Recomendado)

```bash
# Ver quais documentos seriam indexados (dry-run)
npm run ai:index-dry-run

# Indexar todos os documentos existentes
npm run ai:index-existing

# Limitar quantidade
npx tsx scripts/ai/index-existing-documents.ts --limit=100
```

### Opção 2: API de Reindexação

```bash
# Endpoint disponível
POST /api/ai/reindex
```

### Opção 3: Actions do Sistema

- `actionReindexarProcesso(processo_id)` - Reindexa processo completo
- `actionReindexarDocumento(params)` - Reindexa documento específico

## 📋 Recomendações

### 1. **Criar Cron Job para Vetorização Retroativa**

Sugestão: Criar um cron job que execute periodicamente:

```typescript
// Exemplo de implementação
// src/app/api/cron/index-documents/route.ts
export async function GET(req: NextRequest) {
  // Verificar autenticação via header
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Executar indexação de documentos pendentes
  await indexPendingDocuments();
  
  return NextResponse.json({ success: true });
}
```

E configurar no Vercel (ou plataforma de deploy):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/index-documents",
    "schedule": "0 */6 * * *"  // A cada 6 horas
  }]
}
```

### 2. **Monitoramento**

Adicionar métricas para acompanhar:
- Total de documentos indexados
- Documentos pendentes de indexação
- Taxa de sucesso/falha
- Tempo médio de indexação

### 3. **Queue System (Futuro)**

Para grandes volumes, considerar:
- Bull/BullMQ para filas de indexação
- Processamento em background com workers
- Retry automático em caso de falhas

## 🎯 Conclusão

**Status Atual:**
- ✅ Indexação automática de **novos documentos** funcionando
- ❌ **Não há** cron job para indexar documentos existentes
- ✅ Script manual disponível para indexação retroativa
- ⚠️ Tabela de embeddings está **vazia** (nenhum documento foi vetorizado ainda)

**Próximos Passos:**
1. Executar script manual para indexar documentos existentes
2. Considerar criar cron job para indexação periódica
3. Monitorar processo de indexação

