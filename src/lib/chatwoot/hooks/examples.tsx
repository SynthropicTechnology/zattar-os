/**
 * Exemplo de uso dos hooks Chatwoot
 * 
 * Este arquivo mostra como usar os hooks React para integração com Chatwoot
 */

import {
  useChatwootConversations,
  useChatwootAgents,
  useChatwootRealtime,
  useChatwootConversationChanges,
} from '@/lib/chatwoot/hooks';

// =============================================================================
// Exemplo 1: Listar conversas com sincronização automática
// =============================================================================

export function ConversationsPanel() {
  const {
    filteredConversations,
    loading,
    error,
    lastSync,
    syncConversation,
  } = useChatwootConversations({
    accountId: 1,
    status: 'open',
    autoSync: true,
    syncInterval: 30000, // A cada 30 segundos
  });

  if (loading) return <div>Carregando conversas...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <h2>Conversas Abertas</h2>
      <p>Última sincronização: {lastSync?.toLocaleString()}</p>
      
      <ul>
        {filteredConversations.map((conv) => (
          <li key={conv.id}>
            <span>Conversa #{conv.chatwoot_conversation_id}</span>
            <button onClick={() => syncConversation(Number(conv.chatwoot_conversation_id))}>
              Sincronizar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// Exemplo 2: Listar agentes com smart load balancing
// =============================================================================

export function AgentsPanel() {
  const {
    agents,
    agentWithLowestLoad,
    loading: _loading,
    refresh,
  } = useChatwootAgents({
    accountId: 1,
    onlyAvailable: true,
    requiredSkills: ['legal'],
    autoRefresh: true,
    refreshInterval: 60000,
  });

  return (
    <div>
      <h2>Agentes Disponíveis</h2>
      <button onClick={refresh}>Atualizar</button>
      
      {agentWithLowestLoad && (
        <div>
          <p>
            <strong>Próximo disponível:</strong> {agentWithLowestLoad.nome_chatwoot}
            ({Number(agentWithLowestLoad.contador_conversas_ativas)} conversas ativas)
          </p>
        </div>
      )}
      
      <ul>
        {agents.map((agent) => (
          <li key={agent.id}>
            <span>{agent.nome_chatwoot}</span>
            <span>Conversas: {Number(agent.contador_conversas_ativas)}</span>
            <span>Status: {agent.disponivel ? '🟢 Online' : '🔴 Offline'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// Exemplo 3: Monitorar conversas em tempo real
// =============================================================================

export function ConversationMonitor() {
  const {
    events,
    isConnected,
    error,
    lastEventTimestamp,
  } = useChatwootRealtime({
    table: 'conversas_chatwoot',
    events: ['INSERT', 'UPDATE'],
    filter: 'account_id=eq.1',
  });

  return (
    <div>
      <h2>Monitor de Conversas (Real-time)</h2>
      <p>Status: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
      
      {error && <p style={{ color: 'red' }}>Erro: {error.message}</p>}
      
      <p>Último evento: {lastEventTimestamp?.toLocaleString()}</p>
      <p>Total de eventos: {events.length}</p>
      
      <div>
        {events.slice(0, 10).map((event, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <strong>
              [{event.type}] {event.timestamp.toLocaleTimeString()}
            </strong>
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify(event.new || event.old, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Exemplo 4: Monitorar conversas específicas
// =============================================================================

export function ConversationDetailMonitor({ conversationId }: { conversationId: bigint }) {
  const { events, isConnected } = useChatwootConversationChanges(conversationId);

  return (
    <div>
      <h2>Detalhes da Conversa #{conversationId}</h2>
      <p>Real-time: {isConnected ? '🔴 Ativo' : '⚪ Inativo'}</p>
      
      {events.length > 0 && (
        <div>
          <h3>Últimas alterações:</h3>
          {events.map((event, i) => (
            <div key={i}>
              <p>{event.type} - {event.timestamp.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exemplo 5: Dashboard completo
// =============================================================================

export function ChatwootDashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <ConversationsPanel />
      <AgentsPanel />
      <ConversationMonitor />
    </div>
  );
}
