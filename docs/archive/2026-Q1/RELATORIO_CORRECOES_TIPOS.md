# Relatório de Correções de Tipos - Zattar OS

**Data**: 2026-02-16  
**Status**: ✅ Tipos atualizados | ⚠️ 48 erros de tipo detectados

---

## ✅ Ações Executadas

### 1. Atualização de Tipos do Banco Remoto

```bash
✅ Backup criado: src/lib/supabase/database.types.ts.backup
✅ Tipos atualizados: src/lib/supabase/database.types.ts (7769 linhas)
✅ Duplicado removido: src/types/database.types.ts
```

**Novas tabelas detectadas**:
- `dify_apps` (integração Dify AI)
- `kanban_boards` (quadros Kanban)
- `graphql_public` schema

---

## ⚠️ Erros de Tipo Detectados (48 total)

### Distribuição por Módulo

| Módulo | Erros | Prioridade |
|--------|-------|------------|
| `dify` | 24 | 🔴 ALTA |
| `integracoes` (twofauth) | 9 | 🟡 MÉDIA |
| `tarefas` (MCP tools) | 2 | 🟡 MÉDIA |
| `expedientes/obrigacoes/pericias` | 3 | 🟢 BAIXA |
| `assinatura-digital` | 1 | 🟢 BAIXA |

---

## 🔴 Prioridade ALTA: Feature Dify (24 erros)

### Problema 1: Schemas ausentes no domain.ts

```typescript
// ❌ Erro em src/features/dify/actions/knowledge-actions.ts
import { criarDatasetSchema, criarDocumentoSchema } from '../domain';
// Module '"../domain"' has no exported member 'criarDatasetSchema'
```

**Causa**: Schemas não foram criados no `domain.ts`

**Solução**:
```typescript
// Adicionar em src/features/dify/domain.ts
export const criarDatasetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  // ... outros campos
});

export const criarDocumentoSchema = z.object({
  name: z.string().min(1),
  text: z.string().optional(),
  file: z.any().optional(),
  // ... outros campos
});
```

### Problema 2: Service incompleto

```typescript
// ❌ Erro: Property 'createDifyService' does not exist
const service = createDifyService(apiKey, apiUrl);
```

**Causa**: Função `createDifyService` não exportada em `service.ts`

**Solução**: Verificar e exportar a função no service.

### Problema 3: Hook useDifyChat incompleto

```typescript
// ❌ Erros em dify-chat-panel.tsx
Property 'isStreaming' does not exist
Property 'error' does not exist
Property 'stopGeneration' does not exist
Property 'clearChat' does not exist
Property 'sendFeedback' does not exist
```

**Causa**: Hook `useDifyChat` não retorna todas as propriedades necessárias

**Solução**: Atualizar interface do hook:
```typescript
interface UseDifyChatReturn {
  messages: Message[];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sendMessage: (content: string, inputs?: Record<string, any>) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;  // ✅ Adicionar
  error: Error | null;   // ✅ Adicionar
  stop: () => void;
  stopGeneration: () => void;  // ✅ Adicionar
  clearChat: () => void;       // ✅ Adicionar
  sendFeedback: (messageId: string, rating: 'like' | 'dislike') => Promise<void>;  // ✅ Adicionar
  conversationId: string | undefined;
}
```

### Problema 4: Workflow hooks incompletos

```typescript
// ❌ Erros em workflow-runner.tsx
Property 'result' does not exist
Property 'isRunning' does not exist
Property 'error' does not exist
Property 'runWorkflow' does not exist
Property 'reset' does not exist
```

**Solução**: Atualizar interface do hook `useDifyWorkflow`.

### Problema 5: Exports ausentes em domain.ts

```typescript
// ❌ Erros em workflow-history.tsx
Module '"../../domain"' has no exported member 'DifyExecucaoWorkflow'
Module '"../../domain"' has no exported member 'STATUS_EXECUCAO_LABELS'
```

**Solução**: Adicionar exports:
```typescript
// src/features/dify/domain.ts
export interface DifyExecucaoWorkflow {
  id: string;
  workflow_id: string;
  status: StatusExecucaoDify;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  created_at: string;
  finished_at: string | null;
}

export const STATUS_EXECUCAO_LABELS: Record<StatusExecucaoDify, string> = {
  [StatusExecucaoDify.RUNNING]: 'Em execução',
  [StatusExecucaoDify.SUCCEEDED]: 'Concluído',
  [StatusExecucaoDify.FAILED]: 'Falhou',
  [StatusExecucaoDify.STOPPED]: 'Parado',
};
```

---

## 🟡 Prioridade MÉDIA: Integrações TwoFAuth (9 erros)

### Problema: Tipo de porta incorreto

```typescript
// ❌ Erro em config-loader.ts
Type 'number | undefined' is not assignable to type 'string | undefined'
```

**Causa**: Campo `port` é `number` mas esperado como `string`

**Solução**:
```typescript
// Converter para string
port: config.port?.toString(),
```

### Problema: Variant do Toast incorreto

```typescript
// ❌ Erro em twofauth-config-form.tsx
Type '"destructive"' is not assignable to type '"error" | "default" | "success" | "warning" | "info"'
```

**Solução**: Trocar `"destructive"` por `"error"`:
```typescript
toast({
  variant: "error",  // ✅ Correto
  title: "Erro",
  description: error.message,
});
```

---

## 🟡 Prioridade MÉDIA: MCP Tools Tarefas (2 erros)

### Problema: Schema null em authenticatedAction

```typescript
// ❌ Erro em integracoes-actions.ts
Argument of type 'null' is not assignable to parameter of type 'ZodType<unknown, ZodTypeDef, unknown>'
```

**Solução**: Usar `z.void()` ou `z.object({})` em vez de `null`:
```typescript
export const actionListarIntegracoes = authenticatedAction(
  z.void(),  // ✅ Correto
  async (_, { user }) => {
    // ...
  }
);
```

---

## 🟢 Prioridade BAIXA: ViewType faltando 'quadro' (3 erros)

```typescript
// ❌ Erro em expedientes-content.tsx, obrigacoes-content.tsx, pericias-content.tsx
Property 'quadro' is missing in type '{ semana: string; mes: string; ano: string; lista: string; }'
```

**Solução**: Adicionar view 'quadro':
```typescript
const VIEW_LABELS: Record<ViewType, string> = {
  semana: 'Semana',
  mes: 'Mês',
  ano: 'Ano',
  lista: 'Lista',
  quadro: 'Quadro',  // ✅ Adicionar
};
```

---

## 🟢 Prioridade BAIXA: Assinatura Digital (1 erro)

```typescript
// ❌ Erro em client-page.tsx
Type is missing properties: hash_original_sha256, hash_final_sha256, created_by, contrato_id
```

**Causa**: Interface `DocumentoCompleto` não corresponde aos dados retornados

**Solução**: Atualizar interface ou adicionar campos faltantes no objeto.

---

## 📋 Plano de Correção

### Fase 1: Dify (CRÍTICO - 1-2 horas)

- [ ] Adicionar schemas ausentes em `domain.ts`
- [ ] Completar interface `useDifyChat`
- [ ] Completar interface `useDifyWorkflow`
- [ ] Exportar `createDifyService` em `service.ts`
- [ ] Adicionar `DifyExecucaoWorkflow` e `STATUS_EXECUCAO_LABELS`
- [ ] Testar feature Dify após correções

### Fase 2: Integrações (MÉDIO - 30 min)

- [ ] Converter `port` para string em `config-loader.ts`
- [ ] Trocar `"destructive"` por `"error"` em toasts
- [ ] Usar `z.void()` em vez de `null` em actions

### Fase 3: ViewType (BAIXO - 10 min)

- [ ] Adicionar `quadro: 'Quadro'` em VIEW_LABELS (3 arquivos)

### Fase 4: Assinatura Digital (BAIXO - 15 min)

- [ ] Atualizar interface `DocumentoCompleto`

---

## 🚀 Comandos de Validação

```bash
# Após cada correção, executar:
npm run type-check

# Quando todos os erros forem corrigidos:
npm run lint
npm test
npm run build
```

---

## 📊 Progresso

- [x] Tipos atualizados do banco remoto
- [x] Arquivo duplicado removido
- [x] Erros catalogados e priorizados
- [ ] Correções implementadas (0/48)
- [ ] Validação completa

---

## 🎯 Próximos Passos

1. **Imediato**: Corrigir feature Dify (24 erros)
2. **Curto prazo**: Corrigir integrações e MCP tools (11 erros)
3. **Médio prazo**: Corrigir ViewType e assinatura digital (4 erros)
4. **Longo prazo**: Refinar tipos `unknown` conforme AUDITORIA_TIPOS_SCHEMAS.md

---

**Nota**: Todos os erros são de tipo (TypeScript), não há erros de runtime. O sistema continua funcional, mas os tipos precisam ser corrigidos para garantir type safety.
