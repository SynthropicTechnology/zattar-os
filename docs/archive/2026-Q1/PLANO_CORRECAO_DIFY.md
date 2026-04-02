# Plano de Correção - Feature Dify

**Prioridade**: 🔴 ALTA  
**Tempo Estimado**: 1-2 horas  
**Erros**: 24 de 37 restantes (65%)

---

## 📋 Checklist de Correções

### 1. Domain.ts - Adicionar Schemas e Exports (10 erros)

#### ✅ Schemas Ausentes
```typescript
// Adicionar em src/features/dify/domain.ts

export const criarDatasetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export const criarDocumentoSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  text: z.string().optional(),
  file: z.any().optional(),
});
```

#### ✅ Interfaces Ausentes
```typescript
// Adicionar em src/features/dify/domain.ts

export interface DifyExecucaoWorkflow {
  id: string;
  workflow_id: string;
  status: StatusExecucaoDify;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  created_at: string;
  finished_at: string | null;
  error?: string;
}

export const STATUS_EXECUCAO_LABELS: Record<StatusExecucaoDify, string> = {
  [StatusExecucaoDify.RUNNING]: 'Em execução',
  [StatusExecucaoDify.SUCCEEDED]: 'Concluído',
  [StatusExecucaoDify.FAILED]: 'Falhou',
  [StatusExecucaoDify.STOPPED]: 'Parado',
};
```

---

### 2. Service.ts - Exportar createDifyService (4 erros)

```typescript
// Verificar e exportar em src/features/dify/service.ts

export function createDifyService(apiKey: string, apiUrl: string) {
  // ... implementação existente
}

// Ou se já existe, adicionar ao index.ts:
export { createDifyService } from './service';
```

---

### 3. Hooks - Completar Interfaces (13 erros)

#### useDifyChat (8 erros)

```typescript
// Atualizar em src/features/dify/hooks/use-dify-chat.ts

export interface UseDifyChatReturn {
  // Existentes
  messages: Message[];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sendMessage: (content: string, inputs?: Record<string, any>) => Promise<void>;
  isLoading: boolean;
  stop: () => void;
  conversationId: string | undefined;
  
  // ✅ ADICIONAR:
  isStreaming: boolean;
  error: Error | null;
  stopGeneration: () => void;
  clearChat: () => void;
  sendFeedback: (messageId: string, rating: 'like' | 'dislike') => Promise<void>;
}

export function useDifyChat(options: UseDifyChatOptions): UseDifyChatReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ... implementação existente
  
  const stopGeneration = () => {
    stop();
    setIsStreaming(false);
  };
  
  const clearChat = () => {
    // Limpar mensagens
  };
  
  const sendFeedback = async (messageId: string, rating: 'like' | 'dislike') => {
    // Implementar feedback
  };
  
  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    isStreaming,
    error,
    stop,
    stopGeneration,
    clearChat,
    sendFeedback,
    conversationId,
  };
}
```

#### useDifyWorkflow (5 erros)

```typescript
// Atualizar em src/features/dify/hooks/use-dify-workflow.ts

export interface UseDifyWorkflowReturn {
  // Existentes
  state: WorkflowRunState;
  execute: (inputs: Record<string, any>, files?: any[]) => Promise<void>;
  stop: () => void;
  
  // ✅ ADICIONAR:
  result: any | null;
  isRunning: boolean;
  error: Error | null;
  runWorkflow: (inputs: Record<string, any>) => Promise<void>;
  reset: () => void;
}

export function useDifyWorkflow(workflowId: string): UseDifyWorkflowReturn {
  const [result, setResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ... implementação existente
  
  const runWorkflow = async (inputs: Record<string, any>) => {
    await execute(inputs);
  };
  
  const reset = () => {
    setResult(null);
    setError(null);
    setIsRunning(false);
  };
  
  return {
    state,
    execute,
    stop,
    result,
    isRunning,
    error,
    runWorkflow,
    reset,
  };
}
```

---

### 4. Actions - Corrigir Parâmetros (2 erros)

```typescript
// Corrigir em src/features/dify/actions/chat-actions.ts

// ❌ ANTES (linha 63):
const result = await service.listarMensagens(conversationId);

// ✅ DEPOIS:
const result = await service.listarMensagens({
  conversationId,
  limite: 50,
});

// ❌ ANTES (linha 86):
const result = await service.buscarHistorico(conversationId);

// ✅ DEPOIS:
const result = await service.buscarHistorico({
  conversationId,
  limite: 50,
});
```

---

### 5. Components - Corrigir Tipos (5 erros)

#### dify-config-form.tsx (3 erros)

```typescript
// Corrigir imports em src/features/dify/components/dify-config-form.tsx

// ❌ ANTES:
import { 
  getDifyConfigAction, 
  saveDifyConfigAction, 
  checkDifyConnectionAction 
} from '../actions';

// ✅ DEPOIS:
import { 
  getDifyConfigAction, 
  saveDifyConfigAction, 
  checkDifyAppConnectionAction  // Nome correto
} from '../actions';

// E usar:
const result = await checkDifyAppConnectionAction(values);
```

#### workflow-history.tsx (2 erros)

```typescript
// Corrigir imports em src/features/dify/components/dify-workflows/workflow-history.tsx

// ❌ ANTES:
import { StatusExecucao } from '../../domain';

// ✅ DEPOIS:
import { StatusExecucaoDify } from '../../domain';

// E usar:
const status: StatusExecucaoDify = execucao.status;
```

#### dify-chat-panel.tsx (2 erros)

```typescript
// Corrigir em src/features/dify/components/dify-chat-panel.tsx

// 1. Remover className de ReactMarkdown (linha 101)
// ❌ ANTES:
<ReactMarkdown 
  remarkPlugins={[remarkGfm]} 
  className="prose"
>

// ✅ DEPOIS:
<div className="prose">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>

// 2. Corrigir tipo de role (linha 90)
// ❌ ANTES:
const role: "user" | "assistant" | "system" = message.role;

// ✅ DEPOIS:
const role: "user" | "assistant" = message.role === "system" ? "assistant" : message.role;
```

---

## 🚀 Ordem de Execução

1. **Domain.ts** (10 min)
   - Adicionar schemas
   - Adicionar interfaces
   - Adicionar labels

2. **Service.ts** (5 min)
   - Exportar createDifyService

3. **Hooks** (30 min)
   - Completar useDifyChat
   - Completar useDifyWorkflow

4. **Actions** (10 min)
   - Corrigir parâmetros de chamadas

5. **Components** (15 min)
   - Corrigir imports
   - Corrigir tipos
   - Ajustar ReactMarkdown

6. **Validação** (10 min)
   - `npm run type-check`
   - Testar feature manualmente

---

## 📝 Comandos

```bash
# Após cada etapa
npm run type-check 2>&1 | grep "dify"

# Validação final
npm run type-check
npm run lint
npm test -- dify
```

---

## ✅ Checklist de Validação

- [ ] Todos os schemas exportados
- [ ] Todas as interfaces exportadas
- [ ] createDifyService exportado
- [ ] useDifyChat completo
- [ ] useDifyWorkflow completo
- [ ] Actions com parâmetros corretos
- [ ] Components sem erros de tipo
- [ ] `npm run type-check` passa
- [ ] Feature Dify funciona manualmente

---

## 🎯 Resultado Esperado

```
Erros Antes:  37
Erros Dify:   24
Erros Depois: 13 (redução de 65%)
```

---

**Nota**: Após corrigir Dify, restarão apenas 13 erros (MCP tools + assinatura digital), facilmente corrigíveis em 30 minutos.
