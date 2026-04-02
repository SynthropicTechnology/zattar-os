# Chatwoot React Hooks

Comprehensive React hooks for Chatwoot integration, providing conversation management, agent coordination, and real-time updates.

## Overview

Three main hooks provide the complete client-side API for Chatwoot integration:

| Hook                       | Purpose                                | Type        | Real-time       |
| -------------------------- | -------------------------------------- | ----------- | --------------- |
| `useChatwootConversations` | Manage conversations with sync         | Stateful    | ✅ Auto-sync    |
| `useChatwootAgents`        | List/filter agents with load balancing | Stateful    | ✅ Auto-refresh |
| `useChatwootRealtime`      | Real-time PostgreSQL change tracking   | Event-based | ✅ WebSocket    |

## Installation

All hooks are exported from the main feature module:

```typescript
import {
  useChatwootConversations,
  useChatwootAgents,
  useChatwootRealtime,
  useChatwootConversationChanges,
  useChatwootUserChanges,
} from "@/features/chatwoot/hooks";
```

---

## useChatwootConversations

Manages conversation state with automatic synchronization and filtering.

### Type Signature

```typescript
interface UseChatwootConversationsOptions {
  accountId: number;
  status?: "open" | "resolved" | "all";
  autoSync?: boolean;
  syncInterval?: number; // milliseconds, default: 30000
  limit?: number; // max conversations, default: 100
}

interface UseChatwootConversationsReturn {
  conversations: ConversasChatwoot[];
  filteredConversations: ConversasChatwoot[];
  loading: boolean;
  error: AppError | null;
  lastSync: Date | null;
  syncConversation(chatwootConversationId: number): Promise<void>;
  retrySync(): Promise<void>;
}
```

### Features

- ✅ Auto-sync conversations at specified interval
- ✅ Filter conversations by status
- ✅ Manual sync trigger
- ✅ Error handling with retry
- ✅ Loading states
- ✅ Last sync timestamp tracking

### Usage Example

```typescript
function ConversationsList() {
  const {
    filteredConversations,
    loading,
    error,
    syncConversation,
  } = useChatwootConversations({
    accountId: 1,
    status: 'open',
    autoSync: true,
    syncInterval: 30000,
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div>
      {filteredConversations.map((conv) => (
        <ConversationCard
          key={conv.id}
          conversation={conv}
          onSync={() =>
            syncConversation(Number(conv.chatwoot_conversation_id))
          }
        />
      ))}
    </div>
  );
}
```

### Auto-sync Behavior

- Initializes on mount if `autoSync: true`
- Runs every `syncInterval` milliseconds
- Stops on component unmount
- Can be manually triggered via `syncConversation()`
- Respects `status` filter from options

---

## useChatwootAgents

Lists and manages agents with smart load balancing.

### Type Signature

```typescript
interface UseChatwootAgentsOptions {
  accountId: number;
  onlyAvailable?: boolean; // default: true
  requiredSkills?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number; // default: 60000
  sortBy?: "load" | "name"; // default: 'load'
}

interface UseChatwootAgentsReturn {
  agents: UsuariosChatwoot[];
  filteredAgents: UsuariosChatwoot[];
  agentWithLowestLoad: UsuariosChatwoot | null;
  loading: boolean;
  error: AppError | null;
  refresh(): Promise<void>;
}
```

### Features

- ✅ Auto-refresh agent list with `autoRefresh: true`
- ✅ Filter by availability status
- ✅ Filter by required skills
- ✅ Auto-sort by load (conversations count)
- ✅ `agentWithLowestLoad` - smart assignment helper
- ✅ Manual refresh trigger

### Using Load Balancing

The hook automatically sorts agents by `contador_conversas_ativas` (active conversation count):

```typescript
const { agentWithLowestLoad } = useChatwootAgents({
  accountId: 1,
  onlyAvailable: true,
  sortBy: "load", // auto-sorts by conversation count
});

if (agentWithLowestLoad) {
  // Assign conversation to agent with lowest load
  assignConversation(conversationId, agentWithLowestLoad.id);
}
```

### Usage Example

```typescript
function AgentSelector() {
  const {
    agents,
    agentWithLowestLoad,
    refresh,
  } = useChatwootAgents({
    accountId: 1,
    onlyAvailable: true,
    requiredSkills: ['legal', 'complex_cases'],
  });

  return (
    <div>
      <button onClick={refresh}>Atualizar</button>

      <select>
        <option value="">
          {agentWithLowestLoad?.nome_chatwoot || 'Nenhum disponível'}
          ({Number(agentWithLowestLoad?.contador_conversas_ativas || 0)})
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.nome_chatwoot} ({Number(agent.contador_conversas_ativas)})
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## useChatwootRealtime

Real-time monitoring of database changes via PostgreSQL subscriptions.

### Type Signature

```typescript
interface UseChatwootRealtimeOptions {
  table: "conversas_chatwoot" | "usuarios_chatwoot" | "integracao_chatwoot";
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
  filter?: string; // PostgreSQL filter syntax
  maxEvents?: number; // max buffer size, default: 50
}

interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  timestamp: Date;
  old: any;
  new: any;
}

interface UseChatwootRealtimeReturn {
  events: RealtimeEvent[];
  isConnected: boolean;
  error: Error | null;
  lastEventTimestamp: Date | null;
  clearEvents(): void;
  reconnect(): Promise<void>;
}
```

### Features

- ✅ Real-time change tracking via PostgreSQL
- ✅ Event buffer (default: 50 events)
- ✅ Automatic connection management
- ✅ Connection state tracking
- ✅ Reconnect on error
- ✅ Event type filtering (INSERT/UPDATE/DELETE)
- ✅ PostgreSQL filter support

### Usage Example

```typescript
function RealtimeConversationMonitor() {
  const {
    events,
    isConnected,
    clearEvents,
  } = useChatwootRealtime({
    table: 'conversas_chatwoot',
    events: ['UPDATE'],
    filter: 'status=eq.open', // only updates to open conversations
  });

  return (
    <div>
      <p>Status: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      <button onClick={clearEvents}>Limpar eventos</button>

      <div>
        {events.map((event, i) => (
          <RealtimeEventCard key={i} event={event} />
        ))}
      </div>
    </div>
  );
}
```

### Convenience Hooks

Two specialized hooks provide filtered monitoring:

#### `useChatwootConversationChanges(conversationId)`

Monitor changes to a specific conversation:

```typescript
const { events, isConnected } = useChatwootConversationChanges(conversationId);
// Automatically filters to: table=conversas_chatwoot AND id=eq.${conversationId}
```

#### `useChatwootUserChanges(userId)`

Monitor changes to a specific user/agent:

```typescript
const { events, isConnected } = useChatwootUserChanges(userId);
// Automatically filters to: table=usuarios_chatwoot AND id=eq.${userId}
```

---

## Real-time Event Example

Events returned from `useChatwootRealtime`:

```typescript
{
  type: 'UPDATE',
  timestamp: 2024-12-18T10:30:45.123Z,
  old: {
    id: 1,
    status: 'open',
    contador_mensagens: 5,
  },
  new: {
    id: 1,
    status: 'resolved',
    contador_mensagens: 8,
  },
}
```

---

## Best Practices

### 1. Use Correct Account Context

Always provide the correct `accountId` to filter conversations:

```typescript
// ❌ Wrong - gets all conversations
useChatwootConversations({ accountId: 0 });

// ✅ Correct - gets account 1 conversations
useChatwootConversations({ accountId: 1 });
```

### 2. Manage Sync Intervals

Balance between freshness and performance:

```typescript
// For dashboard - update every 30 seconds
useChatwootConversations({ syncInterval: 30000 });

// For detail view - update every 10 seconds
useChatwootConversations({ syncInterval: 10000 });

// For monitoring - update every 5 seconds
useChatwootConversations({ syncInterval: 5000 });
```

### 3. Handle Real-time Event Buffer

The event buffer stores max 50 events by default. Clear periodically:

```typescript
useEffect(() => {
  const timer = setInterval(
    () => {
      clearEvents();
    },
    5 * 60 * 1000,
  ); // Clear every 5 minutes

  return () => clearInterval(timer);
}, [clearEvents]);
```

### 4. Error Boundaries

Wrap hooks in error boundaries:

```typescript
<ErrorBoundary
  fallback={<ErrorMessage />}
  onError={(error) => console.error(error)}
>
  <ComponentWithHooks />
</ErrorBoundary>
```

### 5. Load Balancing

Always use `agentWithLowestLoad` for assignment:

```typescript
const { agentWithLowestLoad } = useChatwootAgents({
  onlyAvailable: true,
  sortBy: "load",
});

// Let the hook handle the sorting
const assignToAgent = (conversationId) => {
  if (agentWithLowestLoad) {
    assignConversation(conversationId, agentWithLowestLoad.id);
  }
};
```

---

## Performance Optimizations

### Memoization

Use `useMemo` for expensive computations:

```typescript
const eligibleAgents = useMemo(
  () => agents.filter((a) => a.disponivel && a.skills.includes("legal")),
  [agents],
);
```

### Dependency Optimization

Only include necessary dependencies:

```typescript
// ❌ Too many dependencies
useChatwootConversations({
  accountId,
  status,
  autoSync,
  syncInterval,
});

// ✅ Correct
const conversationOptions = useMemo(
  () => ({ accountId, status, autoSync, syncInterval }),
  [accountId, status, autoSync, syncInterval],
);
useChatwootConversations(conversationOptions);
```

---

## TypeScript Support

All hooks are fully typed:

```typescript
import type {
  UseChatwootConversationsOptions,
  UseChatwootConversationsReturn,
  ConversasChatwoot,
  UsuariosChatwoot,
  RealtimeEvent,
} from "@/features/chatwoot/hooks";
```

---

## Troubleshooting

### Hook returns stale data

Check that `autoSync` or `autoRefresh` is enabled:

```typescript
// Enable auto-sync
useChatwootConversations({ autoSync: true }); // default

// Or manually refresh
const { retrySync } = useChatwootConversations({
  autoSync: false,
});
retrySync();
```

### Real-time events not updating

Verify the filter syntax:

```typescript
// ❌ Invalid filter
filter: "account_id = 1";

// ✅ Valid PostgreSQL filter
filter: "account_id=eq.1";
```

### Components not re-rendering

Verify the event is changing the state:

```typescript
const { events } = useChatwootRealtime({
  table: "conversas_chatwoot",
  events: ["UPDATE"], // only UPDATE events
});

// Check if events exist
console.log(events.length); // should increase on changes
```

---

## Related Files

- [examples.tsx](./examples.tsx) - Complete usage examples
- [use-chatwoot-conversations.ts](./use-chatwoot-conversations.ts) - Implementation
- [use-chatwoot-agents.ts](./use-chatwoot-agents.ts) - Implementation
- [use-chatwoot-realtime.ts](./use-chatwoot-realtime.ts) - Implementation

---

## Integration Map

```
Component
├── useChatwootConversations
│   └── sincronizarConversaManual (server action)
│       └── service.sincronizarConversa()
├── useChatwootAgents
│   └── listarUsuariosAtivos (inherited hook)
│       └── service.listarUsuariosPorAccount()
└── useChatwootRealtime
    └── Supabase Realtime (PostgreSQL LISTEN/NOTIFY)
        └── Database triggers (auto-updates)
```

---

## Next Steps

1. **Integration Testing** - Test hooks with actual components
2. **Error Boundary Wrapping** - Add error boundaries to hook consumers
3. **Performance Monitoring** - Use React DevTools profiler
4. **E2E Testing** - Test webhook → hook update flow
5. **Documentation** - Add JSDoc comments to applications
