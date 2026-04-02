# Chatwoot Integration - Quick Start Guide

**Status:** ✅ Ready to Use  
**Last Updated:** February 18, 2025

---

## 🚀 Quick Start (5 minutes)

### 1. Import Hooks in Your Component

```typescript
"use client"; // Client component required for hooks

import {
  useChatwootConversations,
  useChatwootAgents,
  useChatwootRealtime,
} from "@/features/chatwoot/hooks";

export function ChatwootPanel() {
  // Your component here
}
```

### 2. Use Conversation Hook

```typescript
function ConversationList() {
  const {
    filteredConversations,
    loading,
    syncConversation,
  } = useChatwootConversations({
    accountId: 1,
    status: 'open',
    autoSync: true,
  });

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {filteredConversations.map((conv) => (
        <div key={conv.id}>
          <span>Conversa #{conv.chatwoot_conversation_id}</span>
          <button onClick={() => syncConversation(Number(conv.chatwoot_conversation_id))}>
            Sincronizar
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. Use Agent Hook

```typescript
function AgentAssignment() {
  const {
    agentWithLowestLoad,
    agents,
  } = useChatwootAgents({
    accountId: 1,
    onlyAvailable: true,
    sortBy: 'load',
  });

  return (
    <div>
      <p>Próximo disponível:</p>
      <select>
        <option value="">
          {agentWithLowestLoad?.nome_chatwoot}
          ({Number(agentWithLowestLoad?.contador_conversas_ativas || 0)} conversas)
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.nome_chatwoot}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 4. Use Real-time Hook

```typescript
function RealtimeMonitor() {
  const {
    events,
    isConnected,
    clearEvents,
  } = useChatwootRealtime({
    table: 'conversas_chatwoot',
    events: ['UPDATE'],
  });

  return (
    <div>
      <p>Conexão: {isConnected ? '🟢' : '🔴'}</p>
      <button onClick={clearEvents}>Limpar ({events.length})</button>
    </div>
  );
}
```

---

## 📋 Pre-deployment Checklist

### Database Setup

- [ ] Apply migration: `20260218000003_add_chatwoot_triggers.sql`

  ```bash
  # Via Supabase CLI
  supabase migration up

  # OR manually in SQL editor
  # Copy migration file content to Supabase SQL editor
  ```

### Environment Configuration

- [ ] Verify Chatwoot API credentials in database:
  ```sql
  SELECT * FROM integracoes_chatwoot WHERE account_id = 1;
  ```

  - Required: `api_key`, `webhook_token`, `api_base_url`

### Webhook Setup

- [ ] Configure Chatwoot webhook to post to: `https://your-domain.com/api/webhooks/chatwoot`
- [ ] Verify webhook token matches database entry
- [ ] Test webhook delivery in Chatwoot dashboard

### Component Integration

- [ ] Wrap components with `ErrorBoundary`
- [ ] Add loading skeletons for async operations
- [ ] Test hooks with React DevTools Profiler

---

## 🔧 Common Setup Tasks

### Task 1: Display Open Conversations

```typescript
// pages/chatwoot/conversations.tsx
'use client';

import { useChatwootConversations } from '@/features/chatwoot/hooks';

export default function ConversationsPage() {
  const {
    filteredConversations,
    loading,
    error,
  } = useChatwootConversations({
    accountId: 1,
    status: 'open',
    autoSync: true,
    syncInterval: 30000,
  });

  if (error) return <div>Erro: {error.message}</div>;
  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Conversas Abertas</h1>
      <p>{filteredConversations.length} conversas</p>
      <ul>
        {filteredConversations.map((conv) => (
          <li key={conv.id}>
            Conversa #{conv.chatwoot_conversation_id}
            <span>{conv.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Task 2: Assign Conversation to Best Agent

```typescript
'use client';

import { useChatwootAgents } from '@/features/chatwoot/hooks';
import { atribuirConversaAoAgente } from '@/features/chatwoot/actions';

export function AutoAssignButton({ conversationId }: { conversationId: number }) {
  const { agentWithLowestLoad } = useChatwootAgents({
    accountId: 1,
    onlyAvailable: true,
    sortBy: 'load',
  });

  const handleAssign = async () => {
    if (!agentWithLowestLoad) return;

    await atribuirConversaAoAgente({
      conversationId,
      agentId: agentWithLowestLoad.id,
    });
  };

  return (
    <button onClick={handleAssign}>
      Atribuir a {agentWithLowestLoad?.nome_chatwoot}
    </button>
  );
}
```

### Task 3: Real-time Conversation Updates

```typescript
'use client';

import { useChatwootRealtime } from '@/features/chatwoot/hooks';

export function ConversationMonitor() {
  const {
    events,
    isConnected,
    lastEventTimestamp,
  } = useChatwootRealtime({
    table: 'conversas_chatwoot',
    events: ['UPDATE'],
    filter: 'status=eq.open', // Only monitor open conversations
  });

  return (
    <div>
      <h2>Real-time Monitor</h2>
      <p>Conexão: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      <p>Eventos: {events.length}</p>
      <p>
        Último evento:
        {lastEventTimestamp?.toLocaleTimeString()}
      </p>
    </div>
  );
}
```

---

## 🛠️ Troubleshooting

### Problem: Hook returns empty array

**Check:**

```typescript
// 1. Verify data exists in database
SELECT COUNT(*) FROM conversas_chatwoot WHERE account_id = 1;

// 2. Check filter being applied
const { filteredConversations } = useChatwootConversations({
  accountId: 1,
  status: 'open', // ← Make sure filter matches data
});

// 3. Verify lastSync timestamp
console.log('Last sync:', lastSync);
```

### Problem: Real-time events not updating

**Check:**

```typescript
// 1. Verify WebSocket connection
const { isConnected } = useChatwootRealtime({
  table: 'conversas_chatwoot',
});
console.log('Connected:', isConnected);

// 2. Check filter syntax (must use PostgreSQL operators)
filter: 'account_id=eq.1' // ✅ Correct
filter: 'account_id = 1'  // ❌ Wrong

// 3. Verify database changes are happening
// Make manual update to test trigger
UPDATE conversas_chatwoot SET status='open' WHERE id=1;
// Event should appear immediately in hook
```

### Problem: Component doesn't re-render

**Check:**

```typescript
// 1. Ensure component is 'use client'
"use client"; // ← Must be present

// 2. Check event has actual data changes
const { events } = useChatwootRealtime({ table: "conversas_chatwoot" });
events.forEach((event) => {
  console.log("Old:", event.old);
  console.log("New:", event.new);
  // ↑ If old === new, no change vs
});

// 3. Verify useTransition is handling action results
const [pending, startTransition] = useTransition();
startTransition(() => syncConversation(id));
```

---

## 📚 API Reference Quick Lookup

### useChatwootConversations

**Options:**

```typescript
{
  accountId: number;           // Required
  status?: 'open' | 'resolved' | 'all'; // Default: 'all'
  autoSync?: boolean;          // Default: true
  syncInterval?: number;       // Default: 30000 (ms)
  limit?: number;             // Default: 100
}
```

**Return:**

```typescript
{
  conversations: ConversasChatwoot[];
  filteredConversations: ConversasChatwoot[];
  loading: boolean;
  error: AppError | null;
  lastSync: Date | null;
  syncConversation(id: number): Promise<void>;
  retrySync(): Promise<void>;
}
```

### useChatwootAgents

**Options:**

```typescript
{
  accountId: number;           // Required
  onlyAvailable?: boolean;     // Default: true
  requiredSkills?: string[];   // Default: []
  autoRefresh?: boolean;       // Default: true
  refreshInterval?: number;    // Default: 60000 (ms)
  sortBy?: 'load' | 'name';   // Default: 'load'
}
```

**Return:**

```typescript
{
  agents: UsuariosChatwoot[];
  filteredAgents: UsuariosChatwoot[];
  agentWithLowestLoad: UsuariosChatwoot | null;
  loading: boolean;
  error: AppError | null;
  refresh(): Promise<void>;
}
```

### useChatwootRealtime

**Options:**

```typescript
{
  table: 'conversas_chatwoot' | 'usuarios_chatwoot' | 'integracao_chatwoot';
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];    // Default: all
  filter?: string;             // PostgreSQL syntax: 'account_id=eq.1'
  maxEvents?: number;          // Default: 50
}
```

**Return:**

```typescript
{
  events: RealtimeEvent[];
  isConnected: boolean;
  error: Error | null;
  lastEventTimestamp: Date | null;
  clearEvents(): void;
  reconnect(): Promise<void>;
}
```

---

## 🚨 Error Handling Pattern

```typescript
'use client';

import { useChatwootConversations } from '@/features/chatwoot/hooks';
import { ErrorBoundary } from '@/components/error-boundary';

export function SafeConversationList() {
  return (
    <ErrorBoundary
      fallback={<div>Erro ao carregar conversas</div>}
      onError={(error) => console.error('Hook error:', error)}
    >
      <ConversationListContent />
    </ErrorBoundary>
  );
}

function ConversationListContent() {
  const {
    filteredConversations,
    loading,
    error,
  } = useChatwootConversations({
    accountId: 1,
    status: 'open',
  });

  if (error) {
    return (
      <div>
        <p>Erro: {error.message}</p>
        <button onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {filteredConversations.length > 0 ? (
        <ul>
          {filteredConversations.map((conv) => (
            <li key={conv.id}>{conv.chatwoot_conversation_id}</li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma conversa aberta</p>
      )}
    </div>
  );
}
```

---

## 📖 Complete Documentation

- [hooks/README.md](./hooks/README.md) - Full API documentation
- [hooks/examples.tsx](./hooks/examples.tsx) - 5 complete examples
- [TASK_8_SUMMARY.md](./TASK_8_SUMMARY.md) - Task 8 implementation details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Full integration overview

---

## ⚡ Performance Tips

1. **Use syncInterval smartly** - Balance freshness vs API load
   - Detail pages: 10 seconds
   - List pages: 30 seconds
   - Dashboards: 60 seconds

2. **Clear event buffer periodically**

   ```typescript
   useEffect(() => {
     const timer = setInterval(clearEvents, 5 * 60 * 1000); // 5 min
     return () => clearInterval(timer);
   }, [clearEvents]);
   ```

3. **Memoize expensive computations**

   ```typescript
   const eligibleAgents = useMemo(
     () => agents.filter((a) => a.disponivel),
     [agents],
   );
   ```

4. **Use React DevTools Profiler**
   - `npm install react-devtools`
   - Check why components re-render
   - Identify expensive renders

---

## ✅ Deployment Checklist

Pre-deployment:

- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Webhook URL configured in Chatwoot
- [ ] Webhook token verified in database
- [ ] Components wrapped with ErrorBoundary
- [ ] Loading states added
- [ ] Error states handled

Post-deployment:

- [ ] Monitor error rates
- [ ] Check real-time latency
- [ ] Verify auto-sync intervals
- [ ] Test load balancing algorithm
- [ ] Review database query performance

---

**Next:** See [hooks/README.md](./hooks/README.md) for complete documentation.
