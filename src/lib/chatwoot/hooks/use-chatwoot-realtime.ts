/**
 * Hook para real-time updates com Supabase
 * 
 * Monitora mudanças em tempo real nas tabelas Chatwoot
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent<T> {
  type: RealtimeEventType;
  new?: T;
  old?: T;
  timestamp: Date;
}

export interface UseChatwootRealtimeOptions {
  /** Tabela a monitorar */
  table: 'conversas_chatwoot' | 'usuarios_chatwoot';
  /** Eventos a escutar (padrão: INSERT, UPDATE, DELETE) */
  events?: RealtimeEventType[];
  /** Habilitar/desabilitar (padrão: true) */
  enabled?: boolean;
  /** Filtro SQL (ex: 'account_id=eq.1') */
  filter?: string;
}

export interface UseChatwootRealtimeState<T> {
  events: RealtimeEvent<T>[];
  isConnected: boolean;
  error: Error | null;
  lastEventTimestamp: Date | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook para monitorar mudanças em tempo real
 * 
 * @example
 * ```tsx
 * const { events, isConnected } = useChatwootRealtime<ConversaChatwoot>({
 *   table: 'conversas_chatwoot',
 *   events: ['INSERT', 'UPDATE'],
 *   filter: 'account_id=eq.1'
 * });
 * ```
 */
export function useChatwootRealtime<T = unknown>(
  options: UseChatwootRealtimeOptions
) {
  const {
    table,
    events = ['INSERT', 'UPDATE', 'DELETE'],
    enabled = true,
    filter,
  } = options;

  const [state, setState] = useState<UseChatwootRealtimeState<T>>({
    events: [],
    isConnected: false,
    error: null,
    lastEventTimestamp: null,
  });

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Conectar ao Realtime
  useEffect(() => {
    if (!enabled) return;

    try {
      const supabase = createClient();
      const channelName = `${table}${filter ? `:${filter}` : ''}`;

      const newChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: events.length > 0 ? (events as unknown as '*') : '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            const event: RealtimeEvent<T> = {
              type: payload.eventType as RealtimeEventType,
              new: payload.new as T | undefined,
              old: payload.old as T | undefined,
              timestamp: new Date(),
            };

            setState((prev) => ({
              ...prev,
              events: [event, ...prev.events.slice(0, 49)], // Manter últimos 50
              lastEventTimestamp: new Date(),
            }));
          }
        )
        .subscribe((status) => {
          setState((prev) => ({
            ...prev,
            isConnected: status === 'SUBSCRIBED',
            error: status === 'CHANNEL_ERROR' ? new Error('Channel error') : null,
          }));
        });

      setChannel(newChannel);

      return () => {
        newChannel.unsubscribe();
      };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [enabled, table, events, filter]);

  // Limpar eventos
  const clearEvents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      events: [],
    }));
  }, []);

  // Reconectar
  const reconnect = useCallback(async () => {
    if (channel) {
      await channel.unsubscribe();
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    }
  }, [channel]);

  return {
    ...state,
    clearEvents,
    reconnect,
  };
}

/**
 * Hook para monitorar alterações em uma conversa específica
 */
export function useChatwootConversationChanges(conversationId: bigint | number) {
  return useChatwootRealtime<Record<string, unknown>>({
    table: 'conversas_chatwoot',
    filter: `id=eq.${conversationId}`,
  });
}

/**
 * Hook para monitorar alterações em um usuário específico
 */
export function useChatwootUserChanges(userId: string) {
  return useChatwootRealtime<Record<string, unknown>>({
    table: 'usuarios_chatwoot',
    filter: `usuario_id=eq.${userId}`,
  });
}
